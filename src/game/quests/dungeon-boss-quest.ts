import type { MonsterKind } from "../data/catalog";

export const DungeonBossQuestId = {
  MoonlitSeal: "moonlitSeal",
} as const;

export type DungeonBossQuestId =
  (typeof DungeonBossQuestId)[keyof typeof DungeonBossQuestId];

export const DungeonBossQuestStage = {
  Offer: "offer",
  MidBoss: "midboss",
  UpperBoss: "upperboss",
  FinalBoss: "finalboss",
  TurnIn: "turn-in",
  Complete: "complete",
} as const;

export type DungeonBossQuestStage =
  (typeof DungeonBossQuestStage)[keyof typeof DungeonBossQuestStage];

export interface DungeonBossQuestProgress {
  id: DungeonBossQuestId;
  stage: DungeonBossQuestStage;
}

export const DUNGEON_BOSS_QUEST = {
  id: DungeonBossQuestId.MoonlitSeal,
  title: "깨어난 던전 회랑",
  recommendedLevel: {
    minimum: 100,
    maximum: 200,
  },
  midBoss: {
    kind: "emberWarden" as MonsterKind,
    name: "폭열군주 이그니카르",
    destination: "잿불 광산",
    recommendedLevel: 100,
  },
  upperBoss: {
    kind: "eclipseArchivist" as MonsterKind,
    name: "월식현자 루나시온",
    destination: "달빛 마도서고",
    recommendedLevel: 140,
  },
  finalBoss: {
    kind: "onePunchMan" as MonsterKind,
    name: "원펀맨",
    destination: "무한의 결투장",
    recommendedLevel: 200,
  },
  reward: {
    mesos: 7_500,
    experienceBooks: 2,
  },
} as const;

export function dungeonBossQuestRecommendedLevelText(): string {
  return `Lv.${DUNGEON_BOSS_QUEST.recommendedLevel.minimum}~${DUNGEON_BOSS_QUEST.recommendedLevel.maximum}`;
}

export function defaultDungeonBossQuestProgress(): DungeonBossQuestProgress {
  return {
    id: DungeonBossQuestId.MoonlitSeal,
    stage: DungeonBossQuestStage.Offer,
  };
}

export function acceptDungeonBossQuest(
  progress: DungeonBossQuestProgress,
): DungeonBossQuestProgress {
  return progress.stage === DungeonBossQuestStage.Offer
    ? { ...progress, stage: DungeonBossQuestStage.MidBoss }
    : progress;
}

export function recordDungeonBossDefeat(
  progress: DungeonBossQuestProgress,
  monsterKind: MonsterKind,
): DungeonBossQuestProgress {
  if (
    progress.stage === DungeonBossQuestStage.MidBoss &&
    monsterKind === DUNGEON_BOSS_QUEST.midBoss.kind
  ) {
    return { ...progress, stage: DungeonBossQuestStage.UpperBoss };
  }
  if (
    progress.stage === DungeonBossQuestStage.UpperBoss &&
    monsterKind === DUNGEON_BOSS_QUEST.upperBoss.kind
  ) {
    return { ...progress, stage: DungeonBossQuestStage.FinalBoss };
  }
  if (
    progress.stage === DungeonBossQuestStage.FinalBoss &&
    monsterKind === DUNGEON_BOSS_QUEST.finalBoss.kind
  ) {
    return { ...progress, stage: DungeonBossQuestStage.TurnIn };
  }
  return progress;
}

export interface DungeonBossQuestClaimResult {
  progress: DungeonBossQuestProgress;
  claimed: boolean;
  reward: typeof DUNGEON_BOSS_QUEST.reward;
}

export function claimDungeonBossQuest(
  progress: DungeonBossQuestProgress,
): DungeonBossQuestClaimResult {
  if (progress.stage !== DungeonBossQuestStage.TurnIn) {
    return { progress, claimed: false, reward: DUNGEON_BOSS_QUEST.reward };
  }
  return {
    progress: { ...progress, stage: DungeonBossQuestStage.Complete },
    claimed: true,
    reward: DUNGEON_BOSS_QUEST.reward,
  };
}

export function normalizeDungeonBossQuestProgress(
  value: unknown,
  legacyV10 = false,
): DungeonBossQuestProgress {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return defaultDungeonBossQuestProgress();
  }
  const record = value as Record<string, unknown>;
  const stages = Object.values(DungeonBossQuestStage);
  if (
    record.id !== DungeonBossQuestId.MoonlitSeal ||
    !stages.includes(record.stage as DungeonBossQuestStage)
  ) {
    return defaultDungeonBossQuestProgress();
  }
  const stage = record.stage as DungeonBossQuestStage;
  return {
    id: DungeonBossQuestId.MoonlitSeal,
    stage:
      legacyV10 && stage === DungeonBossQuestStage.FinalBoss
        ? DungeonBossQuestStage.UpperBoss
        : stage,
  };
}

export function dungeonBossQuestTrackerText(
  progress: DungeonBossQuestProgress,
): string | null {
  const level = dungeonBossQuestRecommendedLevelText();
  switch (progress.stage) {
    case DungeonBossQuestStage.MidBoss:
      return `${DUNGEON_BOSS_QUEST.title} · 적정 ${level} · ${DUNGEON_BOSS_QUEST.midBoss.name} 처치`;
    case DungeonBossQuestStage.UpperBoss:
      return `${DUNGEON_BOSS_QUEST.title} · 적정 ${level} · ${DUNGEON_BOSS_QUEST.upperBoss.name} 처치`;
    case DungeonBossQuestStage.FinalBoss:
      return `${DUNGEON_BOSS_QUEST.title} · 적정 ${level} · ${DUNGEON_BOSS_QUEST.finalBoss.name} 처치`;
    case DungeonBossQuestStage.TurnIn:
      return `${DUNGEON_BOSS_QUEST.title} · 적정 ${level} · 원정대장 세라에게 보고`;
    default:
      return null;
  }
}
