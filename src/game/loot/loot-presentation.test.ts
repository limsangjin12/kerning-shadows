import { describe, expect, it } from "vitest";
import {
  LOOT_PRESENTATION,
  lootDespawnAlpha,
  lootEffectTint,
  resolveLootLandingPresentation,
} from "./loot-presentation";

describe("loot presentation", () => {
  it("shows one strong and one soft landing effect for distinct impacts", () => {
    expect(
      resolveLootLandingPresentation({
        wasGrounded: false,
        isGrounded: true,
        previousVelocityY: 180,
        effectsShown: 0,
      }),
    ).toEqual({ effectScale: 0.38, effectAlpha: 0.84, flashDurationMs: 65 });
    expect(
      resolveLootLandingPresentation({
        wasGrounded: false,
        isGrounded: true,
        previousVelocityY: 58,
        effectsShown: 1,
      }),
    ).toEqual({ effectScale: 0.26, effectAlpha: 0.58, flashDurationMs: 45 });
  });

  it("ignores airborne, repeated, slow, and excess contacts", () => {
    const base = {
      wasGrounded: false,
      isGrounded: true,
      previousVelocityY: 180,
      effectsShown: 0,
    };

    expect(resolveLootLandingPresentation({ ...base, isGrounded: false })).toBeUndefined();
    expect(resolveLootLandingPresentation({ ...base, wasGrounded: true })).toBeUndefined();
    expect(
      resolveLootLandingPresentation({
        ...base,
        previousVelocityY: LOOT_PRESENTATION.minimumLandingVelocityY - 1,
      }),
    ).toBeUndefined();
    expect(
      resolveLootLandingPresentation({
        ...base,
        effectsShown: LOOT_PRESENTATION.maxLandingEffects,
      }),
    ).toBeUndefined();
  });

  it("blinks only during the despawn warning window", () => {
    expect(lootDespawnAlpha(LOOT_PRESENTATION.despawnWarningMs + 1)).toBe(1);
    expect(lootDespawnAlpha(LOOT_PRESENTATION.despawnWarningMs)).toBe(1);
    expect(
      lootDespawnAlpha(
        LOOT_PRESENTATION.despawnWarningMs - LOOT_PRESENTATION.despawnBlinkIntervalMs,
      ),
    ).toBe(LOOT_PRESENTATION.despawnDimmedAlpha);
    expect(lootDespawnAlpha(0)).toBe(0);
  });

  it("uses distinct readable tints for currency and items", () => {
    expect(lootEffectTint("mesos")).not.toBe(lootEffectTint("item"));
  });

  it("finishes the pickup flight inside the documented timing budget", () => {
    expect(
      LOOT_PRESENTATION.pickupRiseMs + LOOT_PRESENTATION.pickupConvergeMs,
    ).toBe(240);
  });
});
