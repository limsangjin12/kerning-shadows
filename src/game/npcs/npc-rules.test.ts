import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE } from "../data/catalog";
import { hasFullVitals, restoreVitals } from "./npc-rules";

describe("NPC recovery rules", () => {
  it("restores both HP and MP without changing the other character state", () => {
    const damaged = { ...DEFAULT_PLAYER_PROFILE, hp: 17, mp: 3, mesos: 91 };
    const restored = restoreVitals(damaged);

    expect(restored).toEqual({
      ...damaged,
      hp: damaged.maxHp,
      mp: damaged.maxMp,
    });
    expect(hasFullVitals(damaged)).toBe(false);
    expect(hasFullVitals(restored)).toBe(true);
  });
});
