import Phaser from "phaser";
import { animationKey, registerCoreAnimations } from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import { MONSTER_CATALOG } from "../data/catalog";
import { centeredBodyOffsetX, groundedBodyOffsetY } from "./sprite-layout";

const INITIAL_IDLE_MS = 520;
const TURN_IDLE_MS = 260;
const greenMushroomSheet = spriteManifest.sheets.greenMushroom;
if (!greenMushroomSheet) {
  throw new Error("Green mushroom sprite manifest entry is missing.");
}
const hurtAnimation = greenMushroomSheet.animations.hurt;
if (!hurtAnimation) {
  throw new Error("Green mushroom hurt animation manifest entry is missing.");
}
const HURT_DURATION_MS = hurtAnimation.frames.length * hurtAnimation.frameDurationMs;
const HIT_FLASH_DURATION_MS = 72;
const HIT_FLASH_TINT = 0xffffff;
const BODY_WIDTH = 54;
const BODY_HEIGHT = 42;

export interface GreenMushroomOptions {
  id: string;
  patrolMinX: number;
  patrolMaxX: number;
  respawnMs: number;
  onRespawn?: (monster: GreenMushroom) => void;
}

export interface MonsterDamageResult {
  applied: boolean;
  defeated: boolean;
  remainingHp: number;
  appliedDamage: number;
}

export type DefeatAnimationCompleteListener = (monster: GreenMushroom) => void;

export class GreenMushroom extends Phaser.Physics.Arcade.Sprite {
  readonly monsterId: string;
  private readonly spawnX: number;
  private readonly spawnY: number;
  private readonly patrolMinX: number;
  private readonly patrolMaxX: number;
  private readonly respawnMs: number;
  private readonly onRespawn?: (monster: GreenMushroom) => void;
  private hp: number = MONSTER_CATALOG.greenMushroom.maxHp;
  private direction = 1;
  private defeated = false;
  private defeatAnimationCompleted = false;
  private readonly defeatAnimationCompleteListeners = new Set<() => void>();
  private hurtUntil = 0;
  private hitFlashGeneration = 0;
  private hitFlashTimer?: Phaser.Time.TimerEvent;
  private idleUntil: number;
  private respawnTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, x: number, y: number, options: GreenMushroomOptions) {
    super(scene, x, y, MONSTER_CATALOG.greenMushroom.spriteSheet, 0);
    this.monsterId = options.id;
    this.spawnX = x;
    this.spawnY = y;
    this.patrolMinX = options.patrolMinX;
    this.patrolMaxX = options.patrolMaxX;
    this.respawnMs = options.respawnMs;
    this.onRespawn = options.onRespawn;
    this.idleUntil = scene.time.now + INITIAL_IDLE_MS;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    registerCoreAnimations(scene);
    this.setOrigin(0.5, 1).setDepth(9);
    this.arcadeBody().setSize(BODY_WIDTH, BODY_HEIGHT).setMaxVelocity(90, 900);
    const syncBodyToFrameOrigin = (): void => this.syncBodyToFrameOrigin();
    this.on(Phaser.Animations.Events.ANIMATION_START, syncBodyToFrameOrigin);
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, syncBodyToFrameOrigin);
    this.play(animationKey("greenMushroom", "idle"));
    this.syncBodyToFrameOrigin();
  }

  updatePatrol(now: number): void {
    const body = this.arcadeBody();
    if (this.defeated) {
      return;
    }
    if (now < this.hurtUntil) {
      body.setVelocityX(0);
      return;
    }

    if (now < this.idleUntil) {
      body.setVelocityX(0);
      this.play(animationKey("greenMushroom", "idle"), true);
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
      this.play(animationKey("greenMushroom", "idle"), true);
      return;
    }
    this.setFlipX(this.direction < 0);
    body.setVelocityX(this.direction * MONSTER_CATALOG.greenMushroom.moveSpeed);
    this.play(animationKey("greenMushroom", "walk"), true);
  }

  takeDamage(amount: number): MonsterDamageResult {
    if (this.defeated || amount <= 0) {
      return {
        applied: false,
        defeated: this.defeated,
        remainingHp: this.hp,
        appliedDamage: 0,
      };
    }

    const previousHp = this.hp;
    this.hp = Math.max(0, this.hp - amount);
    const appliedDamage = previousHp - this.hp;
    this.flashHit();
    if (this.hp === 0) {
      this.beginDefeat();
      return { applied: true, defeated: true, remainingHp: 0, appliedDamage };
    }

    this.hurtUntil = this.scene.time.now + HURT_DURATION_MS;
    this.setVelocityX(0);
    this.play(animationKey("greenMushroom", "hurt"), true);
    return {
      applied: true,
      defeated: false,
      remainingHp: this.hp,
      appliedDamage,
    };
  }

  isAlive(): boolean {
    return !this.defeated;
  }

  onceDefeatAnimationComplete(listener: DefeatAnimationCompleteListener): () => void {
    let subscribed = true;
    const invoke = (): void => {
      if (!subscribed) {
        return;
      }
      subscribed = false;
      listener(this);
    };

    if (this.defeated && this.defeatAnimationCompleted) {
      queueMicrotask(() => {
        if (this.active) {
          invoke();
        }
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
    this.play(animationKey("greenMushroom", "defeat"), true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.scene || !this.active) {
        return;
      }
      this.defeatAnimationCompleted = true;
      this.setVisible(false);
      this.respawnTimer = this.scene.time.delayedCall(this.respawnMs, () => this.respawn());
      const listeners = [...this.defeatAnimationCompleteListeners];
      this.defeatAnimationCompleteListeners.clear();
      listeners.forEach((listener) => listener());
    });
  }

  private respawn(): void {
    if (!this.scene || !this.active) {
      return;
    }
    this.hp = MONSTER_CATALOG.greenMushroom.maxHp;
    this.defeated = false;
    this.defeatAnimationCompleted = false;
    this.direction = 1;
    this.hurtUntil = 0;
    this.idleUntil = this.scene.time.now + INITIAL_IDLE_MS;
    this.clearHitFlash();
    this.setPosition(this.spawnX, this.spawnY).setVisible(true).setAlpha(1);
    const body = this.arcadeBody();
    body.enable = true;
    body.reset(this.spawnX, this.spawnY);
    this.play(animationKey("greenMushroom", "idle"), true);
    this.onRespawn?.(this);
  }

  private flashHit(): void {
    const generation = ++this.hitFlashGeneration;
    this.hitFlashTimer?.remove(false);
    this.setTintFill(HIT_FLASH_TINT);
    this.hitFlashTimer = this.scene.time.delayedCall(HIT_FLASH_DURATION_MS, () => {
      if (generation !== this.hitFlashGeneration) {
        return;
      }
      this.hitFlashTimer = undefined;
      if (this.active) {
        this.clearTint();
      }
    });
  }

  private clearHitFlash(): void {
    this.hitFlashGeneration += 1;
    this.hitFlashTimer?.remove(false);
    this.hitFlashTimer = undefined;
    this.clearTint();
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    if (!this.body) {
      throw new Error("Green mushroom is missing its Arcade Physics body.");
    }
    return this.body as Phaser.Physics.Arcade.Body;
  }

  private syncBodyToFrameOrigin(): void {
    this.arcadeBody().setOffset(
      centeredBodyOffsetX(this.displayOriginX, BODY_WIDTH),
      groundedBodyOffsetY(this.displayOriginY, BODY_HEIGHT),
    );
  }
}
