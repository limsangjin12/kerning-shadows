export const LOOT_PRESENTATION = {
  minimumLandingVelocityY: 44,
  maxLandingEffects: 2,
  despawnWarningMs: 2_200,
  despawnBlinkIntervalMs: 140,
  despawnDimmedAlpha: 0.42,
  pickupRiseMs: 90,
  pickupConvergeMs: 150,
} as const;

export interface LootLandingSample {
  wasGrounded: boolean;
  isGrounded: boolean;
  previousVelocityY: number;
  effectsShown: number;
}

export interface LootLandingPresentation {
  effectScale: number;
  effectAlpha: number;
  flashDurationMs: number;
}

export function resolveLootLandingPresentation(
  sample: LootLandingSample,
): LootLandingPresentation | undefined {
  if (
    sample.wasGrounded ||
    !sample.isGrounded ||
    sample.previousVelocityY < LOOT_PRESENTATION.minimumLandingVelocityY ||
    sample.effectsShown >= LOOT_PRESENTATION.maxLandingEffects
  ) {
    return undefined;
  }

  return sample.effectsShown === 0
    ? { effectScale: 0.38, effectAlpha: 0.84, flashDurationMs: 65 }
    : { effectScale: 0.26, effectAlpha: 0.58, flashDurationMs: 45 };
}

export function lootDespawnAlpha(remainingMs: number): number {
  if (remainingMs <= 0) {
    return 0;
  }
  if (remainingMs > LOOT_PRESENTATION.despawnWarningMs) {
    return 1;
  }

  const warningElapsed = LOOT_PRESENTATION.despawnWarningMs - remainingMs;
  const blinkPhase = Math.floor(
    warningElapsed / LOOT_PRESENTATION.despawnBlinkIntervalMs,
  );
  return blinkPhase % 2 === 0 ? 1 : LOOT_PRESENTATION.despawnDimmedAlpha;
}

export function lootEffectTint(kind: "mesos" | "item"): number {
  return kind === "mesos" ? 0xffd66b : 0x9dffc1;
}
