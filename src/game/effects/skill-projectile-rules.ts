import { AttackKind, type AttackKind as AttackKindType } from "../combat/combat-rules";

export const SkillProjectileMotion = {
  Plain: "plain",
  TwinStraight: "twin-straight",
  FanVolley: "fan-volley",
  SiphonPulse: "siphon-pulse",
  PhantomWave: "phantom-wave",
  AvengerPierce: "avenger-pierce",
  AbyssRain: "abyss-rain",
  TailedBomb: "tailed-bomb",
  ThunderOrb: "thunder-orb",
} as const;

export type SkillProjectileMotion =
  (typeof SkillProjectileMotion)[keyof typeof SkillProjectileMotion];

export interface SkillProjectilePresentation {
  motion: SkillProjectileMotion;
  spawnOffsetY: number;
  initialVelocityY: number;
  waveAmplitude: number;
  wavePeriodMs: number;
  wavePhase: number;
  pulseAmount: number;
  trailTints: readonly number[];
}

const TAU = Math.PI * 2;

export function skillProjectilePresentation(
  kind: AttackKindType,
  hitIndex: number,
): SkillProjectilePresentation {
  const alternating = hitIndex % 2 === 0 ? -1 : 1;
  switch (kind) {
    case AttackKind.LuckySeven:
      return {
        motion: SkillProjectileMotion.TwinStraight,
        spawnOffsetY: alternating * 7,
        initialVelocityY: 0,
        waveAmplitude: 0,
        wavePeriodMs: 1,
        wavePhase: 0,
        pulseAmount: 0,
        trailTints: [0xb8ecff],
      };
    case AttackKind.ShadowVolley:
      return {
        motion: SkillProjectileMotion.FanVolley,
        spawnOffsetY: [-14, 0, 14][hitIndex % 3] ?? 0,
        initialVelocityY: [-95, 0, 95][hitIndex % 3] ?? 0,
        waveAmplitude: 0,
        wavePeriodMs: 1,
        wavePhase: 0,
        pulseAmount: 0,
        trailTints: [0x70dcff, 0xd8f7ff],
      };
    case AttackKind.Drain:
      return {
        motion: SkillProjectileMotion.SiphonPulse,
        spawnOffsetY: 0,
        initialVelocityY: 0,
        waveAmplitude: 0,
        wavePeriodMs: 360,
        wavePhase: 0,
        pulseAmount: 0.16,
        trailTints: [0x69f2a4, 0xd5ffe1],
      };
    case AttackKind.PhantomStars:
      return {
        motion: SkillProjectileMotion.PhantomWave,
        spawnOffsetY: alternating * 18,
        initialVelocityY: 0,
        waveAmplitude: 42,
        wavePeriodMs: 520,
        wavePhase: alternating < 0 ? 0 : Math.PI,
        pulseAmount: 0,
        trailTints: [0xff79c8, 0x70efff],
      };
    case AttackKind.Avenger:
      return basePresentation(SkillProjectileMotion.AvengerPierce, [0xd9a1ff]);
    case AttackKind.AbyssRain:
      return basePresentation(SkillProjectileMotion.AbyssRain, [0x8e6cff]);
    case AttackKind.TailedBeastBomb:
      return basePresentation(SkillProjectileMotion.TailedBomb, [0xff6b48]);
    case AttackKind.ThunderOrb:
      return basePresentation(SkillProjectileMotion.ThunderOrb, [0xffd45f, 0x70efff]);
    default:
      return basePresentation(SkillProjectileMotion.Plain, [0xb8ecff]);
  }
}

export function projectileVerticalVelocity(
  presentation: SkillProjectilePresentation,
  elapsedMs: number,
): number {
  if (presentation.motion !== SkillProjectileMotion.PhantomWave) {
    return presentation.initialVelocityY;
  }
  const angularSpeed = TAU / presentation.wavePeriodMs;
  return (
    presentation.waveAmplitude *
    angularSpeed *
    1_000 *
    Math.cos(elapsedMs * angularSpeed + presentation.wavePhase)
  );
}

export function projectilePulseScale(
  presentation: SkillProjectilePresentation,
  elapsedMs: number,
): number {
  if (presentation.pulseAmount === 0) return 1;
  return (
    1 +
    Math.sin((elapsedMs / presentation.wavePeriodMs) * TAU) *
      presentation.pulseAmount
  );
}

function basePresentation(
  motion: SkillProjectileMotion,
  trailTints: readonly number[],
): SkillProjectilePresentation {
  return {
    motion,
    spawnOffsetY: 0,
    initialVelocityY: 0,
    waveAmplitude: 0,
    wavePeriodMs: 1,
    wavePhase: 0,
    pulseAmount: 0,
    trailTints,
  };
}
