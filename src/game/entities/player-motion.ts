const JUMP_APEX_VELOCITY = 75;
const WALK_MIN_TIME_SCALE = 0.78;
const WALK_MAX_TIME_SCALE = 1.32;

export const PLAYER_WALK_START_FRAME = 1;
export const PLAYER_MOVE_SPEED = 260;
export const NINE_TAILS_MOVE_SPEED_MULTIPLIER = 1.2;

export function playerMoveSpeed(
  nineTailsTransformationActive: boolean,
): number {
  return Math.round(
    PLAYER_MOVE_SPEED *
      (nineTailsTransformationActive
        ? NINE_TAILS_MOVE_SPEED_MULTIPLIER
        : 1),
  );
}

export function playerAirborneHorizontalVelocity(
  currentVelocityX: number,
  inputDirection: number,
  nineTailsTransformationActive: boolean,
): number {
  const direction = Math.sign(inputDirection);
  return direction === 0
    ? currentVelocityX
    : direction * playerMoveSpeed(nineTailsTransformationActive);
}

export type PlayerAirborneAnimation = "jumpRise" | "jumpApex" | "fall";

export function playerAirborneAnimation(velocityY: number): PlayerAirborneAnimation {
  if (velocityY < -JUMP_APEX_VELOCITY) {
    return "jumpRise";
  }
  if (velocityY > JUMP_APEX_VELOCITY) {
    return "fall";
  }
  return "jumpApex";
}

export function horizontalVelocityForActionStart(
  currentVelocityX: number,
  verticalVelocity: number,
  blockedDown: boolean,
): number {
  const airborne = !blockedDown || verticalVelocity !== 0;
  return airborne ? currentVelocityX : 0;
}

export function playerWalkAnimationTimeScale(
  horizontalVelocity: number,
  nineTailsTransformationActive = false,
): number {
  const normalizedSpeed = Math.min(
    1,
    Math.abs(horizontalVelocity) /
      playerMoveSpeed(nineTailsTransformationActive),
  );
  const baseTimeScale =
    WALK_MIN_TIME_SCALE +
    (WALK_MAX_TIME_SCALE - WALK_MIN_TIME_SCALE) * normalizedSpeed;
  return baseTimeScale *
    (nineTailsTransformationActive ? NINE_TAILS_MOVE_SPEED_MULTIPLIER : 1);
}
