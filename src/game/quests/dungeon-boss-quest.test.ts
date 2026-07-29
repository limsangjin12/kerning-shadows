import { describe, expect, it } from "vitest";
import {
  DungeonBossQuestStage,
  acceptDungeonBossQuest,
  claimDungeonBossQuest,
  defaultDungeonBossQuestProgress,
  dungeonBossQuestRecommendedLevelText,
  dungeonBossQuestTrackerText,
  normalizeDungeonBossQuestProgress,
  recordDungeonBossDefeat,
} from "./dungeon-boss-quest";

describe("dungeon boss quest", () => {
  it("advances only through the ordered midboss, upper boss, and final boss", () => {
    const offered = defaultDungeonBossQuestProgress();
    const midboss = acceptDungeonBossQuest(offered);
    expect(midboss.stage).toBe(DungeonBossQuestStage.MidBoss);
    expect(dungeonBossQuestRecommendedLevelText()).toBe("Lv.100~200");
    expect(dungeonBossQuestTrackerText(midboss)).toContain("적정 Lv.100~200");
    expect(recordDungeonBossDefeat(midboss, "eclipseArchivist")).toBe(midboss);
    expect(recordDungeonBossDefeat(midboss, "greenMushroom")).toBe(midboss);

    const upperBoss = recordDungeonBossDefeat(midboss, "emberWarden");
    expect(upperBoss.stage).toBe(DungeonBossQuestStage.UpperBoss);
    expect(recordDungeonBossDefeat(upperBoss, "emberWarden")).toBe(upperBoss);
    expect(recordDungeonBossDefeat(upperBoss, "onePunchMan")).toBe(upperBoss);

    const finalBoss = recordDungeonBossDefeat(upperBoss, "eclipseArchivist");
    expect(finalBoss.stage).toBe(DungeonBossQuestStage.FinalBoss);
    expect(recordDungeonBossDefeat(finalBoss, "eclipseArchivist")).toBe(finalBoss);

    const turnIn = recordDungeonBossDefeat(finalBoss, "onePunchMan");
    expect(turnIn.stage).toBe(DungeonBossQuestStage.TurnIn);
    expect(dungeonBossQuestTrackerText(turnIn)).toContain("세라에게 보고");
  });

  it("claims the completion reward once", () => {
    const turnIn = {
      ...defaultDungeonBossQuestProgress(),
      stage: DungeonBossQuestStage.TurnIn,
    };
    const claim = claimDungeonBossQuest(turnIn);
    expect(claim).toMatchObject({
      claimed: true,
      progress: { stage: DungeonBossQuestStage.Complete },
      reward: { mesos: 7_500, experienceBooks: 2 },
    });
    expect(claimDungeonBossQuest(claim.progress).claimed).toBe(false);
  });

  it("normalizes damaged progress to a fresh offer", () => {
    expect(normalizeDungeonBossQuestProgress({ id: "wrong", stage: "complete" })).toEqual(
      defaultDungeonBossQuestProgress(),
    );
    expect(
      normalizeDungeonBossQuestProgress({ id: "moonlitSeal", stage: "finalboss" }),
    ).toMatchObject({ stage: DungeonBossQuestStage.FinalBoss });
    expect(
      normalizeDungeonBossQuestProgress(
        { id: "moonlitSeal", stage: "finalboss" },
        true,
      ),
    ).toMatchObject({ stage: DungeonBossQuestStage.UpperBoss });
  });
});
