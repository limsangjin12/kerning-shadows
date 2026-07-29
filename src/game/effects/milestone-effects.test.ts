import manifestJson from "../../../assets/sprites/sprite-manifest.json";
import { describe, expect, it } from "vitest";
import {
  MILESTONE_BANNER,
  MILESTONE_EFFECTS,
  PORTAL_TRANSITION_EFFECT,
  milestoneInputLocked,
  portalInputLocked,
  portalTransitionPhase,
} from "./milestone-effects";

const ringAnimation =
  manifestJson.sheets.combatEffects.animations.jobAdvancementRing;
const ringDurationMs =
  ringAnimation.frames.length * ringAnimation.frameDurationMs;

describe("milestone effect presentation rules", () => {
  it("keeps portal input locked through source and arrival effects", () => {
    expect(portalTransitionPhase(-1)).toBe("source");
    expect(
      portalTransitionPhase(PORTAL_TRANSITION_EFFECT.exitDelayMs - 1),
    ).toBe("source");
    expect(portalTransitionPhase(PORTAL_TRANSITION_EFFECT.exitDelayMs)).toBe(
      "arrival",
    );
    expect(
      portalTransitionPhase(
        PORTAL_TRANSITION_EFFECT.exitDelayMs +
          PORTAL_TRANSITION_EFFECT.arrivalLockMs,
      ),
    ).toBe("complete");
    const totalDuration =
      PORTAL_TRANSITION_EFFECT.exitDelayMs +
      PORTAL_TRANSITION_EFFECT.arrivalLockMs;
    expect(portalInputLocked(totalDuration - 1)).toBe(true);
    expect(portalInputLocked(totalDuration)).toBe(false);
  });

  it("keeps every ring and the complete banner inside its effect duration", () => {
    const bannerDuration =
      MILESTONE_BANNER.enterMs +
      MILESTONE_BANNER.holdMs +
      MILESTONE_BANNER.exitMs;

    for (const effect of Object.values(MILESTONE_EFFECTS)) {
      expect(effect.ringDelaysMs).toHaveLength(effect.ringScales.length);
      expect(effect.ringDelaysMs).toHaveLength(effect.ringTints.length);
      expect(Math.max(...effect.ringDelaysMs) + ringDurationMs).toBeLessThanOrEqual(
        effect.effectDurationMs,
      );
      if (effect.burstCount > 0) {
        const finalBurstDelay = (effect.burstCount - 1) * 18;
        expect(finalBurstDelay + effect.burstDurationMs).toBeLessThanOrEqual(
          effect.effectDurationMs,
        );
        expect(effect.burstTints.length).toBeGreaterThan(0);
      }
      expect(bannerDuration).toBeLessThanOrEqual(effect.effectDurationMs);
    }
  });

  it("gives level-up a stronger triple-ring, burst, and camera accent", () => {
    const effect = MILESTONE_EFFECTS.levelUp;
    expect(effect.ringDelaysMs).toHaveLength(3);
    expect(effect.burstCount).toBeGreaterThanOrEqual(10);
    expect(effect.cameraShakeDurationMs).toBeGreaterThan(0);
    expect(effect.effectDurationMs).toBeGreaterThan(
      MILESTONE_EFFECTS.jobAdvancement.effectDurationMs,
    );
  });

  it("matches portal and ceremony locks to the sprite animation contract", () => {
    const portalAnimation = manifestJson.sheets.worldEffectsLoot.animations.portal;
    const mentorAnimations = manifestJson.sheets.shadowMentor.animations;
    const mentorCeremonyMs =
      mentorAnimations.cast.frames.length * mentorAnimations.cast.frameDurationMs +
      mentorAnimations.approve.frames.length *
        mentorAnimations.approve.frameDurationMs;

    expect(portalAnimation.repeat).toBe(-1);
    expect(ringAnimation.repeat).toBe(0);
    expect(PORTAL_TRANSITION_EFFECT.exitDelayMs).toBeGreaterThanOrEqual(
      ringDurationMs,
    );
    expect(PORTAL_TRANSITION_EFFECT.arrivalLockMs).toBeGreaterThanOrEqual(
      Math.max(ringDurationMs, PORTAL_TRANSITION_EFFECT.fadeInMs),
    );
    expect(MILESTONE_EFFECTS.jobAdvancement.inputLockMs).toBeGreaterThanOrEqual(
      mentorCeremonyMs,
    );
  });

  it("keeps job advancement locked but leaves level-up movement uninterrupted", () => {
    const duration = MILESTONE_EFFECTS.jobAdvancement.inputLockMs;
    expect(milestoneInputLocked("jobAdvancement", duration - 1)).toBe(true);
    expect(milestoneInputLocked("jobAdvancement", duration)).toBe(false);
    expect(milestoneInputLocked("levelUp", 0)).toBe(false);
    expect(milestoneInputLocked("levelUp", 1_000)).toBe(false);
  });
});
