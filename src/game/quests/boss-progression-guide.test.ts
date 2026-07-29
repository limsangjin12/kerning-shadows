import { describe, expect, it } from "vitest";
import {
  BOSS_PROGRESSION_STEPS,
  bossProgressionGuideText,
} from "./boss-progression-guide";
import {
  DungeonBossQuestStage,
  defaultDungeonBossQuestProgress,
  type DungeonBossQuestProgress,
} from "./dungeon-boss-quest";

const progressAt = (
  stage: DungeonBossQuestProgress["stage"],
): DungeonBossQuestProgress => ({
  ...defaultDungeonBossQuestProgress(),
  stage,
});

describe("boss progression guide", () => {
  it("uses the quest definitions' ordered level 100, 140, and 200 boss route", () => {
    expect(BOSS_PROGRESSION_STEPS).toEqual([
      {
        stage: DungeonBossQuestStage.MidBoss,
        name: "폭열군주 이그니카르",
        destination: "잿불 광산",
        recommendedLevel: 100,
      },
      {
        stage: DungeonBossQuestStage.UpperBoss,
        name: "월식현자 루나시온",
        destination: "달빛 마도서고",
        recommendedLevel: 140,
      },
      {
        stage: DungeonBossQuestStage.FinalBoss,
        name: "원펀맨",
        destination: "무한의 결투장",
        recommendedLevel: 200,
      },
    ]);
  });

  it("stays hidden below level 100 and guides acceptance once eligible", () => {
    const offered = defaultDungeonBossQuestProgress();

    expect(bossProgressionGuideText({ level: 99 }, offered)).toBeNull();
    expect(bossProgressionGuideText({ level: 100 }, offered)).toBe(
      "보스 목표 · 커닝시티 세라에게 ↑로 원정 수락",
    );
  });

  it.each([
    {
      stage: DungeonBossQuestStage.UpperBoss,
      level: 139,
      expected:
        "보스 목표 · Lv.140 달성 (139/140) · 달빛 마도서고 루나시온",
    },
    {
      stage: DungeonBossQuestStage.FinalBoss,
      level: 199,
      expected:
        "보스 목표 · Lv.200 달성 (199/200) · 무한의 결투장 원펀맨",
    },
  ])(
    "replaces the $stage kill tracker with its level goal below recommendation",
    ({ stage, level, expected }) => {
      expect(bossProgressionGuideText({ level }, progressAt(stage))).toBe(
        expected,
      );
    },
  );

  it.each([
    {
      stage: DungeonBossQuestStage.MidBoss,
      level: 100,
      expected: "보스 목표 · 잿불 광산 이그니카르 처치",
    },
    {
      stage: DungeonBossQuestStage.UpperBoss,
      level: 140,
      expected: "보스 목표 · 달빛 마도서고 루나시온 처치",
    },
    {
      stage: DungeonBossQuestStage.FinalBoss,
      level: 200,
      expected: "보스 목표 · 무한의 결투장 원펀맨 처치",
    },
    {
      stage: DungeonBossQuestStage.TurnIn,
      level: 100,
      expected: "보스 목표 · 커닝시티 세라에게 ↑로 완료 보고",
    },
  ])(
    "returns one compact $stage line when it is the current goal",
    ({ stage, level, expected }) => {
      const text = bossProgressionGuideText({ level }, progressAt(stage));
      expect(text).toBe(expected);
      expect(text).not.toContain("\n");
    },
  );

  it("stops guiding after the one-time expedition is complete", () => {
    expect(
      bossProgressionGuideText(
        { level: 200 },
        progressAt(DungeonBossQuestStage.Complete),
      ),
    ).toBeNull();
  });

  it("normalizes an invalid display level and leaves quest progress unchanged", () => {
    const offered = defaultDungeonBossQuestProgress();
    expect(bossProgressionGuideText({ level: Number.NaN }, offered)).toBeNull();
    expect(offered).toEqual(defaultDungeonBossQuestProgress());
  });
});
