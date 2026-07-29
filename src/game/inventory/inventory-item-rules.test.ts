import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE } from "../data/catalog";
import {
  RECOVERY_BOTTLE_RESTORE_RATIO,
  useRecoveryBottle,
} from "./inventory-item-rules";

function character(
  overrides: Partial<typeof DEFAULT_PLAYER_PROFILE> = {},
): typeof DEFAULT_PLAYER_PROFILE {
  return {
    ...DEFAULT_PLAYER_PROFILE,
    ...overrides,
    stats: { ...DEFAULT_PLAYER_PROFILE.stats },
    skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
  };
}

describe("inventory item rules", () => {
  it("consumes one recovery bottle and restores half of max HP and MP", () => {
    const state = {
      character: character({ hp: 100, maxHp: 400, mp: 50, maxMp: 300 }),
      inventory: { recoveryBottle: 2, mushroomCap: 3 },
    };

    const result = useRecoveryBottle(state);

    expect(RECOVERY_BOTTLE_RESTORE_RATIO).toBe(0.5);
    expect(result).toMatchObject({
      success: true,
      hpRecovered: 200,
      mpRecovered: 150,
      state: {
        character: { hp: 300, mp: 200 },
        inventory: { recoveryBottle: 1, mushroomCap: 3 },
      },
    });
    expect(state.character).toMatchObject({ hp: 100, mp: 50 });
    expect(state.inventory).toEqual({ recoveryBottle: 2, mushroomCap: 3 });
  });

  it("caps recovery at each maximum while restoring the other resource", () => {
    const result = useRecoveryBottle({
      character: character({ hp: 390, maxHp: 400, mp: 300, maxMp: 300 }),
      inventory: { recoveryBottle: 1 },
    });

    expect(result).toMatchObject({
      success: true,
      hpRecovered: 10,
      mpRecovered: 0,
      state: {
        character: { hp: 400, mp: 300 },
        inventory: { recoveryBottle: 0 },
      },
    });
  });

  it("does not consume a bottle when HP and MP are already full", () => {
    const state = {
      character: character({ hp: 400, maxHp: 400, mp: 300, maxMp: 300 }),
      inventory: { recoveryBottle: 1 },
    };

    const result = useRecoveryBottle(state);

    expect(result).toEqual({
      success: false,
      state,
      reason: "already-full",
    });
  });

  it("does not change state when no recovery bottle is owned", () => {
    const state = {
      character: character({ hp: 1, maxHp: 400, mp: 1, maxMp: 300 }),
      inventory: { recoveryBottle: 0 },
    };

    const result = useRecoveryBottle(state);

    expect(result).toEqual({
      success: false,
      state,
      reason: "item-not-owned",
    });
  });
});
