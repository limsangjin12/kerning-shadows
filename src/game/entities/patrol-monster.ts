import Phaser from "phaser";
import { animationKey, registerCoreAnimations } from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import {
  bossRangedAttackFor,
  canUseBossRangedAttack,
  onePunchManPhaseFor,
  type BossRangedAttackDefinition,
} from "../combat/boss-ranged-attack-rules";
import { resolveMonsterDamage } from "../combat/monster-combat-rules";
import {
  MONSTER_CATALOG,
  monsterKnockbackImmune,
  type MonsterKind,
} from "../data/catalog";
import { centeredBodyOffsetX, groundedBodyOffsetY } from "./sprite-layout";

const INITIAL_IDLE_MS = 520;
const TURN_IDLE_MS = 260;
const HIT_FLASH_DURATION_MS = 72;
const HIT_FLASH_TINT = 0xffffff;

export interface PatrolMonsterOptions {
  id: string;
  kind: MonsterKind;
  patrolMinX: number;
  patrolMaxX: number;
  respawnMs: number;
  onRespawn?: (monster: PatrolMonster) => void;
}

export interface MonsterDamageResult {
  applied: boolean;
  defeated: boolean;
  remainingHp: number;
  resolvedDamage: number;
  appliedDamage: number;
  enteredBossPhase?: 2;
}

export interface MonsterHealthSnapshot {
  current: number;
  maximum: number;
}

export type DefeatAnimationCompleteListener = (monster: PatrolMonster) => void;

export class PatrolMonster extends Phaser.Physics.Arcade.Sprite {
  readonly monsterId: string;
  readonly monsterKind: MonsterKind;
  private readonly spawnX: number;
  private readonly spawnY: number;
  private readonly patrolMinX: number;
  private readonly patrolMaxX: number;
  private readonly respawnMs: number;
  private readonly onRespawn?: (monster: PatrolMonster) => void;
  private readonly hurtDurationMs: number;
  private readonly hasRangedAttack: boolean;
  private hp: number;
  private direction = 1;
  private defeated = false;
  private defeatAnimationCompleted = false;
  private readonly defeatAnimationCompleteListeners = new Set<() => void>();
  private hurtUntil = 0;
  private attackUntil = 0;
  private nextRangedAttackAt = Number.POSITIVE_INFINITY;
  private hitFlashGeneration = 0;
  private hitFlashTimer?: Phaser.Time.TimerEvent;
  private idleUntil: number;
  private respawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, options: PatrolMonsterOptions) {
    const catalog = MONSTER_CATALOG[options.kind];
    super(scene, x, y, catalog.spriteSheet, 0);
    this.monsterId = options.id;
    this.monsterKind = options.kind;
    this.spawnX = x;
    this.spawnY = y;
    this.patrolMinX = options.patrolMinX;
    this.patrolMaxX = options.patrolMaxX;
    this.respawnMs = options.respawnMs;
    this.onRespawn = options.onRespawn;
    this.hp = catalog.maxHp;
    this.idleUntil = scene.time.now + INITIAL_IDLE_MS;
    const initialRangedAttack = bossRangedAttackFor(options.kind);
    this.hasRangedAttack = initialRangedAttack !== null;
    if (initialRangedAttack) {
      this.nextRangedAttackAt =
        scene.time.now + initialRangedAttack.initialDelayMs;
    }

    const sheet = spriteManifest.sheets[catalog.spriteSheet];
    const hurtAnimation = sheet?.animations.hurt;
    if (!sheet || !hurtAnimation) {
      throw new Error(`Monster sprite manifest entry is missing: ${catalog.spriteSheet}.`);
    }
    this.hurtDurationMs =
      hurtAnimation.frames.length * hurtAnimation.frameDurationMs;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    registerCoreAnimations(scene);
    this.setOrigin(sheet.origin.x, sheet.origin.y)
      .setScale(catalog.visualScale)
      .setDepth(
        catalog.bossRank === "finalboss"
          ? 13
          : catalog.bossRank === "upperboss"
            ? 12
            : catalog.bossRank === "midboss"
              ? 11
            : catalog.spriteSheet === "abyssGolem"
              ? 10
              : 9,
      );
    this.arcadeBody()
      .setSize(catalog.bodyWidth, catalog.bodyHeight)
      .setMaxVelocity(Math.max(90, catalog.moveSpeed + 20), 900);
    this.setPushable(!monsterKnockbackImmune(this.monsterKind));
    const syncBodyToFrameOrigin = (): void => this.syncBodyToFrameOrigin();
    this.on(Phaser.Animations.Events.ANIMATION_START, syncBodyToFrameOrigin);
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, syncBodyToFrameOrigin);
    this.play(animationKey(catalog.spriteSheet, "idle"));
    this.syncBodyToFrameOrigin();
  }

  updatePatrol(now: number): void {
    const body = this.arcadeBody();
    const catalog = MONSTER_CATALOG[this.monsterKind];
    if (this.defeated) return;
    if (now < this.attackUntil) {
      body.setVelocityX(0);
      return;
    }
    if (now < this.hurtUntil) {
      body.setVelocityX(0);
      return;
    }
    if (now < this.idleUntil) {
      body.setVelocityX(0);
      this.play(animationKey(catalog.spriteSheet, "idle"), true);
      return;
    }

    if ((this.x <= this.patrolMinX || body.blocked.left) && this.direction < 0) {
      this.direction = 1;
      this.idleUntil = now + TURN_IDLE_MS;
    } else if ((this.x >= this.patrolMaxX || body.blocked.right) && this.direction > 0) {
      this.direction = -1;
      this.idleUntil = now + TURN_IDLE_MS;
    }
    if (now < this.idleUntil) {
      body.setVelocityX(0);
      this.setFlipX(this.direction < 0);
      this.play(animationKey(catalog.spriteSheet, "idle"), true);
      return;
    }
    this.setFlipX(this.direction < 0);
    body.setVelocityX(this.direction * catalog.moveSpeed);
    this.play(animationKey(catalog.spriteSheet, "walk"), true);
  }

  takeDamage(amount: number): MonsterDamageResult {
    if (this.defeated || amount <= 0) {
      return {
        applied: false,
        defeated: this.defeated,
        remainingHp: this.hp,
        resolvedDamage: 0,
        appliedDamage: 0,
      };
    }
    const phaseBefore = this.monsterKind === "onePunchMan"
      ? onePunchManPhaseFor(this.hp, MONSTER_CATALOG.onePunchMan.maxHp)
      : 1;
    const resolution = resolveMonsterDamage(
      amount,
      MONSTER_CATALOG[this.monsterKind].defense,
      this.hp,
    );
    this.hp = resolution.remainingHp;
    this.flashHit();
    if (this.hp === 0) {
      this.beginDefeat();
      return { applied: true, defeated: true, ...resolution };
    }

    const enteredBossPhase =
      this.monsterKind === "onePunchMan" &&
      phaseBefore === 1 &&
      onePunchManPhaseFor(this.hp, MONSTER_CATALOG.onePunchMan.maxHp) === 2
        ? 2
        : undefined;
    if (monsterKnockbackImmune(this.monsterKind)) {
      return {
        applied: true,
        defeated: false,
        ...resolution,
        enteredBossPhase,
      };
    }

    this.hurtUntil = this.scene.time.now + this.hurtDurationMs;
    this.setVelocityX(0);
    this.play(
      animationKey(MONSTER_CATALOG[this.monsterKind].spriteSheet, "hurt"),
      true,
    );
    return { applied: true, defeated: false, ...resolution, enteredBossPhase };
  }

  isAlive(): boolean {
    return !this.defeated;
  }

  healthSnapshot(): MonsterHealthSnapshot {
    return {
      current: this.hp,
      maximum: MONSTER_CATALOG[this.monsterKind].maxHp,
    };
  }

  playContactAttack(): void {
    const catalog = MONSTER_CATALOG[this.monsterKind];
    const attack = spriteManifest.sheets[catalog.spriteSheet]?.animations.attack;
    if (
      catalog.bossRank === "normal" ||
      this.defeated ||
      this.scene.time.now < this.attackUntil ||
      this.scene.time.now < this.hurtUntil ||
      !attack
    ) {
      return;
    }
    this.attackUntil =
      this.scene.time.now + attack.frames.length * attack.frameDurationMs;
    this.setVelocityX(0);
    this.play(animationKey(catalog.spriteSheet, "attack"), true);
  }

  tryStartRangedAttack(
    now: number,
    targetX: number,
    targetY: number,
  ): BossRangedAttackDefinition | null {
    const definition = bossRangedAttackFor(
      this.monsterKind,
      this.healthSnapshot(),
    );
    if (!definition) return null;
    if (
      !canUseBossRangedAttack(
        {
          alive: !this.defeated,
          busy: now < this.attackUntil || now < this.hurtUntil,
          now,
          readyAt: this.nextRangedAttackAt,
          deltaX: targetX - this.x,
          deltaY: targetY - this.y,
        },
        definition,
      )
    ) {
      return null;
    }

    const catalog = MONSTER_CATALOG[this.monsterKind];
    const attack = spriteManifest.sheets[catalog.spriteSheet]?.animations.attack;
    if (!attack) return null;
    const animationDurationMs = attack.frames.length * attack.frameDurationMs;
    this.direction = targetX < this.x ? -1 : 1;
    this.nextRangedAttackAt = now + definition.cooldownMs;
    this.attackUntil = now + Math.max(definition.windupMs, animationDurationMs);
    this.setVelocityX(0);
    this.setFlipX(this.direction < 0);
    this.play(animationKey(catalog.spriteSheet, "attack"), true);
    return definition;
  }

  onceDefeatAnimationComplete(listener: DefeatAnimationCompleteListener): () => void {
    let subscribed = true;
    const invoke = (): void => {
      if (!subscribed) return;
      subscribed = false;
      listener(this);
    };
    if (this.defeated && this.defeatAnimationCompleted) {
      queueMicrotask(() => {
        if (this.active) invoke();
      });
    } else {
      this.defeatAnimationCompleteListeners.add(invoke);
    }
    return () => {
      subscribed = false;
      this.defeatAnimationCompleteListeners.delete(invoke);
    };
  }

  override destroy(fromScene?: boolean): void {
    this.clearHitFlash();
    this.defeatAnimationCompleteListeners.clear();
    this.respawnTimer?.remove(false);
    super.destroy(fromScene);
  }

  private beginDefeat(): void {
    this.defeated = true;
    this.defeatAnimationCompleted = false;
    const body = this.arcadeBody();
    body.setVelocity(0, 0);
    body.enable = false;
    this.play(
      animationKey(MONSTER_CATALOG[this.monsterKind].spriteSheet, "defeat"),
      true,
    );
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.scene || !this.active) return;
      this.defeatAnimationCompleted = true;
      this.setVisible(false);
      this.respawnTimer = this.scene.time.delayedCall(this.respawnMs, () => this.respawn());
      const listeners = [...this.defeatAnimationCompleteListeners];
      this.defeatAnimationCompleteListeners.clear();
      listeners.forEach((listener) => listener());
    });
  }

  private respawn(): void {
    if (!this.scene || !this.active) return;
    this.hp = MONSTER_CATALOG[this.monsterKind].maxHp;
    this.defeated = false;
    this.defeatAnimationCompleted = false;
    this.direction = 1;
    this.hurtUntil = 0;
    this.attackUntil = 0;
    const initialRangedAttack = this.hasRangedAttack
      ? bossRangedAttackFor(this.monsterKind)
      : null;
    this.nextRangedAttackAt = initialRangedAttack
      ? this.scene.time.now + initialRangedAttack.initialDelayMs
      : Number.POSITIVE_INFINITY;
    this.idleUntil = this.scene.time.now + INITIAL_IDLE_MS;
    this.clearHitFlash();
    this.setPosition(this.spawnX, this.spawnY).setVisible(true).setAlpha(1);
    const body = this.arcadeBody();
    body.enable = true;
    body.reset(this.spawnX, this.spawnY);
    this.play(
      animationKey(MONSTER_CATALOG[this.monsterKind].spriteSheet, "idle"),
      true,
    );
    this.onRespawn?.(this);
  }

  private flashHit(): void {
    const generation = ++this.hitFlashGeneration;
    this.hitFlashTimer?.remove(false);
    this.setTintFill(HIT_FLASH_TINT);
    this.hitFlashTimer = this.scene.time.delayedCall(HIT_FLASH_DURATION_MS, () => {
      if (generation !== this.hitFlashGeneration) return;
      this.hitFlashTimer = undefined;
      if (this.active) this.clearTint();
    });
  }

  private clearHitFlash(): void {
    this.hitFlashGeneration += 1;
    this.hitFlashTimer?.remove(false);
    this.hitFlashTimer = undefined;
    this.clearTint();
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    if (!this.body) throw new Error("Patrol monster is missing its Arcade body.");
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private syncBodyToFrameOrigin(): void {
    const catalog = MONSTER_CATALOG[this.monsterKind];
    this.arcadeBody().setOffset(
      centeredBodyOffsetX(this.displayOriginX, catalog.bodyWidth),
      groundedBodyOffsetY(this.displayOriginY, catalog.bodyHeight),
    );
  }
}
