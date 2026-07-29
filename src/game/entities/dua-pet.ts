import Phaser from "phaser";
import { animationKey } from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import {
  DUA_APPROACH_SPEED,
  DUA_CRUISE_SPEED_THRESHOLD,
  DUA_JUMP_SPEED,
  duaMovementDecision,
  type PetPoint,
} from "../pets/pet-rules";
import { PIXEL_FONT_FAMILY } from "../ui/ui-theme";
import {
  centeredBodyOffsetX,
  groundedBodyOffsetY,
} from "./sprite-layout";

const PET_SCALE = 0.62;
const PET_BODY_WIDTH = 76;
const PET_BODY_HEIGHT = 42;
const PET_ACCELERATION = 2_100;
const PET_GROUND_DRAG = 1_900;

export type DuaPetBehavior = "idle" | "following" | "fetching" | "happy";

export class DuaPet extends Phaser.Physics.Arcade.Sprite {
  private readonly nameLabel: Phaser.GameObjects.Text;
  private behavior: DuaPetBehavior = "idle";
  private animationLocked = false;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "duaPet", 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const origin = spriteManifest.sheets.duaPet?.origin;
    this.setOrigin(origin?.x ?? 0.5, origin?.y ?? 1)
      .setScale(PET_SCALE)
      .setDepth(10)
      .setCollideWorldBounds(true);
    this.nameLabel = scene.add
      .text(x, y - 77, "두아", {
        color: "#fff2b3",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "12px",
        backgroundColor: "#082025c7",
        padding: { x: 5, y: 2 },
        stroke: "#111111",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 1)
      .setDepth(11);

    this.arcadeBody()
      .setSize(PET_BODY_WIDTH, PET_BODY_HEIGHT)
      .setMaxVelocity(DUA_APPROACH_SPEED, 900)
      .setDragX(PET_GROUND_DRAG);
    const syncBody = (): void => this.syncBodyToFrameOrigin();
    this.on(Phaser.Animations.Events.ANIMATION_START, syncBody);
    this.on(Phaser.Animations.Events.ANIMATION_UPDATE, syncBody);
    this.play(animationKey("duaPet", "idle"));
    this.syncBodyToFrameOrigin();
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    this.nameLabel
      .setPosition(this.x, this.y - 69)
      .setVisible(this.visible && this.active);
  }

  moveToward(
    target: PetPoint,
    fetching: boolean,
    targetVelocityX = 0,
  ): void {
    if (this.animationLocked) return;
    const body = this.arcadeBody();
    const grounded = body.blocked.down || body.touching.down;
    const decision = duaMovementDecision(this, target, {
      grounded,
      blockedLeft: body.blocked.left || body.touching.left,
      blockedRight: body.blocked.right || body.touching.right,
      targetVelocityX,
    });

    if (decision.kind === "teleport") {
      body.reset(decision.position.x, decision.position.y);
      this.setVelocity(0, 0).setAccelerationX(0);
      this.setBehavior("idle");
      return;
    }

    if (decision.kind === "idle") {
      this.setAccelerationX(0);
      body.setMaxVelocity(DUA_APPROACH_SPEED, 900);
      body.setDragX(PET_GROUND_DRAG);
      if (decision.shouldJump && grounded) {
        this.setVelocityY(-DUA_JUMP_SPEED);
        this.setBehavior(fetching ? "fetching" : "following");
      } else if (grounded) {
        if (Math.abs(body.velocity.x) <= DUA_CRUISE_SPEED_THRESHOLD) {
          this.setVelocityX(0);
          this.setBehavior("idle");
        } else {
          this.setBehavior(fetching ? "fetching" : "following");
        }
      }
      return;
    }

    body.setDragX(0);
    body.setMaxVelocity(decision.speed, 900);
    this.setAccelerationX(decision.direction * PET_ACCELERATION);
    this.setFlipX(decision.direction < 0);
    if (decision.shouldJump && grounded) {
      this.setVelocityY(-DUA_JUMP_SPEED);
    }
    this.setBehavior(fetching ? "fetching" : "following");
  }

  playPickup(): void {
    this.playLockedAnimation("fetching", "fetch");
  }

  playHappy(): void {
    this.playLockedAnimation("happy", "happy");
  }

  behaviorState(): DuaPetBehavior {
    return this.behavior;
  }

  destroy(fromScene?: boolean): void {
    if (this.nameLabel.active) this.nameLabel.destroy(fromScene);
    super.destroy(fromScene);
  }

  private playLockedAnimation(
    behavior: Extract<DuaPetBehavior, "fetching" | "happy">,
    animation: "fetch" | "happy",
  ): void {
    this.animationLocked = true;
    this.behavior = behavior;
    this.setAccelerationX(0).setVelocityX(0);
    this.play(animationKey("duaPet", animation), true);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      if (!this.active) return;
      this.animationLocked = false;
      this.setBehavior("idle");
    });
  }

  private setBehavior(behavior: DuaPetBehavior): void {
    if (this.behavior === behavior) return;
    this.behavior = behavior;
    const animation = behavior === "idle" ? "idle" : "run";
    this.play(animationKey("duaPet", animation), true);
  }

  private syncBodyToFrameOrigin(): void {
    const body = this.arcadeBody();
    body.setOffset(
      centeredBodyOffsetX(this.displayOriginX, PET_BODY_WIDTH),
      groundedBodyOffsetY(this.displayOriginY, PET_BODY_HEIGHT),
    );
  }

  private arcadeBody(): Phaser.Physics.Arcade.Body {
    return this.body as Phaser.Physics.Arcade.Body;
  }
}
