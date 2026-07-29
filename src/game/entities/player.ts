import Phaser from "phaser";
import {
  animationKey,
  registerCoreAnimations,
} from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import {
  ATTACK_DEFINITIONS,
  AttackKind,
  attackSpeedMultiplier,
  basicAttackKind,
  shiftAttackKind,
  type AttackKind as AttackKindType,
} from "../combat/combat-rules";
import { PlayerJob, type PlayerJob as PlayerJobType } from "../data/catalog";
import { GameAction } from "../input/actions";
import type { InputController } from "../input/input-controller";
import { SkillId } from "../skills/skill-rules";
import {
  horizontalVelocityForActionStart,
  playerAirborneHorizontalVelocity,
  playerAirborneAnimation,
  playerWalkAnimationTimeScale,
  PLAYER_WALK_START_FRAME,
  playerMoveSpeed,
} from "./player-motion";
import {
  centeredPlayerBodyOffsetX,
  groundedPlayerBodyOffsetY,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  playerNameplateOffsetY,
} from "./player-layout";
import { PLAYER_SHEET_BY_JOB } from "./player-appearance";
import {
  canAttachToClimbable,
  clampClimbY,
  climbVelocity,
  shouldDetachFromClimbable,
  type ClimbableBounds,
} from "./climb-rules";
import { PIXEL_FONT_FAMILY } from "../ui/ui-theme";

const MOVE_ACCELERATION = 1500;
const GROUND_DRAG = 1800;
const JUMP_SPEED = 660;
export class Player extends Phaser.Physics.Arcade.Sprite {
  private actionLocked = false;
  private actionAnimationTimeScale = 1;
  private hurtUntil = 0;
  private combatActionHandler?: (kind: AttackKindType) => boolean;
  private combatActionBlockedHandler?: () => void;
  private transformationToggleHandler?: () => boolean;
  private jumpHandler?: () => void;
  private platformDropHandler?: () => boolean;
  private playerSheetKey: string;
  private hurtDurationMs = 430;
  private nineTailsTransformationActive = false;
  private climbCandidate?: ClimbableBounds;
  private activeClimbable?: ClimbableBounds;
  private readonly nameLabel: Phaser.GameObjects.Text;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    job: PlayerJobType = PlayerJob.Beginner,
    name = "루키",
  ) {
    const playerSheetKey = PLAYER_SHEET_BY_JOB[job];
    super(scene, x, y, playerSheetKey, 0);
    this.playerSheetKey = playerSheetKey;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.nameLabel = scene.add
      .text(x, y + playerNameplateOffsetY(), name, {
        color: "#ffffff",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "13px",
        backgroundColor: "#071115c7",
        padding: { x: 5, y: 2 },
        stroke: "#111111",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0)
      .setDepth(11);
    registerCoreAnimations(scene);

    const origin = spriteManifest.sheets[playerSheetKey]?.origin;
    this.setOrigin(origin?.x ?? 0.5, origin?.y ?? 1);
    this.setDepth(10);
    this.setCollideWorldBounds(true);
    this.arcadeBody()
      .setSize(PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT)
      .setOffset(
        centeredPlayerBodyOffsetX(this.displayOriginX),
        groundedPlayerBodyOffsetY(this.displayOriginY),
      )
      .setMaxVelocity(playerMoveSpeed(false), 900)
      .setDragX(GROUND_DRAG);
    const syncBodyToFrameOrigin = (): void => {
      this.syncBodyToFrameOrigin();
    };
    this.on(Phaser.Animations.Events.ANIMATION_START, syncBodyToFrameOrigin);
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, syncBodyToFrameOrigin);
    this.updateHurtDuration();
    this.play(this.playerAnimationKey("idle"));
    this.syncBodyToFrameOrigin();

    this.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.actionLocked = false;
      this.actionAnimationTimeScale = 1;
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.nameLabel
      .setPosition(this.x, this.y + playerNameplateOffsetY())
      .setVisible(this.visible && this.active);
  }

  nameplateState(): { x: number; y: number; visible: boolean } {
    return {
      x: this.nameLabel.x,
      y: this.nameLabel.y,
      visible: this.nameLabel.visible && this.nameLabel.active,
    };
  }

  destroy(fromScene?: boolean): void {
    if (this.nameLabel.active) this.nameLabel.destroy(fromScene);
    super.destroy(fromScene);
  }

  updateFromInput(input: InputController): void {
    const body = this.arcadeBody();
    this.anims.timeScale = this.actionLocked
      ? this.actionAnimationTimeScale
      : 1;
    const hurtActive = this.scene.time.now < this.hurtUntil;
    const jumpPressed = input.consumePressed(GameAction.Jump);
    if (!hurtActive && this.updateClimbing(input, jumpPressed)) {
      return;
    }
    if (!hurtActive && jumpPressed && body.blocked.down) {
      if (input.isDown(GameAction.MoveDown)) {
        this.platformDropHandler?.();
      } else {
        this.setVelocityY(-JUMP_SPEED);
        this.jumpHandler?.();
      }
    }

    const moveLeft = input.isDown(GameAction.MoveLeft);
    const moveRight = input.isDown(GameAction.MoveRight);
    const direction = Number(moveRight) - Number(moveLeft);

    if (this.tryAction(input)) {
      if (!hurtActive && !body.blocked.down) {
        this.applyAirborneHorizontalControl(body, direction);
      }
      return;
    }

    if (hurtActive) {
      this.setAccelerationX(0);
      return;
    }

    if (this.actionLocked) {
      if (!body.blocked.down) {
        this.applyAirborneHorizontalControl(body, direction);
      } else {
        this.setAccelerationX(0);
      }
      if (body.blocked.down && body.velocity.y >= 0) {
        this.setVelocityX(0);
      }
      return;
    }

    if (!body.blocked.down) {
      this.applyAirborneHorizontalControl(body, direction);
    } else {
      this.setAccelerationX(direction * MOVE_ACCELERATION);
      body.setDragX(direction === 0 ? GROUND_DRAG : 0);
      if (direction !== 0) {
        this.setFlipX(direction < 0);
      }
    }

    if (!body.blocked.down) {
      const animation = playerAirborneAnimation(body.velocity.y);
      this.play(this.playerAnimationKey(animation), true);
    } else if (direction !== 0) {
      this.anims.timeScale = playerWalkAnimationTimeScale(
        body.velocity.x,
        this.nineTailsTransformationActive,
      );
      this.play(
        {
          key: this.playerAnimationKey("walk"),
          startFrame: PLAYER_WALK_START_FRAME,
        },
        true,
      );
    } else {
      this.play(this.playerAnimationKey("idle"), true);
    }
  }

  setCombatActionHandler(handler: (kind: AttackKindType) => boolean): void {
    this.combatActionHandler = handler;
  }

  setCombatActionBlockedHandler(handler: () => void): void {
    this.combatActionBlockedHandler = handler;
  }

  setTransformationToggleHandler(handler: () => boolean): void {
    this.transformationToggleHandler = handler;
  }

  setNineTailsTransformationActive(active: boolean): void {
    this.nineTailsTransformationActive = active;
    this.arcadeBody().setMaxVelocity(playerMoveSpeed(active), 900);
  }

  setJumpHandler(handler: () => void): void {
    this.jumpHandler = handler;
  }

  setPlatformDropHandler(handler: () => boolean): void {
    this.platformDropHandler = handler;
  }

  setClimbCandidate(climbable: ClimbableBounds | undefined): void {
    this.climbCandidate = climbable;
  }

  isClimbing(): boolean {
    return this.activeClimbable !== undefined;
  }

  canStartClimbing(): boolean {
    return this.climbCandidate !== undefined;
  }

  activeClimbableId(): string | undefined {
    return this.activeClimbable?.id;
  }

  cancelClimb(): void {
    this.activeClimbable = undefined;
    this.climbCandidate = undefined;
    this.arcadeBody().allowGravity = true;
  }

  isActionLocked(): boolean {
    return this.actionLocked || this.scene.time.now < this.hurtUntil;
  }

  facingDirection(): -1 | 1 {
    return this.flipX ? -1 : 1;
  }

  motionState(): { animation: string; frame: number; timeScale: number } {
    const animationKey = this.anims.currentAnim?.key ?? "none";
    return {
      animation: animationKey.split(":").at(-1) ?? "none",
      frame: this.anims.currentFrame?.index ?? -1,
      timeScale: this.anims.timeScale,
    };
  }

  setJobAppearance(job: PlayerJobType): void {
    const nextSheetKey = PLAYER_SHEET_BY_JOB[job];
    if (nextSheetKey === this.playerSheetKey) return;
    const sheet = spriteManifest.sheets[nextSheetKey];
    if (!sheet)
      throw new Error(
        `Player sprite manifest entry is missing: ${nextSheetKey}.`,
      );
    this.playerSheetKey = nextSheetKey;
    this.setTexture(nextSheetKey, 0).setOrigin(sheet.origin.x, sheet.origin.y);
    this.updateHurtDuration();
    this.play(this.playerAnimationKey("idle"), true);
    this.syncBodyToFrameOrigin();
  }

  playHurt(sourceX: number): void {
    this.cancelClimb();
    const direction = this.x < sourceX ? -1 : 1;
    this.actionLocked = false;
    this.hurtUntil = this.scene.time.now + this.hurtDurationMs;
    this.setAccelerationX(0);
    this.setVelocity(direction * 270, -260);
    this.play(this.playerAnimationKey("hurt"), true);
  }

  stopForDialog(): void {
    this.cancelClimb();
    this.setAccelerationX(0);
    this.setVelocityX(0);
  }

  private updateClimbing(
    input: InputController,
    jumpPressed: boolean,
  ): boolean {
    const body = this.arcadeBody();
    const movingUp = input.isDown(GameAction.Interact);
    const movingDown = input.isDown(GameAction.MoveDown);
    const movingLeft = input.isDown(GameAction.MoveLeft);
    const movingRight = input.isDown(GameAction.MoveRight);
    let attachedNow = false;

    if (
      !this.activeClimbable &&
      this.climbCandidate &&
      canAttachToClimbable(
        this.x,
        this.y,
        this.climbCandidate,
        movingUp,
        movingDown,
      )
    ) {
      this.activeClimbable = this.climbCandidate;
      body.allowGravity = false;
      this.setAcceleration(0, 0).setVelocity(0, 0).setX(this.activeClimbable.x);
      attachedNow = true;
    }

    const climbable = this.activeClimbable;
    if (!climbable) return false;

    if (
      shouldDetachFromClimbable(
        movingLeft,
        movingRight,
        jumpPressed && !attachedNow,
      )
    ) {
      this.activeClimbable = undefined;
      body.allowGravity = true;
      const direction = Number(movingRight) - Number(movingLeft);
      this.setAcceleration(0, 0).setVelocity(
        direction * playerMoveSpeed(this.nineTailsTransformationActive),
        jumpPressed ? -JUMP_SPEED : -120,
      );
      if (direction !== 0) this.setFlipX(direction < 0);
      return true;
    }

    const velocityY = climbVelocity(movingUp, movingDown);
    this.setX(climbable.x);
    this.setY(clampClimbY(this.y, climbable));
    this.setAcceleration(0, 0).setVelocity(0, velocityY);
    if (velocityY !== 0) {
      this.anims.timeScale = 0.75;
      this.play(
        {
          key: this.playerAnimationKey("walk"),
          startFrame: PLAYER_WALK_START_FRAME,
        },
        true,
      );
    } else {
      this.play(this.playerAnimationKey("idle"), true);
    }
    return true;
  }

  private tryAction(input: InputController): boolean {
    const basicPressed = input.consumePressed(GameAction.BasicAttack);
    const luckySevenPressed = input.consumePressed(GameAction.LuckySeven);
    const shadowVolleyPressed = input.consumePressed(GameAction.ShadowVolley);
    const drainPressed = input.consumePressed(GameAction.Drain);
    const phantomStarsPressed = input.consumePressed(GameAction.PhantomStars);
    const avengerPressed = input.consumePressed(GameAction.Avenger);
    const abyssRainPressed = input.consumePressed(GameAction.AbyssRain);
    const rasenganPressed = input.consumePressed(GameAction.Rasengan);
    const transformationPressed = input.consumePressed(
      GameAction.NineTailsTransformation,
    );
    const tailedBeastBombPressed = input.consumePressed(
      GameAction.TailedBeastBomb,
    );
    const teamAssaultPressed = input.consumePressed(GameAction.TeamAssault);
    const thunderOrbPressed = input.consumePressed(GameAction.ThunderOrb);
    if (transformationPressed) {
      if (this.isActionLocked()) {
        this.combatActionBlockedHandler?.();
        return true;
      }
      if (this.transformationToggleHandler?.()) {
        this.startSkillAction(SkillId.NineTailsTransformation);
      }
      return true;
    }
    let kind: AttackKindType | undefined;
    if (basicPressed) {
      kind = basicAttackKind(this.nineTailsTransformationActive);
    } else if (luckySevenPressed) {
      kind = shiftAttackKind(this.nineTailsTransformationActive);
    } else if (drainPressed) {
      kind = AttackKind.Drain;
    } else if (avengerPressed) {
      kind = AttackKind.Avenger;
    } else if (rasenganPressed) {
      kind = AttackKind.Rasengan;
    } else if (tailedBeastBombPressed) {
      kind = AttackKind.TailedBeastBomb;
    } else if (teamAssaultPressed) {
      kind = AttackKind.TeamAssault;
    } else if (shadowVolleyPressed) {
      kind = AttackKind.ShadowVolley;
    } else if (phantomStarsPressed) {
      kind = AttackKind.PhantomStars;
    } else if (abyssRainPressed) {
      kind = AttackKind.AbyssRain;
    } else if (thunderOrbPressed) {
      kind = AttackKind.ThunderOrb;
    }
    if (!kind) return false;
    if (this.isActionLocked()) {
      this.combatActionBlockedHandler?.();
      return true;
    }
    if (this.combatActionHandler && !this.combatActionHandler(kind))
      return true;
    this.startAction(kind);
    return true;
  }

  private startAction(kind: AttackKindType): void {
    this.actionLocked = true;
    this.actionAnimationTimeScale = attackSpeedMultiplier(kind);
    this.anims.timeScale = this.actionAnimationTimeScale;
    this.setAccelerationX(0);
    const body = this.arcadeBody();
    this.setVelocityX(
      horizontalVelocityForActionStart(
        body.velocity.x,
        body.velocity.y,
        body.blocked.down,
      ),
    );
    this.play(
      this.playerAnimationKey(ATTACK_DEFINITIONS[kind].playerAnimation),
      true,
    );
  }

  private startSkillAction(
    skillId: typeof SkillId.NineTailsTransformation,
  ): void {
    if (skillId !== SkillId.NineTailsTransformation) return;
    this.actionLocked = true;
    this.actionAnimationTimeScale = 1;
    this.anims.timeScale = 1;
    this.setAccelerationX(0);
    const body = this.arcadeBody();
    this.setVelocityX(
      horizontalVelocityForActionStart(
        body.velocity.x,
        body.velocity.y,
        body.blocked.down,
      ),
    );
    this.play(this.playerAnimationKey("basicAttack"), true);
  }

  private applyAirborneHorizontalControl(
    body: Phaser.Physics.Arcade.Body,
    direction: number,
  ): void {
    this.setAccelerationX(0);
    body.setDragX(0);
    this.setVelocityX(
      playerAirborneHorizontalVelocity(
        body.velocity.x,
        direction,
        this.nineTailsTransformationActive,
      ),
    );
    if (direction !== 0) {
      this.setFlipX(direction < 0);
    }
  }

  private syncBodyToFrameOrigin(): void {
    this.arcadeBody().setOffset(
      centeredPlayerBodyOffsetX(this.displayOriginX),
      groundedPlayerBodyOffsetY(this.displayOriginY),
    );
  }

  private playerAnimationKey(animation: string): string {
    return animationKey(this.playerSheetKey, animation);
  }

  private updateHurtDuration(): void {
    const animation =
      spriteManifest.sheets[this.playerSheetKey]?.animations.hurt;
    if (!animation) {
      throw new Error(
        `Player hurt animation is missing: ${this.playerSheetKey}.`,
      );
    }
    this.hurtDurationMs = animation.frames.length * animation.frameDurationMs;
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    if (!this.body) {
      throw new Error("Player is missing its Arcade Physics body.");
    }
    return this.body as Phaser.Physics.Arcade.Body;
  }
}
