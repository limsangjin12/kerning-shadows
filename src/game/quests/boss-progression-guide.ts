import {
  MAP_CATALOG,
  NPC_CATALOG,
  type PlayerProfile,
} from "../data/catalog";
import {
  DUNGEON_BOSS_QUEST,
  DungeonBossQuestStage,
  type DungeonBossQuestProgress,
  type DungeonBossQuestStage as DungeonBossQuestStageType,
} from "./dungeon-boss-quest";

export interface BossProgressionStep {
  stage:
    | typeof DungeonBossQuestStage.MidBoss
    | typeof DungeonBossQuestStage.UpperBoss
    | typeof DungeonBossQuestStage.FinalBoss;
  name: string;
  destination: string;
  recommendedLevel: number;
}

export const BOSS_PROGRESSION_STEPS: readonly [
  BossProgressionStep,
  BossProgressionStep,
  BossProgressionStep,
] = [
  {
    stage: DungeonBossQuestStage.MidBoss,
    name: DUNGEON_BOSS_QUEST.midBoss.name,
    destination: DUNGEON_BOSS_QUEST.midBoss.destination,
    recommendedLevel: DUNGEON_BOSS_QUEST.midBoss.recommendedLevel,
  },
  {
    stage: DungeonBossQuestStage.UpperBoss,
    name: DUNGEON_BOSS_QUEST.upperBoss.name,
    destination: DUNGEON_BOSS_QUEST.upperBoss.destination,
    recommendedLevel: DUNGEON_BOSS_QUEST.upperBoss.recommendedLevel,
  },
  {
    stage: DungeonBossQuestStage.FinalBoss,
    name: DUNGEON_BOSS_QUEST.finalBoss.name,
    destination: DUNGEON_BOSS_QUEST.finalBoss.destination,
    recommendedLevel: DUNGEON_BOSS_QUEST.finalBoss.recommendedLevel,
  },
] as const;

function progressionStepForStage(
  stage: DungeonBossQuestStageType,
): BossProgressionStep | null {
  return BOSS_PROGRESSION_STEPS.find((step) => step.stage === stage) ?? null;
}

function normalizedGuideLevel(level: number): number {
  return Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
}

function compactProperName(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

function levelPreparationText(
  currentLevel: number,
  step: BossProgressionStep,
): string {
  return `보스 목표 · Lv.${step.recommendedLevel} 달성 (${currentLevel}/${step.recommendedLevel}) · ${step.destination} ${compactProperName(step.name)}`;
}

function bossDefeatText(step: BossProgressionStep): string {
  return `보스 목표 · ${step.destination} ${compactProperName(step.name)} 처치`;
}

/**
 * Returns the single text that owns the boss-progression slot in the quest HUD.
 *
 * It stays hidden below Lv.100 so the early job guide owns the limited HUD
 * space. After Lv.100, it returns exactly one compact line for accepting the
 * expedition, reaching the next boss's level, defeating that boss, or turning
 * the quest in. It intentionally replaces dungeonBossQuestTrackerText rather
 * than being rendered beside it; completion returns null.
 */
export function bossProgressionGuideText(
  character: Pick<PlayerProfile, "level">,
  progress: DungeonBossQuestProgress,
): string | null {
  const currentLevel = normalizedGuideLevel(character.level);

  if (currentLevel < DUNGEON_BOSS_QUEST.recommendedLevel.minimum) return null;
  if (progress.stage === DungeonBossQuestStage.Complete) return null;

  if (progress.stage === DungeonBossQuestStage.Offer) {
    return `보스 목표 · ${MAP_CATALOG.kerningCity.name} ${compactProperName(NPC_CATALOG.dungeonScout.name)}에게 ↑로 원정 수락`;
  }

  const activeStep = progressionStepForStage(progress.stage);
  if (activeStep && currentLevel < activeStep.recommendedLevel) {
    return levelPreparationText(currentLevel, activeStep);
  }
  if (activeStep) return bossDefeatText(activeStep);

  if (progress.stage === DungeonBossQuestStage.TurnIn) {
    return `보스 목표 · ${MAP_CATALOG.kerningCity.name} ${compactProperName(NPC_CATALOG.dungeonScout.name)}에게 ↑로 완료 보고`;
  }

  return null;
}
