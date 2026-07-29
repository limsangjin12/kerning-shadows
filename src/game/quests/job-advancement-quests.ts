import {
  JOB_ADVANCEMENTS,
  advanceJob,
  jobAdvancementState,
  type JobAdvancementDefinition,
} from "../combat/combat-rules";
import {
  PlayerJob,
  type MonsterKind,
  type PlayerProfile,
} from "../data/catalog";

export const JobAdvancementQuestId = {
  RogueTrial: "rogueTrial",
  AssassinTrial: "assassinTrial",
  HermitTrial: "hermitTrial",
  HokageTrial: "hokageTrial",
} as const;

export type JobAdvancementQuestId =
  (typeof JobAdvancementQuestId)[keyof typeof JobAdvancementQuestId];

export interface ActiveJobAdvancementQuest {
  id: JobAdvancementQuestId;
  defeated: number;
}

export interface JobAdvancementQuestDefinition {
  id: JobAdvancementQuestId;
  advancement: JobAdvancementDefinition;
  title: string;
  targetKind: MonsterKind;
  targetLabel: string;
  requiredDefeats: number;
  destination: string;
}

const advancementFrom = (job: PlayerJob): JobAdvancementDefinition => {
  const advancement = JOB_ADVANCEMENTS.find(
    (candidate) => candidate.from === job,
  );
  if (!advancement) {
    throw new Error(`Missing job advancement definition for ${job}.`);
  }
  return advancement;
};

export const JOB_ADVANCEMENT_QUESTS: readonly JobAdvancementQuestDefinition[] =
  [
    {
      id: JobAdvancementQuestId.RogueTrial,
      advancement: advancementFrom(PlayerJob.Beginner),
      title: "로그의 첫 그림자",
      targetKind: "greenMushroom",
      targetLabel: "초록버섯",
      requiredDefeats: 5,
      destination: "그림자 시험장",
    },
    {
      id: JobAdvancementQuestId.AssassinTrial,
      advancement: advancementFrom(PlayerJob.Rogue),
      title: "어쌔신의 추적 시험",
      targetKind: "shadowSentinel",
      targetLabel: "그림자 파수꾼",
      requiredDefeats: 6,
      destination: "그림자 시험장",
    },
    {
      id: JobAdvancementQuestId.HermitTrial,
      advancement: advancementFrom(PlayerJob.Assassin),
      title: "허밋의 심연 시험",
      targetKind: "abyssGolem",
      targetLabel: "심연의 골렘",
      requiredDefeats: 3,
      destination: "그림자 시험장",
    },
    {
      id: JobAdvancementQuestId.HokageTrial,
      advancement: advancementFrom(PlayerJob.Hermit),
      title: "호카게의 차크라 시험",
      targetKind: "abyssGolem",
      targetLabel: "심연의 골렘",
      requiredDefeats: 8,
      destination: "그림자 시험장",
    },
  ] as const;

export type JobAdvancementQuestState =
  | { status: "maximum-rank" }
  | {
      status: "level-too-low" | "offer" | "active" | "ready-to-advance";
      quest: JobAdvancementQuestDefinition;
      defeated: number;
    };

export function questDefinitionForId(
  id: JobAdvancementQuestId,
): JobAdvancementQuestDefinition {
  const quest = JOB_ADVANCEMENT_QUESTS.find((candidate) => candidate.id === id);
  if (!quest) {
    throw new Error(`Unknown job advancement quest: ${id}`);
  }
  return quest;
}

export function jobAdvancementQuestState(
  character: Pick<PlayerProfile, "job" | "level">,
  activeQuest: ActiveJobAdvancementQuest | null,
): JobAdvancementQuestState {
  const advancementState = jobAdvancementState(character);
  if (advancementState.status === "maximum-rank") {
    return { status: "maximum-rank" };
  }
  const quest = JOB_ADVANCEMENT_QUESTS.find(
    (candidate) => candidate.advancement.from === character.job,
  );
  if (!quest) {
    return { status: "maximum-rank" };
  }
  if (character.level < quest.advancement.requiredLevel) {
    return { status: "level-too-low", quest, defeated: 0 };
  }
  if (!activeQuest || activeQuest.id !== quest.id) {
    return { status: "offer", quest, defeated: 0 };
  }
  const defeated = Math.min(
    quest.requiredDefeats,
    Math.max(0, Math.floor(activeQuest.defeated)),
  );
  return {
    status: defeated >= quest.requiredDefeats ? "ready-to-advance" : "active",
    quest,
    defeated,
  };
}

export function acceptJobAdvancementQuest(
  character: Pick<PlayerProfile, "job" | "level">,
  activeQuest: ActiveJobAdvancementQuest | null,
): ActiveJobAdvancementQuest | null {
  const state = jobAdvancementQuestState(character, activeQuest);
  return state.status === "offer"
    ? { id: state.quest.id, defeated: 0 }
    : activeQuest;
}

export function recordJobAdvancementDefeat(
  activeQuest: ActiveJobAdvancementQuest | null,
  monsterKind: MonsterKind,
): ActiveJobAdvancementQuest | null {
  if (!activeQuest) return null;
  const quest = questDefinitionForId(activeQuest.id);
  if (quest.targetKind !== monsterKind) return activeQuest;
  return {
    ...activeQuest,
    defeated: Math.min(
      quest.requiredDefeats,
      Math.max(0, activeQuest.defeated) + 1,
    ),
  };
}

export interface JobAdvancementClaimResult {
  character: PlayerProfile;
  activeQuest: ActiveJobAdvancementQuest | null;
  advanced: boolean;
}

export function claimJobAdvancementQuest(
  character: PlayerProfile,
  activeQuest: ActiveJobAdvancementQuest | null,
): JobAdvancementClaimResult {
  const state = jobAdvancementQuestState(character, activeQuest);
  if (state.status !== "ready-to-advance") {
    return { character, activeQuest, advanced: false };
  }
  const nextCharacter = advanceJob(character);
  if (nextCharacter === character) {
    return { character, activeQuest, advanced: false };
  }
  return { character: nextCharacter, activeQuest: null, advanced: true };
}

export function normalizeActiveJobAdvancementQuest(
  value: unknown,
  character: Pick<PlayerProfile, "job" | "level">,
): ActiveJobAdvancementQuest | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (
    !Object.values(JobAdvancementQuestId).includes(
      record.id as JobAdvancementQuestId,
    ) ||
    typeof record.defeated !== "number" ||
    !Number.isSafeInteger(record.defeated)
  ) {
    return null;
  }
  const state = jobAdvancementQuestState(character, null);
  if (state.status !== "offer" || state.quest.id !== record.id) {
    return null;
  }
  return {
    id: state.quest.id,
    defeated: Math.min(
      state.quest.requiredDefeats,
      Math.max(0, record.defeated),
    ),
  };
}

const advancementRankLabel = (job: PlayerJob): string => {
  switch (job) {
    case PlayerJob.Rogue:
      return "2차 전직";
    case PlayerJob.Assassin:
      return "3차 전직";
    case PlayerJob.Hermit:
      return "4차 전직";
    default:
      return "1차 전직";
  }
};

const recommendedHuntingGround = (level: number): string => {
  if (level < 30) return "초록버섯굴 (Lv.10~29)";
  if (level < 50) return "수정 개미굴 (Lv.30~49)";
  if (level < 70) return "시계태엽 탑 (Lv.50~69)";
  if (level < 100) return "가라앉은 산호 신전 (Lv.70~99)";
  return "잿불 광산 (Lv.100~139)";
};

export function jobQuestTrackerText(
  character: Pick<PlayerProfile, "job" | "level">,
  activeQuest: ActiveJobAdvancementQuest | null,
): string | null {
  const state = jobAdvancementQuestState(character, activeQuest);
  if (character.job === PlayerJob.Beginner) {
    if (state.status === "level-too-low") {
      return `초보자 목표 · Lv.10 달성 (${character.level}/10)\n초록버섯굴에서 몬스터를 사냥하세요.`;
    }
    if (state.status === "offer") {
      return "초보자 목표 · Lv.10 달성 완료\n1차 전직 · 커닝시티 다크로드에게 ↑로 시험을 받으세요.";
    }
    if (state.status === "active") {
      return `초보자 목표 · Lv.10 달성 완료\n1차 전직 시험 · ${state.quest.destination} ${state.quest.targetLabel} ${state.defeated}/${state.quest.requiredDefeats}`;
    }
    if (state.status === "ready-to-advance") {
      return "초보자 목표 · Lv.10 달성 완료\n1차 전직 · 커닝시티 다크로드에게 ↑로 완료 보고하세요.";
    }
  }
  if (state.status === "maximum-rank") return null;
  const rankLabel = advancementRankLabel(character.job);
  const requiredLevel = state.quest.advancement.requiredLevel;
  if (state.status === "level-too-low") {
    return `다음 목표 · ${rankLabel} Lv.${requiredLevel} (${character.level}/${requiredLevel})\n추천 사냥 · ${recommendedHuntingGround(character.level)}`;
  }
  if (state.status === "offer") {
    return `다음 목표 · ${rankLabel} Lv.${requiredLevel} 달성 완료\n${rankLabel} · 커닝시티 다크로드에게 ↑로 시험을 받으세요.`;
  }
  if (state.status === "active") {
    return `다음 목표 · ${rankLabel} Lv.${requiredLevel} 달성 완료\n${rankLabel} 시험 · ${state.quest.destination} ${state.quest.targetLabel} ${state.defeated}/${state.quest.requiredDefeats}`;
  }
  return `다음 목표 · ${rankLabel} Lv.${requiredLevel} 달성 완료\n${rankLabel} · 커닝시티 다크로드에게 ↑로 완료 보고하세요.`;
}
