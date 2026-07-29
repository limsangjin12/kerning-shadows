import {
  PLAYER_JOB_RANK,
  PlayerJob,
  type PlayerJob as PlayerJobType,
  type PlayerProfile,
  type PlayerSkillLevels,
} from "../data/catalog";

export const SkillId = {
  LuckySeven: "luckySeven",
  ShadowVolley: "shadowVolley",
  KeenSight: "keenSight",
  Drain: "drain",
  PhantomStars: "phantomStars",
  CriticalThrow: "criticalThrow",
  Avenger: "avenger",
  AbyssRain: "abyssRain",
  ShadowBreathing: "shadowBreathing",
  Rasengan: "rasengan",
  NineTailsTransformation: "nineTailsTransformation",
  TailedBeastBomb: "tailedBeastBomb",
  TeamAssault: "teamAssault",
  ThunderOrb: "thunderOrb",
  SageMode: "sageMode",
} as const;

export type SkillId = (typeof SkillId)[keyof typeof SkillId];

export const ACTIVE_SKILL_ORDER = [
  SkillId.LuckySeven,
  SkillId.ShadowVolley,
  SkillId.Drain,
  SkillId.PhantomStars,
  SkillId.Avenger,
  SkillId.AbyssRain,
  SkillId.Rasengan,
  SkillId.NineTailsTransformation,
  SkillId.TailedBeastBomb,
  SkillId.TeamAssault,
  SkillId.ThunderOrb,
] as const;

export type ActiveSkillId = (typeof ACTIVE_SKILL_ORDER)[number];

export const MOBILE_PRIMARY_SKILLS_BY_JOB: Readonly<
  Record<PlayerJobType, readonly ActiveSkillId[]>
> = {
  [PlayerJob.Beginner]: [],
  [PlayerJob.Rogue]: [SkillId.LuckySeven, SkillId.ShadowVolley],
  [PlayerJob.Assassin]: [SkillId.Drain, SkillId.PhantomStars],
  [PlayerJob.Hermit]: [SkillId.Avenger, SkillId.AbyssRain],
  [PlayerJob.Hokage]: [
    SkillId.Rasengan,
    SkillId.TailedBeastBomb,
    SkillId.TeamAssault,
    SkillId.ThunderOrb,
  ],
};

export function mobilePrimarySkillsForJob(
  job: PlayerJobType,
): readonly ActiveSkillId[] {
  return MOBILE_PRIMARY_SKILLS_BY_JOB[job];
}

export function mobileSkillsForHotbar(
  job: PlayerJobType,
  hotbar: readonly ActiveSkillId[],
): ActiveSkillId[] {
  const primary = mobilePrimarySkillsForJob(job);
  return normalizeSkillHotbar(hotbar).filter((skillId) =>
    primary.includes(skillId),
  );
}

export const PASSIVE_SKILL_ORDER = [
  SkillId.KeenSight,
  SkillId.CriticalThrow,
  SkillId.ShadowBreathing,
  SkillId.SageMode,
] as const;

export type PassiveSkillId = (typeof PASSIVE_SKILL_ORDER)[number];

interface BaseSkillDefinition {
  label: string;
  tierLabel: string;
  requiredJob: PlayerJobType;
  maxLevel: number;
  description: string;
}

export interface ActiveSkillDefinition extends BaseSkillDefinition {
  id: ActiveSkillId;
  kind: "active";
  shortcut: string;
  damagePerLevel: number;
}

export type PassiveSkillEffect =
  | {
      kind: "projectile-range";
      percentPerLevel: 2;
    }
  | {
      kind: "critical-throw";
      chancePercentPerLevel: 1;
      damageMultiplier: 1.5;
    }
  | {
      kind: "recovery-interval";
      reductionPercentPerLevel: 2 | 4;
    };

export interface PassiveSkillDefinition extends BaseSkillDefinition {
  id: PassiveSkillId;
  kind: "passive";
  effect: PassiveSkillEffect;
}

export type SkillDefinition = ActiveSkillDefinition | PassiveSkillDefinition;

export const DEFAULT_SKILL_LEVELS: Readonly<PlayerSkillLevels> = {
  [SkillId.LuckySeven]: 0,
  [SkillId.ShadowVolley]: 0,
  [SkillId.KeenSight]: 0,
  [SkillId.Drain]: 0,
  [SkillId.PhantomStars]: 0,
  [SkillId.CriticalThrow]: 0,
  [SkillId.Avenger]: 0,
  [SkillId.AbyssRain]: 0,
  [SkillId.ShadowBreathing]: 0,
  [SkillId.Rasengan]: 0,
  [SkillId.NineTailsTransformation]: 0,
  [SkillId.TailedBeastBomb]: 0,
  [SkillId.TeamAssault]: 0,
  [SkillId.ThunderOrb]: 0,
  [SkillId.SageMode]: 0,
};

export const SKILL_DEFINITIONS = {
  [SkillId.LuckySeven]: {
    id: SkillId.LuckySeven,
    kind: "active",
    label: "럭키세븐",
    tierLabel: "1차 로그",
    shortcut: "SHIFT",
    requiredJob: PlayerJob.Rogue,
    maxLevel: 20,
    damagePerLevel: 1,
    description: "높이가 다른 두 궤도로 행운을 담은 청록 표창을 빠르게 던진다.",
  },
  [SkillId.ShadowVolley]: {
    id: SkillId.ShadowVolley,
    kind: "active",
    label: "그림자 연사",
    tierLabel: "1차 로그",
    shortcut: "Q",
    requiredJob: PlayerJob.Rogue,
    maxLevel: 20,
    damagePerLevel: 1,
    description: "청백색 표창 세 장을 상·중·하 부채꼴로 빠르게 연속 투척한다.",
  },
  [SkillId.KeenSight]: {
    id: SkillId.KeenSight,
    kind: "passive",
    label: "예리한 시야",
    tierLabel: "1차 로그",
    requiredJob: PlayerJob.Rogue,
    maxLevel: 20,
    description: "전장을 읽는 시야를 길러 모든 표창의 유효 거리를 늘린다.",
    effect: {
      kind: "projectile-range",
      percentPerLevel: 2,
    },
  },
  [SkillId.Drain]: {
    id: SkillId.Drain,
    kind: "active",
    label: "드레인",
    tierLabel: "2차 어쌔신",
    shortcut: "X",
    requiredJob: PlayerJob.Assassin,
    maxLevel: 20,
    damagePerLevel: 2,
    description:
      "맥동하는 녹색 표창으로 준 피해의 일부를 HP로 끌어와 흡수한다.",
  },
  [SkillId.PhantomStars]: {
    id: SkillId.PhantomStars,
    kind: "active",
    label: "환영 쌍성",
    tierLabel: "2차 어쌔신",
    shortcut: "W",
    requiredJob: PlayerJob.Assassin,
    maxLevel: 20,
    damagePerLevel: 2,
    description:
      "반대 위상의 파동으로 엇갈리는 환영 표창 두 장이 각각 최대 두 적을 관통한다.",
  },
  [SkillId.CriticalThrow]: {
    id: SkillId.CriticalThrow,
    kind: "passive",
    label: "치명 투척",
    tierLabel: "2차 어쌔신",
    requiredJob: PlayerJob.Assassin,
    maxLevel: 20,
    description: "표창의 급소 적중률을 높여 치명적인 피해를 준다.",
    effect: {
      kind: "critical-throw",
      chancePercentPerLevel: 1,
      damageMultiplier: 1.5,
    },
  },
  [SkillId.Avenger]: {
    id: SkillId.Avenger,
    kind: "active",
    label: "어벤저",
    tierLabel: "3차 허밋",
    shortcut: "C",
    requiredJob: PlayerJob.Hermit,
    maxLevel: 20,
    damagePerLevel: 2,
    description: "거대한 보라빛 표창으로 여러 적을 연속 관통한다.",
  },
  [SkillId.AbyssRain]: {
    id: SkillId.AbyssRain,
    kind: "active",
    label: "심연 폭우",
    tierLabel: "3차 허밋",
    shortcut: "E",
    requiredJob: PlayerJob.Hermit,
    maxLevel: 20,
    damagePerLevel: 3,
    description: "심연의 표창을 세 차례 퍼부어 각각 최대 네 적을 관통한다.",
  },
  [SkillId.ShadowBreathing]: {
    id: SkillId.ShadowBreathing,
    kind: "passive",
    label: "그림자 호흡",
    tierLabel: "3차 허밋",
    requiredJob: PlayerJob.Hermit,
    maxLevel: 20,
    description: "그림자와 호흡을 맞춰 HP와 MP의 자연 회복 주기를 단축한다.",
    effect: {
      kind: "recovery-interval",
      reductionPercentPerLevel: 2,
    },
  },
  [SkillId.Rasengan]: {
    id: SkillId.Rasengan,
    kind: "active",
    label: "나선환",
    tierLabel: "4차 호카게",
    shortcut: "V",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    damagePerLevel: 3,
    description: "응축한 차크라 구체를 근거리의 적 하나에게 폭발시킨다.",
  },
  [SkillId.NineTailsTransformation]: {
    id: SkillId.NineTailsTransformation,
    kind: "active",
    label: "구미호 변신",
    tierLabel: "4차 호카게",
    shortcut: "B",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    damagePerLevel: 0,
    description:
      "최대 MP를 지속 소모해 구미호로 변신한다. 할퀴기 공격·이동 속도와 장착 무기 공격이 강화된다.",
  },
  [SkillId.TailedBeastBomb]: {
    id: SkillId.TailedBeastBomb,
    kind: "active",
    label: "미수옥",
    tierLabel: "4차 호카게",
    shortcut: "SHIFT (구미호)",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    damagePerLevel: 4,
    description: "구미호 변신 중 차크라 탄을 발사해 최대 세 적을 관통한다.",
  },
  [SkillId.TeamAssault]: {
    id: SkillId.TeamAssault,
    kind: "active",
    label: "삼인 협공",
    tierLabel: "4차 호카게",
    shortcut: "N",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    damagePerLevel: 2,
    description:
      "두 동료 닌자와 교차 진입해 표창·발차기·주먹으로 다섯 번 연속 공격한다.",
  },
  [SkillId.ThunderOrb]: {
    id: SkillId.ThunderOrb,
    kind: "active",
    label: "천뢰옥",
    tierLabel: "4차 호카게",
    shortcut: "R",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    damagePerLevel: 5,
    description:
      "금빛 번개를 두른 차크라 구체 두 발로 각각 최대 다섯 적을 관통한다.",
  },
  [SkillId.SageMode]: {
    id: SkillId.SageMode,
    kind: "passive",
    label: "선인모드",
    tierLabel: "4차 호카게",
    requiredJob: PlayerJob.Hokage,
    maxLevel: 20,
    description:
      "몸을 감싸는 차크라를 깨워 HP와 MP의 자연 회복 주기를 크게 단축한다.",
    effect: {
      kind: "recovery-interval",
      reductionPercentPerLevel: 4,
    },
  },
} satisfies Record<SkillId, SkillDefinition>;

export const SKILL_ORDER = [
  SkillId.LuckySeven,
  SkillId.ShadowVolley,
  SkillId.KeenSight,
  SkillId.Drain,
  SkillId.PhantomStars,
  SkillId.CriticalThrow,
  SkillId.Avenger,
  SkillId.AbyssRain,
  SkillId.ShadowBreathing,
  SkillId.Rasengan,
  SkillId.NineTailsTransformation,
  SkillId.TailedBeastBomb,
  SkillId.TeamAssault,
  SkillId.ThunderOrb,
  SkillId.SageMode,
] as const;

export const SKILL_HOTKEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "0",
  "-",
] as const;

export type SkillHotkey = (typeof SKILL_HOTKEYS)[number];

export const EXTRA_SKILL_HOTKEYS = [
  "Shift",
  "Q",
  "W",
  "E",
  "R",
  "A",
  "S",
  "D",
  "F",
  "X",
  "C",
  "V",
] as const;

export type ExtraSkillHotkey = (typeof EXTRA_SKILL_HOTKEYS)[number];
export type SkillHotkeyAliases = Partial<
  Record<ExtraSkillHotkey, ActiveSkillId>
>;

export const DEFAULT_SKILL_HOTKEY_ALIASES: Readonly<SkillHotkeyAliases> = {
  Shift: SkillId.LuckySeven,
  Q: SkillId.ShadowVolley,
  W: SkillId.PhantomStars,
  E: SkillId.AbyssRain,
  R: SkillId.ThunderOrb,
  X: SkillId.Drain,
  C: SkillId.Avenger,
  V: SkillId.Rasengan,
};

export const SKILL_HOTKEY_ASSIGNMENTS = SKILL_HOTKEYS.map(
  (
    hotkey,
    index,
  ): { hotkey: SkillHotkey; skillId: ActiveSkillId | undefined } => ({
    hotkey,
    skillId: ACTIVE_SKILL_ORDER[index],
  }),
);

export function normalizeSkillHotbar(value: unknown): ActiveSkillId[] {
  const normalized: ActiveSkillId[] = [];
  if (Array.isArray(value)) {
    for (const candidate of value) {
      if (
        typeof candidate === "string" &&
        (ACTIVE_SKILL_ORDER as readonly string[]).includes(candidate) &&
        !normalized.includes(candidate as ActiveSkillId)
      ) {
        normalized.push(candidate as ActiveSkillId);
      }
    }
  }
  for (const skillId of ACTIVE_SKILL_ORDER) {
    if (!normalized.includes(skillId)) {
      normalized.push(skillId);
    }
  }
  return normalized;
}

export function normalizeSkillHotkeyAliases(
  value: unknown,
): SkillHotkeyAliases {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  const source = value as Record<string, unknown>;
  const normalized: SkillHotkeyAliases = {};
  for (const hotkey of EXTRA_SKILL_HOTKEYS) {
    const skillId = source[hotkey];
    if (
      typeof skillId === "string" &&
      (ACTIVE_SKILL_ORDER as readonly string[]).includes(skillId)
    ) {
      normalized[hotkey] = skillId as ActiveSkillId;
    }
  }
  return normalized;
}

export function assignSkillHotkeyAlias(
  aliases: SkillHotkeyAliases,
  hotkey: ExtraSkillHotkey,
  skillId?: ActiveSkillId,
): SkillHotkeyAliases {
  const next = normalizeSkillHotkeyAliases(aliases);
  if (skillId) next[hotkey] = skillId;
  else delete next[hotkey];
  return next;
}

export function swapSkillHotkeyAliases(
  aliases: SkillHotkeyAliases,
  sourceHotkey: ExtraSkillHotkey,
  targetHotkey: ExtraSkillHotkey,
): SkillHotkeyAliases {
  const next = normalizeSkillHotkeyAliases(aliases);
  const sourceSkillId = next[sourceHotkey];
  const targetSkillId = next[targetHotkey];
  if (targetSkillId) next[sourceHotkey] = targetSkillId;
  else delete next[sourceHotkey];
  if (sourceSkillId) next[targetHotkey] = sourceSkillId;
  else delete next[targetHotkey];
  return next;
}

export function skillHotkeyAssignments(
  hotbar: readonly ActiveSkillId[] = ACTIVE_SKILL_ORDER,
): { hotkey: SkillHotkey; skillId: ActiveSkillId }[] {
  const normalized = normalizeSkillHotbar(hotbar);
  return SKILL_HOTKEYS.map((hotkey, index) => ({
    hotkey,
    skillId: normalized[index]!,
  }));
}

export function swapSkillHotbarSlots(
  hotbar: readonly ActiveSkillId[],
  sourceSkillId: ActiveSkillId,
  targetSkillId: ActiveSkillId,
): ActiveSkillId[] {
  const normalized = normalizeSkillHotbar(hotbar);
  const sourceIndex = normalized.indexOf(sourceSkillId);
  const targetIndex = normalized.indexOf(targetSkillId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
    return normalized;
  }
  [normalized[sourceIndex], normalized[targetIndex]] = [
    normalized[targetIndex]!,
    normalized[sourceIndex]!,
  ];
  return normalized;
}

export function skillHotkeyFor(
  skillId: ActiveSkillId,
  hotbar: readonly ActiveSkillId[] = ACTIVE_SKILL_ORDER,
): SkillHotkey {
  const hotkey = SKILL_HOTKEYS[normalizeSkillHotbar(hotbar).indexOf(skillId)];
  if (!hotkey) {
    throw new Error(`No hotkey slot is available for skill: ${skillId}`);
  }
  return hotkey;
}

export function skillHotkeysFor(
  skillId: ActiveSkillId,
  hotbar: readonly ActiveSkillId[] = ACTIVE_SKILL_ORDER,
  aliases: SkillHotkeyAliases = DEFAULT_SKILL_HOTKEY_ALIASES,
): (SkillHotkey | ExtraSkillHotkey)[] {
  return [
    skillHotkeyFor(skillId, hotbar),
    ...EXTRA_SKILL_HOTKEYS.filter((hotkey) => aliases[hotkey] === skillId),
  ];
}

export function isActiveSkillId(skillId: SkillId): skillId is ActiveSkillId {
  return (ACTIVE_SKILL_ORDER as readonly SkillId[]).includes(skillId);
}

export function isPassiveSkillId(skillId: SkillId): skillId is PassiveSkillId {
  return (PASSIVE_SKILL_ORDER as readonly SkillId[]).includes(skillId);
}

export function isSkillUnlocked(skillId: SkillId, job: PlayerJobType): boolean {
  return (
    PLAYER_JOB_RANK[job] >=
    PLAYER_JOB_RANK[SKILL_DEFINITIONS[skillId].requiredJob]
  );
}

export function allocateSkillPoint(
  character: PlayerProfile,
  skillId: SkillId,
): PlayerProfile {
  const definition = SKILL_DEFINITIONS[skillId];
  const currentLevel = character.skillLevels[skillId];
  if (
    character.skillPoints <= 0 ||
    currentLevel >= definition.maxLevel ||
    !isSkillUnlocked(skillId, character.job)
  ) {
    return character;
  }

  return {
    ...character,
    skillPoints: character.skillPoints - 1,
    skillLevels: {
      ...character.skillLevels,
      [skillId]: currentLevel + 1,
    },
  };
}

export function skillDamageBonus(
  attackKind: string,
  skillLevels: PlayerSkillLevels | undefined,
): number {
  if (!Object.hasOwn(SKILL_DEFINITIONS, attackKind)) {
    return 0;
  }
  const skillId = attackKind as SkillId;
  if (!isActiveSkillId(skillId)) {
    return 0;
  }
  const definition = SKILL_DEFINITIONS[skillId];
  if (definition.kind !== "active") {
    return 0;
  }
  const level = normalizeSkillLevel(
    skillLevels?.[skillId],
    definition.maxLevel,
  );
  return level * definition.damagePerLevel;
}

export const CRITICAL_THROW_DAMAGE_MULTIPLIER =
  SKILL_DEFINITIONS[SkillId.CriticalThrow].effect.damageMultiplier;

export function keenSightRangeMultiplier(
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return (
    1 +
    (passiveSkillLevel(SkillId.KeenSight, skillLevels) *
      SKILL_DEFINITIONS[SkillId.KeenSight].effect.percentPerLevel) /
      100
  );
}

export function criticalThrowChance(
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return (
    (passiveSkillLevel(SkillId.CriticalThrow, skillLevels) *
      SKILL_DEFINITIONS[SkillId.CriticalThrow].effect.chancePercentPerLevel) /
    100
  );
}

export function shadowBreathingRecoveryIntervalMultiplier(
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return (
    1 -
    (passiveSkillLevel(SkillId.ShadowBreathing, skillLevels) *
      SKILL_DEFINITIONS[SkillId.ShadowBreathing].effect
        .reductionPercentPerLevel) /
      100
  );
}

export function sageModeRecoveryIntervalMultiplier(
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return (
    1 -
    (passiveSkillLevel(SkillId.SageMode, skillLevels) *
      SKILL_DEFINITIONS[SkillId.SageMode].effect.reductionPercentPerLevel) /
      100
  );
}

export const NINE_TAILS_TRANSFORMATION_MP_COST = 60;
export const NINE_TAILS_TRANSFORMATION_MP_DRAIN_INTERVAL_MS = 1_000;
export const NINE_TAILS_TRANSFORMATION_MP_DRAIN_PERCENT = 1;

export interface NineTailsTransformationDrainResult {
  active: boolean;
  remainingMp: number;
  drainedMp: number;
}

export function drainNineTailsTransformationMp(
  active: boolean,
  character: Pick<PlayerProfile, "mp" | "maxMp">,
  tickCount = 1,
): NineTailsTransformationDrainResult {
  const maxMp = Number.isFinite(character.maxMp)
    ? Math.max(0, Math.floor(character.maxMp))
    : 0;
  const currentMp = Number.isFinite(character.mp)
    ? Math.min(maxMp, Math.max(0, Math.floor(character.mp)))
    : 0;
  if (!active) {
    return { active: false, remainingMp: currentMp, drainedMp: 0 };
  }

  const ticks = Number.isFinite(tickCount)
    ? Math.max(0, Math.floor(tickCount))
    : 0;
  const drainPerTick =
    maxMp > 0
      ? Math.max(
          1,
          Math.ceil((maxMp * NINE_TAILS_TRANSFORMATION_MP_DRAIN_PERCENT) / 100),
        )
      : 0;
  const remainingMp = Math.max(0, currentMp - drainPerTick * ticks);
  return {
    active: remainingMp > 0,
    remainingMp,
    drainedMp: currentMp - remainingMp,
  };
}

export function nineTailsTransformationDamageMultiplier(
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return (
    1 +
    normalizeSkillLevel(
      skillLevels?.[SkillId.NineTailsTransformation],
      SKILL_DEFINITIONS[SkillId.NineTailsTransformation].maxLevel,
    ) *
      0.025
  );
}

export type NineTailsTransformationBlockReason =
  "job-required" | "not-enough-mp";

export type NineTailsTransformationToggleResult =
  | {
      ok: true;
      active: boolean;
      remainingMp: number;
    }
  | {
      ok: false;
      active: boolean;
      remainingMp: number;
      reason: NineTailsTransformationBlockReason;
    };

export function toggleNineTailsTransformation(
  active: boolean,
  character: Pick<PlayerProfile, "job" | "mp">,
): NineTailsTransformationToggleResult {
  if (active) {
    return { ok: true, active: false, remainingMp: character.mp };
  }
  if (!isSkillUnlocked(SkillId.NineTailsTransformation, character.job)) {
    return {
      ok: false,
      active: false,
      remainingMp: character.mp,
      reason: "job-required",
    };
  }
  if (character.mp < NINE_TAILS_TRANSFORMATION_MP_COST) {
    return {
      ok: false,
      active: false,
      remainingMp: character.mp,
      reason: "not-enough-mp",
    };
  }
  return {
    ok: true,
    active: true,
    remainingMp: character.mp - NINE_TAILS_TRANSFORMATION_MP_COST,
  };
}

export function normalizeSkillLevels(value: unknown): PlayerSkillLevels {
  const record =
    typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    [SkillId.LuckySeven]: normalizeSkillLevel(
      record[SkillId.LuckySeven],
      SKILL_DEFINITIONS[SkillId.LuckySeven].maxLevel,
    ),
    [SkillId.ShadowVolley]: normalizeSkillLevel(
      record[SkillId.ShadowVolley],
      SKILL_DEFINITIONS[SkillId.ShadowVolley].maxLevel,
    ),
    [SkillId.KeenSight]: normalizeSkillLevel(
      record[SkillId.KeenSight],
      SKILL_DEFINITIONS[SkillId.KeenSight].maxLevel,
    ),
    [SkillId.Drain]: normalizeSkillLevel(
      record[SkillId.Drain],
      SKILL_DEFINITIONS[SkillId.Drain].maxLevel,
    ),
    [SkillId.PhantomStars]: normalizeSkillLevel(
      record[SkillId.PhantomStars],
      SKILL_DEFINITIONS[SkillId.PhantomStars].maxLevel,
    ),
    [SkillId.CriticalThrow]: normalizeSkillLevel(
      record[SkillId.CriticalThrow],
      SKILL_DEFINITIONS[SkillId.CriticalThrow].maxLevel,
    ),
    [SkillId.Avenger]: normalizeSkillLevel(
      record[SkillId.Avenger],
      SKILL_DEFINITIONS[SkillId.Avenger].maxLevel,
    ),
    [SkillId.AbyssRain]: normalizeSkillLevel(
      record[SkillId.AbyssRain],
      SKILL_DEFINITIONS[SkillId.AbyssRain].maxLevel,
    ),
    [SkillId.ShadowBreathing]: normalizeSkillLevel(
      record[SkillId.ShadowBreathing],
      SKILL_DEFINITIONS[SkillId.ShadowBreathing].maxLevel,
    ),
    [SkillId.Rasengan]: normalizeSkillLevel(
      record[SkillId.Rasengan],
      SKILL_DEFINITIONS[SkillId.Rasengan].maxLevel,
    ),
    [SkillId.NineTailsTransformation]: normalizeSkillLevel(
      record[SkillId.NineTailsTransformation],
      SKILL_DEFINITIONS[SkillId.NineTailsTransformation].maxLevel,
    ),
    [SkillId.TailedBeastBomb]: normalizeSkillLevel(
      record[SkillId.TailedBeastBomb],
      SKILL_DEFINITIONS[SkillId.TailedBeastBomb].maxLevel,
    ),
    [SkillId.TeamAssault]: normalizeSkillLevel(
      record[SkillId.TeamAssault],
      SKILL_DEFINITIONS[SkillId.TeamAssault].maxLevel,
    ),
    [SkillId.ThunderOrb]: normalizeSkillLevel(
      record[SkillId.ThunderOrb],
      SKILL_DEFINITIONS[SkillId.ThunderOrb].maxLevel,
    ),
    [SkillId.SageMode]: normalizeSkillLevel(
      record[SkillId.SageMode],
      SKILL_DEFINITIONS[SkillId.SageMode].maxLevel,
    ),
  };
}

export function earnedSkillPointsForLevel(level: number): number {
  return Math.max(0, Math.floor(level) - 10) * 3;
}

function passiveSkillLevel(
  skillId: PassiveSkillId,
  skillLevels: PlayerSkillLevels | undefined,
): number {
  return normalizeSkillLevel(
    skillLevels?.[skillId],
    SKILL_DEFINITIONS[skillId].maxLevel,
  );
}

function normalizeSkillLevel(value: unknown, maximum: number): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? Math.min(value, maximum)
    : 0;
}
