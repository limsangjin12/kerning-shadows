export const PORTAL_TRANSITION_EFFECT = {
  exitDelayMs: 460,
  arrivalLockMs: 460,
  fadeInMs: 180,
  sourceRingScale: 0.72,
  arrivalRingScale: 0.82,
  ringTint: 0x76f3ff,
  flashColor: { red: 80, green: 225, blue: 255 },
} as const;

export const MILESTONE_EFFECTS = {
  jobAdvancement: {
    effectDurationMs: 1_400,
    inputLockMs: 1_400,
    flashDurationMs: 180,
    flashColor: { red: 178, green: 112, blue: 255 },
    ringDelaysMs: [0, 170],
    ringScales: [0.82, 1.08],
    ringTints: [0xb48cff, 0xffd86b],
    bannerColor: "#ffd86b",
    cameraShakeDurationMs: 0,
    cameraShakeIntensity: 0,
    burstCount: 0,
    burstRadius: 0,
    burstDurationMs: 0,
    burstTints: [] as readonly number[],
  },
  levelUp: {
    effectDurationMs: 1_650,
    inputLockMs: 0,
    flashDurationMs: 260,
    flashColor: { red: 255, green: 248, blue: 166 },
    ringDelaysMs: [0, 145, 310],
    ringScales: [0.76, 1.08, 1.34],
    ringTints: [0xfff3a1, 0xffd34f, 0xbdfb87],
    bannerColor: "#fff19a",
    cameraShakeDurationMs: 280,
    cameraShakeIntensity: 0.003,
    burstCount: 12,
    burstRadius: 118,
    burstDurationMs: 820,
    burstTints: [0xfff3a1, 0xffcf4f, 0xbdfb87] as readonly number[],
  },
} as const;

export const MILESTONE_BANNER = {
  enterMs: 160,
  holdMs: 700,
  exitMs: 180,
} as const;

export type MilestoneEffectKind = keyof typeof MILESTONE_EFFECTS;
export type PortalTransitionPhase = "source" | "arrival" | "complete";

export function portalTransitionPhase(elapsedMs: number): PortalTransitionPhase {
  const elapsed = Math.max(0, elapsedMs);
  if (elapsed < PORTAL_TRANSITION_EFFECT.exitDelayMs) {
    return "source";
  }
  if (
    elapsed <
    PORTAL_TRANSITION_EFFECT.exitDelayMs +
      PORTAL_TRANSITION_EFFECT.arrivalLockMs
  ) {
    return "arrival";
  }
  return "complete";
}

export function milestoneInputLocked(
  kind: MilestoneEffectKind,
  elapsedMs: number,
): boolean {
  return Math.max(0, elapsedMs) < MILESTONE_EFFECTS[kind].inputLockMs;
}

export function portalInputLocked(elapsedMs: number): boolean {
  return portalTransitionPhase(elapsedMs) !== "complete";
}
