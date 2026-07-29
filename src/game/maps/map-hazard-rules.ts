export interface HazardMotion {
  axis: "x" | "y";
  distance: number;
  periodMs: number;
  phaseMs: number;
}

export interface RectangleBounds {
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

export function hazardMotionOffset(elapsedMs: number, motion: HazardMotion): number {
  if (motion.periodMs <= 0 || motion.distance === 0) return 0;
  const phase = (((elapsedMs + motion.phaseMs) % motion.periodMs) + motion.periodMs) % motion.periodMs;
  return Math.sin((phase / motion.periodMs) * Math.PI * 2) * motion.distance;
}

export function rectanglesOverlap(first: RectangleBounds, second: RectangleBounds): boolean {
  return (
    Math.abs(first.centerX - second.centerX) * 2 < first.width + second.width &&
    Math.abs(first.centerY - second.centerY) * 2 < first.height + second.height
  );
}
