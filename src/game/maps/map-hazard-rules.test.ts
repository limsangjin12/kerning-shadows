import { describe, expect, it } from "vitest";
import { hazardMotionOffset, rectanglesOverlap } from "./map-hazard-rules";

describe("map hazard rules", () => {
  it("moves hazards deterministically across the configured period", () => {
    const motion = { axis: "x" as const, distance: 100, periodMs: 2_000, phaseMs: 0 };
    expect(hazardMotionOffset(0, motion)).toBeCloseTo(0);
    expect(hazardMotionOffset(500, motion)).toBeCloseTo(100);
    expect(hazardMotionOffset(1_000, motion)).toBeCloseTo(0);
    expect(hazardMotionOffset(1_500, motion)).toBeCloseTo(-100);
  });

  it("detects strict rectangle overlap without counting edge-only contact", () => {
    const player = { centerX: 100, centerY: 100, width: 30, height: 60 };
    expect(rectanglesOverlap(player, { centerX: 110, centerY: 110, width: 20, height: 20 })).toBe(true);
    expect(rectanglesOverlap(player, { centerX: 125, centerY: 100, width: 20, height: 20 })).toBe(false);
  });
});
