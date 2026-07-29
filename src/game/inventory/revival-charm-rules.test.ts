import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE } from "../data/catalog";
import {
  REVIVAL_CHARM_ITEM_ID,
  REVIVAL_CHARM_MAX_OWNED,
  REVIVAL_CHARM_PRICE,
  consumeRevivalCharm,
  inventoryItemMaximum,
} from "./revival-charm-rules";

describe("revival charm rules", () => {
  it("defines a one-million-meso item with a maximum ownership of one", () => {
    expect(REVIVAL_CHARM_ITEM_ID).toBe("revivalCharm");
    expect(REVIVAL_CHARM_PRICE).toBe(1_000_000);
    expect(REVIVAL_CHARM_MAX_OWNED).toBe(1);
    expect(inventoryItemMaximum(REVIVAL_CHARM_ITEM_ID)).toBe(1);
    expect(inventoryItemMaximum("recoveryBottle")).toBeUndefined();
  });

  it("consumes the charm and immediately restores full HP and MP on defeat", () => {
    const state = {
      character: {
        ...DEFAULT_PLAYER_PROFILE,
        hp: 0,
        maxHp: 800,
        mp: 70,
        maxMp: 500,
        stats: { ...DEFAULT_PLAYER_PROFILE.stats },
        skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
      },
      inventory: { revivalCharm: 1, mushroomCap: 3 },
    };

    const result = consumeRevivalCharm(state);

    expect(result).toMatchObject({
      success: true,
      hpRestored: 800,
      mpRestored: 430,
      state: {
        character: { hp: 800, mp: 500 },
        inventory: { revivalCharm: 0, mushroomCap: 3 },
      },
    });
    expect(state.character).toMatchObject({ hp: 0, mp: 70 });
    expect(state.inventory).toEqual({ revivalCharm: 1, mushroomCap: 3 });
  });

  it("does not revive without a charm or consume one while alive", () => {
    const defeated = {
      character: { ...DEFAULT_PLAYER_PROFILE, hp: 0 },
      inventory: { revivalCharm: 0 },
    };
    expect(consumeRevivalCharm(defeated)).toEqual({
      success: false,
      state: defeated,
      reason: "item-not-owned",
    });

    const alive = {
      character: { ...DEFAULT_PLAYER_PROFILE, hp: 1 },
      inventory: { revivalCharm: 1 },
    };
    expect(consumeRevivalCharm(alive)).toEqual({
      success: false,
      state: alive,
      reason: "not-defeated",
    });
  });
});
