export const HokageCinematicKind = {
  Rasengan: "rasengan",
  NineTailsTransformation: "nineTailsTransformation",
  TailedBeastBomb: "tailedBeastBomb",
  TeamAssault: "teamAssault",
  ThunderOrb: "thunderOrb",
} as const;

export type HokageCinematicKind =
  (typeof HokageCinematicKind)[keyof typeof HokageCinematicKind];

export interface HokageCinematicDefinition {
  frame: number;
  durationMs: number;
  title: string;
  accent: number;
  shakeDurationMs: number;
  shakeIntensity: number;
}

export const HOKAGE_CINEMATICS: Record<
  HokageCinematicKind,
  HokageCinematicDefinition
> = {
  [HokageCinematicKind.Rasengan]: {
    frame: 0,
    durationMs: 760,
    title: "나선환",
    accent: 0x57ddff,
    shakeDurationMs: 260,
    shakeIntensity: 0.006,
  },
  [HokageCinematicKind.NineTailsTransformation]: {
    frame: 1,
    durationMs: 900,
    title: "구미호 변신",
    accent: 0xff843d,
    shakeDurationMs: 360,
    shakeIntensity: 0.008,
  },
  [HokageCinematicKind.TailedBeastBomb]: {
    frame: 2,
    durationMs: 920,
    title: "미수옥",
    accent: 0xb28cff,
    shakeDurationMs: 420,
    shakeIntensity: 0.009,
  },
  [HokageCinematicKind.TeamAssault]: {
    frame: 3,
    durationMs: 1_750,
    title: "삼인 협공",
    accent: 0xffd86a,
    shakeDurationMs: 620,
    shakeIntensity: 0.01,
  },
  [HokageCinematicKind.ThunderOrb]: {
    frame: 0,
    durationMs: 640,
    title: "천뢰옥",
    accent: 0xffd45f,
    shakeDurationMs: 300,
    shakeIntensity: 0.007,
  },
};

export const TEAM_ASSAULT_HIT_TIMELINE_MS = [520, 690, 860, 1_030, 1_200] as const;

export type TeamAssaultAttacker = "shion" | "hanaKick" | "hanaPunch";

export function teamAssaultAttacker(hitIndex: number): TeamAssaultAttacker {
  if (hitIndex <= 1) return "shion";
  if (hitIndex === 2) return "hanaKick";
  return "hanaPunch";
}
