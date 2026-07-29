import { describe, expect, it } from "vitest";
import {
  PORTAL_AMBIENT_EFFECT,
  portalAnimatedObjectCount,
} from "./portal-ambient-rules";

describe("portal ambient presentation", () => {
  it("keeps a fixed animated object count for stable map cleanup telemetry", () => {
    expect(PORTAL_AMBIENT_EFFECT.rasterLayersPerPortal).toBe(3);
    expect(PORTAL_AMBIENT_EFFECT.particles).toHaveLength(6);
    expect(portalAnimatedObjectCount(0)).toBe(0);
    expect(portalAnimatedObjectCount(2)).toBe(18);
  });

  it("staggers upward portal particles within the portal silhouette", () => {
    const delays = PORTAL_AMBIENT_EFFECT.particles.map(({ delayMs }) => delayMs);
    expect(new Set(delays).size).toBe(PORTAL_AMBIENT_EFFECT.particles.length);
    for (const particle of PORTAL_AMBIENT_EFFECT.particles) {
      expect(Math.abs(particle.offsetX)).toBeLessThanOrEqual(34);
      expect(particle.rise).toBeGreaterThanOrEqual(70);
      expect(particle.durationMs).toBeGreaterThanOrEqual(900);
    }
  });
});
