export interface PortalEnergyParticle {
  offsetX: number;
  driftX: number;
  rise: number;
  radius: number;
  durationMs: number;
  delayMs: number;
}

export const PORTAL_AMBIENT_EFFECT = {
  rasterLayersPerPortal: 3,
  verticalEnergy: {
    offsetY: -62,
    width: 102,
    height: 66,
    angle: 90,
    alpha: 0.78,
    pulseMs: 940,
  },
  groundSigil: {
    offsetY: -7,
    width: 154,
    height: 77,
    alpha: 0.9,
    pulseMs: 1_080,
  },
  groundEcho: {
    offsetY: -6,
    width: 118,
    height: 59,
    alpha: 0.52,
    pulseMs: 1_360,
  },
  particles: [
    { offsetX: -31, driftX: -8, rise: 78, radius: 2, durationMs: 1_080, delayMs: 0 },
    { offsetX: -19, driftX: 7, rise: 96, radius: 3, durationMs: 1_260, delayMs: 190 },
    { offsetX: -7, driftX: -5, rise: 70, radius: 2, durationMs: 940, delayMs: 380 },
    { offsetX: 8, driftX: 6, rise: 104, radius: 2, durationMs: 1_320, delayMs: 570 },
    { offsetX: 21, driftX: -6, rise: 84, radius: 3, durationMs: 1_160, delayMs: 760 },
    { offsetX: 33, driftX: 8, rise: 74, radius: 2, durationMs: 1_000, delayMs: 950 },
  ] satisfies readonly PortalEnergyParticle[],
} as const;

export function portalAnimatedObjectCount(portalCount: number): number {
  return Math.max(0, Math.floor(portalCount)) *
    (PORTAL_AMBIENT_EFFECT.rasterLayersPerPortal +
      PORTAL_AMBIENT_EFFECT.particles.length);
}
