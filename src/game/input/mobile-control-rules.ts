export const MOBILE_JOYSTICK_DEAD_ZONE = 0.28;

export interface MobileJoystickDirections {
  left: boolean;
  right: boolean;
  down: boolean;
}

export function mobileJoystickDirections(
  deltaX: number,
  deltaY: number,
  horizontalRadius: number,
  verticalRadius: number,
): MobileJoystickDirections {
  const safeX =
    Number.isFinite(horizontalRadius) && horizontalRadius > 0
      ? horizontalRadius
      : Number.POSITIVE_INFINITY;
  const safeY =
    Number.isFinite(verticalRadius) && verticalRadius > 0
      ? verticalRadius
      : Number.POSITIVE_INFINITY;
  const normalizedX = Number.isFinite(deltaX) ? deltaX / safeX : 0;
  const normalizedY = Number.isFinite(deltaY) ? deltaY / safeY : 0;
  return {
    left: normalizedX < -MOBILE_JOYSTICK_DEAD_ZONE,
    right: normalizedX > MOBILE_JOYSTICK_DEAD_ZONE,
    down: normalizedY > MOBILE_JOYSTICK_DEAD_ZONE,
  };
}

export function clampMobileJoystickOffset(
  deltaX: number,
  deltaY: number,
  horizontalRadius: number,
  verticalRadius: number,
): { x: number; y: number } {
  if (
    !Number.isFinite(deltaX) ||
    !Number.isFinite(deltaY) ||
    !Number.isFinite(horizontalRadius) ||
    !Number.isFinite(verticalRadius) ||
    horizontalRadius <= 0 ||
    verticalRadius <= 0
  ) {
    return { x: 0, y: 0 };
  }
  return {
    x: Math.max(-horizontalRadius, Math.min(horizontalRadius, deltaX)),
    y: Math.max(0, Math.min(verticalRadius, deltaY)),
  };
}
