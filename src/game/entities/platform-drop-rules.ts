export const PLATFORM_DROP_VELOCITY = 180;
export const PLATFORM_DROP_IGNORE_MS = 420;
export const PLATFORM_DROP_FOOT_TOLERANCE = 6;

export interface PlatformDropProbe {
  bodyLeft: number;
  bodyRight: number;
  bodyBottom: number;
  platformLeft: number;
  platformRight: number;
  platformTop: number;
  oneWay: boolean;
}

export function canDropThroughPlatform(
  probe: PlatformDropProbe,
  footTolerance = PLATFORM_DROP_FOOT_TOLERANCE,
): boolean {
  if (!probe.oneWay) {
    return false;
  }

  const overlapsHorizontally =
    probe.bodyRight > probe.platformLeft &&
    probe.bodyLeft < probe.platformRight;
  const standingAtTop =
    Math.abs(probe.bodyBottom - probe.platformTop) <= footTolerance;
  return overlapsHorizontally && standingAtTop;
}
