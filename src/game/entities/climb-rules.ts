export interface ClimbableBounds {
  id: string;
  x: number;
  top: number;
  bottom: number;
  width: number;
}

export const CLIMB_SPEED = 175;
export const CLIMB_ATTACH_VERTICAL_TOLERANCE = 36;

export function canAttachToClimbable(
  playerX: number,
  playerFeetY: number,
  climbable: ClimbableBounds,
  movingUp: boolean,
  movingDown: boolean,
): boolean {
  if (!movingUp && !movingDown) return false;
  const horizontalTolerance = Math.max(40, climbable.width / 2 + 18);
  return (
    Math.abs(playerX - climbable.x) <= horizontalTolerance &&
    playerFeetY >= climbable.top - CLIMB_ATTACH_VERTICAL_TOLERANCE &&
    playerFeetY <= climbable.bottom + CLIMB_ATTACH_VERTICAL_TOLERANCE
  );
}

export function climbVelocity(movingUp: boolean, movingDown: boolean): number {
  return (Number(movingDown) - Number(movingUp)) * CLIMB_SPEED;
}

export function shouldDetachFromClimbable(
  movingLeft: boolean,
  movingRight: boolean,
  jumpPressed: boolean,
): boolean {
  return movingLeft || movingRight || jumpPressed;
}

export function clampClimbY(
  feetY: number,
  climbable: ClimbableBounds,
): number {
  return Math.min(climbable.bottom, Math.max(climbable.top, feetY));
}
