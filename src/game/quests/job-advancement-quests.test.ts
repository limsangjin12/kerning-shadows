import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE, PlayerJob } from "../data/catalog";
import {
  JOB_ADVANCEMENT_QUESTS,
  JobAdvancementQuestId,
  acceptJobAdvancementQuest,
  claimJobAdvancementQuest,
  jobAdvancementQuestState,
  jobQuestTrackerText,
  recordJobAdvancementDefeat,
} from "./job-advancement-quests";

const character = (job: PlayerJob, level: number) => ({
  ...DEFAULT_PLAYER_PROFILE,
  job,
  level,
  stats: { ...DEFAULT_PLAYER_PROFILE.stats },
});

describe("job advancement quests", () => {
  it("offers each trial only at the required level", () => {
    expect(
      JOB_ADVANCEMENT_QUESTS.map(
        ({ advancement }) => advancement.requiredLevel,
      ),
    ).toEqual([10, 30, 60, 120]);
    expect(
      jobAdvancementQuestState(character(PlayerJob.Beginner, 9), null).status,
    ).toBe("level-too-low");
    expect(
      jobAdvancementQuestState(character(PlayerJob.Beginner, 10), null),
    ).toMatchObject({
      status: "offer",
      quest: { id: JobAdvancementQuestId.RogueTrial, requiredDefeats: 5 },
    });
    expect(
      jobAdvancementQuestState(character(PlayerJob.Rogue, 30), null),
    ).toMatchObject({
      status: "offer",
      quest: { id: JobAdvancementQuestId.AssassinTrial, requiredDefeats: 6 },
    });
    expect(
      jobAdvancementQuestState(character(PlayerJob.Assassin, 60), null),
    ).toMatchObject({
      status: "offer",
      quest: { id: JobAdvancementQuestId.HermitTrial, requiredDefeats: 3 },
    });
    expect(
      jobAdvancementQuestState(character(PlayerJob.Hermit, 119), null).status,
    ).toBe("level-too-low");
    expect(
      jobAdvancementQuestState(character(PlayerJob.Hermit, 120), null),
    ).toMatchObject({
      status: "offer",
      quest: { id: JobAdvancementQuestId.HokageTrial, requiredDefeats: 8 },
    });
    expect(
      jobAdvancementQuestState(character(PlayerJob.Hokage, 120), null).status,
    ).toBe("maximum-rank");
  });

  it("enforces the advancement level gate even with a completed objective", () => {
    const underleveled = character(PlayerJob.Beginner, 9);
    expect(acceptJobAdvancementQuest(underleveled, null)).toBeNull();
    expect(
      claimJobAdvancementQuest(underleveled, {
        id: JobAdvancementQuestId.RogueTrial,
        defeated: 5,
      }),
    ).toMatchObject({
      advanced: false,
      character: { job: PlayerJob.Beginner },
      activeQuest: { id: JobAdvancementQuestId.RogueTrial, defeated: 5 },
    });
  });

  it("advances a level 120 Hermit after eight Abyss Golems", () => {
    const hermit = character(PlayerJob.Hermit, 120);
    let active = acceptJobAdvancementQuest(hermit, null);
    expect(active).toEqual({
      id: JobAdvancementQuestId.HokageTrial,
      defeated: 0,
    });
    for (let defeated = 0; defeated < 8; defeated += 1) {
      active = recordJobAdvancementDefeat(active, "abyssGolem");
    }

    expect(claimJobAdvancementQuest(hermit, active)).toMatchObject({
      advanced: true,
      activeQuest: null,
      character: { job: PlayerJob.Hokage },
    });
  });

  it("counts only the configured monster and saturates at the objective", () => {
    const beginner = character(PlayerJob.Beginner, 10);
    let active = acceptJobAdvancementQuest(beginner, null);
    expect(active).toEqual({
      id: JobAdvancementQuestId.RogueTrial,
      defeated: 0,
    });
    active = recordJobAdvancementDefeat(active, "shadowSentinel");
    expect(active?.defeated).toBe(0);
    for (let index = 0; index < 7; index += 1) {
      active = recordJobAdvancementDefeat(active, "greenMushroom");
    }
    expect(active?.defeated).toBe(5);
    expect(jobAdvancementQuestState(beginner, active).status).toBe(
      "ready-to-advance",
    );
    expect(jobQuestTrackerText(beginner, active)).toContain("완료 보고하세요");
  });

  it("guides a beginner from level 10 growth through the first advancement", () => {
    expect(jobQuestTrackerText(character(PlayerJob.Beginner, 7), null)).toBe(
      "초보자 목표 · Lv.10 달성 (7/10)\n초록버섯굴에서 몬스터를 사냥하세요.",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Beginner, 10), null)).toBe(
      "초보자 목표 · Lv.10 달성 완료\n1차 전직 · 커닝시티 다크로드에게 ↑로 시험을 받으세요.",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Beginner, 10), {
        id: JobAdvancementQuestId.RogueTrial,
        defeated: 3,
      }),
    ).toBe(
      "초보자 목표 · Lv.10 달성 완료\n1차 전직 시험 · 그림자 시험장 초록버섯 3/5",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Beginner, 10), {
        id: JobAdvancementQuestId.RogueTrial,
        defeated: 5,
      }),
    ).toBe(
      "초보자 목표 · Lv.10 달성 완료\n1차 전직 · 커닝시티 다크로드에게 ↑로 완료 보고하세요.",
    );
  });

  it("guides a Rogue through the second advancement", () => {
    expect(jobQuestTrackerText(character(PlayerJob.Rogue, 29), null)).toBe(
      "다음 목표 · 2차 전직 Lv.30 (29/30)\n추천 사냥 · 초록버섯굴 (Lv.10~29)",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Rogue, 30), null)).toBe(
      "다음 목표 · 2차 전직 Lv.30 달성 완료\n2차 전직 · 커닝시티 다크로드에게 ↑로 시험을 받으세요.",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Rogue, 30), {
        id: JobAdvancementQuestId.AssassinTrial,
        defeated: 2,
      }),
    ).toBe(
      "다음 목표 · 2차 전직 Lv.30 달성 완료\n2차 전직 시험 · 그림자 시험장 그림자 파수꾼 2/6",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Rogue, 30), {
        id: JobAdvancementQuestId.AssassinTrial,
        defeated: 6,
      }),
    ).toBe(
      "다음 목표 · 2차 전직 Lv.30 달성 완료\n2차 전직 · 커닝시티 다크로드에게 ↑로 완료 보고하세요.",
    );
  });

  it("recommends level-appropriate hunting grounds before later advancements", () => {
    expect(jobQuestTrackerText(character(PlayerJob.Assassin, 30), null)).toBe(
      "다음 목표 · 3차 전직 Lv.60 (30/60)\n추천 사냥 · 수정 개미굴 (Lv.30~49)",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Assassin, 50), null)).toBe(
      "다음 목표 · 3차 전직 Lv.60 (50/60)\n추천 사냥 · 시계태엽 탑 (Lv.50~69)",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Hermit, 70), null)).toBe(
      "다음 목표 · 4차 전직 Lv.120 (70/120)\n추천 사냥 · 가라앉은 산호 신전 (Lv.70~99)",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Hermit, 100), null)).toBe(
      "다음 목표 · 4차 전직 Lv.120 (100/120)\n추천 사냥 · 잿불 광산 (Lv.100~139)",
    );
  });

  it("guides the third and fourth advancement offer, trial, and report states", () => {
    expect(jobQuestTrackerText(character(PlayerJob.Assassin, 60), null)).toBe(
      "다음 목표 · 3차 전직 Lv.60 달성 완료\n3차 전직 · 커닝시티 다크로드에게 ↑로 시험을 받으세요.",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Assassin, 60), {
        id: JobAdvancementQuestId.HermitTrial,
        defeated: 1,
      }),
    ).toBe(
      "다음 목표 · 3차 전직 Lv.60 달성 완료\n3차 전직 시험 · 그림자 시험장 심연의 골렘 1/3",
    );
    expect(jobQuestTrackerText(character(PlayerJob.Hermit, 120), null)).toBe(
      "다음 목표 · 4차 전직 Lv.120 달성 완료\n4차 전직 · 커닝시티 다크로드에게 ↑로 시험을 받으세요.",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Hermit, 120), {
        id: JobAdvancementQuestId.HokageTrial,
        defeated: 8,
      }),
    ).toBe(
      "다음 목표 · 4차 전직 Lv.120 달성 완료\n4차 전직 · 커닝시티 다크로드에게 ↑로 완료 보고하세요.",
    );
    expect(
      jobQuestTrackerText(character(PlayerJob.Hokage, 120), null),
    ).toBeNull();
  });

  it("refuses an early report and atomically clears a completed trial", () => {
    const beginner = character(PlayerJob.Beginner, 10);
    const early = claimJobAdvancementQuest(beginner, {
      id: JobAdvancementQuestId.RogueTrial,
      defeated: 4,
    });
    expect(early.advanced).toBe(false);
    expect(early.character.job).toBe(PlayerJob.Beginner);

    const completed = claimJobAdvancementQuest(beginner, {
      id: JobAdvancementQuestId.RogueTrial,
      defeated: 5,
    });
    expect(completed).toMatchObject({
      advanced: true,
      activeQuest: null,
      character: { job: PlayerJob.Rogue },
    });
  });
});
