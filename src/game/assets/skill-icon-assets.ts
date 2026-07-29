import skillAvengerUrl from "../../../assets/ui/skills/skill-avenger-v1.webp?url";
import skillAbyssRainUrl from "../../../assets/ui/skills/skill-abyss-rain-v1.webp?url";
import skillCriticalThrowUrl from "../../../assets/ui/skills/skill-critical-throw-v1.webp?url";
import skillDrainUrl from "../../../assets/ui/skills/skill-drain-v1.webp?url";
import skillKeenSightUrl from "../../../assets/ui/skills/skill-keen-sight-v1.webp?url";
import skillLuckySevenUrl from "../../../assets/ui/skills/skill-lucky-seven-v1.webp?url";
import skillNineTailsTransformationUrl from "../../../assets/ui/skills/skill-nine-tails-transformation-v1.webp?url";
import skillPhantomStarsUrl from "../../../assets/ui/skills/skill-phantom-stars-v1.webp?url";
import skillRasenganUrl from "../../../assets/ui/skills/skill-rasengan-v1.webp?url";
import skillSageModeUrl from "../../../assets/ui/skills/skill-sage-mode-v1.webp?url";
import skillShadowBreathingUrl from "../../../assets/ui/skills/skill-shadow-breathing-v1.webp?url";
import skillShadowVolleyUrl from "../../../assets/ui/skills/skill-shadow-volley-v1.webp?url";
import skillTailedBeastBombUrl from "../../../assets/ui/skills/skill-tailed-beast-bomb-v1.webp?url";
import skillTeamAssaultUrl from "../../../assets/ui/skills/skill-team-assault-v1.webp?url";
import skillThunderOrbUrl from "../../../assets/ui/skills/skill-thunder-orb-v1.webp?url";
import {
  ACTIVE_SKILL_ORDER,
  SkillId,
  type ActiveSkillId,
  type SkillId as SkillIdType,
} from "../skills/skill-rules";

export const SKILL_ICON_URLS = {
  [SkillId.LuckySeven]: skillLuckySevenUrl,
  [SkillId.ShadowVolley]: skillShadowVolleyUrl,
  [SkillId.KeenSight]: skillKeenSightUrl,
  [SkillId.Drain]: skillDrainUrl,
  [SkillId.PhantomStars]: skillPhantomStarsUrl,
  [SkillId.CriticalThrow]: skillCriticalThrowUrl,
  [SkillId.Avenger]: skillAvengerUrl,
  [SkillId.AbyssRain]: skillAbyssRainUrl,
  [SkillId.ShadowBreathing]: skillShadowBreathingUrl,
  [SkillId.Rasengan]: skillRasenganUrl,
  [SkillId.NineTailsTransformation]: skillNineTailsTransformationUrl,
  [SkillId.TailedBeastBomb]: skillTailedBeastBombUrl,
  [SkillId.TeamAssault]: skillTeamAssaultUrl,
  [SkillId.ThunderOrb]: skillThunderOrbUrl,
  [SkillId.SageMode]: skillSageModeUrl,
} as const satisfies Record<SkillIdType, string>;

export const ACTIVE_SKILL_ICON_KEYS = {
  [SkillId.LuckySeven]: "ui:skill-lucky-seven",
  [SkillId.ShadowVolley]: "ui:skill-shadow-volley",
  [SkillId.Drain]: "ui:skill-drain",
  [SkillId.PhantomStars]: "ui:skill-phantom-stars",
  [SkillId.Avenger]: "ui:skill-avenger",
  [SkillId.AbyssRain]: "ui:skill-abyss-rain",
  [SkillId.Rasengan]: "ui:skill-rasengan",
  [SkillId.NineTailsTransformation]: "ui:skill-nine-tails-transformation",
  [SkillId.TailedBeastBomb]: "ui:skill-tailed-beast-bomb",
  [SkillId.TeamAssault]: "ui:skill-team-assault",
  [SkillId.ThunderOrb]: "ui:skill-thunder-orb",
} as const satisfies Record<ActiveSkillId, string>;

export const ACTIVE_SKILL_ICON_ASSETS = ACTIVE_SKILL_ORDER.map((skillId) => ({
  key: ACTIVE_SKILL_ICON_KEYS[skillId],
  url: SKILL_ICON_URLS[skillId],
  kind: "skill-icon" as const,
  skillId,
}));
