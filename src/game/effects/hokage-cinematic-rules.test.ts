import { describe, expect, it } from "vitest";
import {
  HOKAGE_CINEMATICS,
  HokageCinematicKind,
  TEAM_ASSAULT_HIT_TIMELINE_MS,
  teamAssaultAttacker,
} from "./hokage-cinematic-rules";

describe("Hokage cinematic rules", () => {
  it("maps four atlas frames and reuses the chakra frame for a short Thunder Orb cut-in", () => {
    expect(Object.values(HOKAGE_CINEMATICS).map(({ frame }) => frame)).toEqual([
      0, 1, 2, 3, 0,
    ]);
    expect(HOKAGE_CINEMATICS[HokageCinematicKind.TeamAssault].durationMs).toBe(
      1_750,
    );
    expect(HOKAGE_CINEMATICS[HokageCinematicKind.ThunderOrb]).toMatchObject({
      durationMs: 640,
      title: "천뢰옥",
    });
  });

  it("assigns exactly five team hits to Shion and Hana", () => {
    expect(TEAM_ASSAULT_HIT_TIMELINE_MS).toEqual([
      520, 690, 860, 1_030, 1_200,
    ]);
    expect(TEAM_ASSAULT_HIT_TIMELINE_MS.map((_, index) => teamAssaultAttacker(index))).toEqual([
      "shion",
      "shion",
      "hanaKick",
      "hanaPunch",
      "hanaPunch",
    ]);
  });
});
