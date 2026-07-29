import { describe, expect, it } from "vitest";
import {
  DEFAULT_THROWING_STAR_LOADOUT,
  THROWING_STAR_CATALOG,
  THROWING_STAR_SHOP_TIERS,
  THROWING_STAR_TIERS,
  ThrowingStarTier,
  applyThrowingStarDamage,
  equipThrowingStar,
  isThrowingStarTier,
  normalizeThrowingStarLoadout,
  purchaseThrowingStar,
  throwingStarDamageMultiplier,
} from "./throwing-star-rules";

describe("throwing-star rules", () => {
  it("defines five shop grades and the reward-only Giant Icicle", () => {
    const definitions = THROWING_STAR_TIERS.map(
      (tier) => THROWING_STAR_CATALOG[tier],
    );

    expect(definitions).toHaveLength(6);
    expect(definitions.map(({ id }) => id)).toEqual([
      "tier1",
      "tier2",
      "tier3",
      "tier4",
      "tier5",
      "tier6",
    ]);
    expect(definitions.map(({ grade }) => grade)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(definitions.map(({ price }) => price)).toEqual([
      50, 250, 1_000, 4_000, 12_000, 0,
    ]);
    expect(definitions.map(({ damageMultiplier }) => damageMultiplier)).toEqual([
      1, 1.08, 1.18, 1.32, 1.5, 2,
    ]);
    expect(definitions.map(({ projectileFrame }) => projectileFrame)).toEqual([
      0, 3, 6, 9, 12, 6,
    ]);
    expect(THROWING_STAR_CATALOG[ThrowingStarTier.Tier6]).toMatchObject({
      name: "초대형 고드름",
      projectileScaleMultiplier: 1.75,
    });
    expect(THROWING_STAR_SHOP_TIERS).toEqual([
      "tier1",
      "tier2",
      "tier3",
      "tier4",
      "tier5",
    ]);
  });

  it("starts with tier 1 owned and equipped", () => {
    expect(DEFAULT_THROWING_STAR_LOADOUT).toEqual({
      owned: [ThrowingStarTier.Tier1],
      equipped: ThrowingStarTier.Tier1,
    });
  });

  it("buys an unowned throwing star without mutating the input state", () => {
    const state = {
      mesos: 1_500,
      owned: [ThrowingStarTier.Tier1],
      equipped: ThrowingStarTier.Tier1,
    };
    const result = purchaseThrowingStar(state, ThrowingStarTier.Tier3);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item).toBe(THROWING_STAR_CATALOG[ThrowingStarTier.Tier3]);
    expect(result.state).toEqual({
      mesos: 500,
      owned: [ThrowingStarTier.Tier1, ThrowingStarTier.Tier3],
      equipped: ThrowingStarTier.Tier1,
    });
    expect(result.state).not.toBe(state);
    expect(result.state.owned).not.toBe(state.owned);
    expect(state).toEqual({
      mesos: 1_500,
      owned: [ThrowingStarTier.Tier1],
      equipped: ThrowingStarTier.Tier1,
    });
  });

  it("rejects duplicate purchases before spending mesos", () => {
    const state = {
      mesos: 12_000,
      owned: [ThrowingStarTier.Tier1, ThrowingStarTier.Tier5],
      equipped: ThrowingStarTier.Tier1,
    };

    expect(purchaseThrowingStar(state, ThrowingStarTier.Tier5)).toEqual({
      success: false,
      state,
      reason: "already-owned",
    });
  });

  it("rejects purchases when mesos are insufficient or invalid", () => {
    const insufficient = {
      mesos: 999,
      owned: [ThrowingStarTier.Tier1],
      equipped: ThrowingStarTier.Tier1,
    };
    const invalid = { ...insufficient, mesos: Number.NaN };

    expect(purchaseThrowingStar(insufficient, ThrowingStarTier.Tier3)).toEqual({
      success: false,
      state: insufficient,
      reason: "insufficient-mesos",
    });
    expect(purchaseThrowingStar(invalid, ThrowingStarTier.Tier2)).toEqual({
      success: false,
      state: invalid,
      reason: "insufficient-mesos",
    });
  });

  it("equips an owned throwing star without mutating the input loadout", () => {
    const state = {
      owned: [ThrowingStarTier.Tier1, ThrowingStarTier.Tier4],
      equipped: ThrowingStarTier.Tier1,
    };
    const result = equipThrowingStar(state, ThrowingStarTier.Tier4);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.item).toBe(THROWING_STAR_CATALOG[ThrowingStarTier.Tier4]);
    expect(result.state).toEqual({
      owned: [ThrowingStarTier.Tier1, ThrowingStarTier.Tier4],
      equipped: ThrowingStarTier.Tier4,
    });
    expect(result.state).not.toBe(state);
    expect(result.state.owned).not.toBe(state.owned);
    expect(state.equipped).toBe(ThrowingStarTier.Tier1);
  });

  it("rejects equipping an unowned or already equipped throwing star", () => {
    const state = {
      owned: [ThrowingStarTier.Tier1],
      equipped: ThrowingStarTier.Tier1,
    };

    expect(equipThrowingStar(state, ThrowingStarTier.Tier2)).toEqual({
      success: false,
      state,
      reason: "item-not-owned",
    });
    expect(equipThrowingStar(state, ThrowingStarTier.Tier1)).toEqual({
      success: false,
      state,
      reason: "already-equipped",
    });
  });

  it("applies each equipped tier multiplier with deterministic flooring", () => {
    expect(throwingStarDamageMultiplier(ThrowingStarTier.Tier5)).toBe(1.5);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier1)).toBe(101);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier2)).toBe(109);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier3)).toBe(119);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier4)).toBe(133);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier5)).toBe(151);
    expect(applyThrowingStarDamage(101, ThrowingStarTier.Tier6)).toBe(202);
    expect(applyThrowingStarDamage(-5, ThrowingStarTier.Tier5)).toBe(0);
    expect(applyThrowingStarDamage(Number.NaN, ThrowingStarTier.Tier5)).toBe(0);
  });

  it("validates persisted throwing-star tier values", () => {
    expect(isThrowingStarTier("tier1")).toBe(true);
    expect(isThrowingStarTier("tier5")).toBe(true);
    expect(isThrowingStarTier("tier6")).toBe(true);
    expect(isThrowingStarTier(null)).toBe(false);
  });

  it("normalizes damaged loadouts and always restores the starter tier", () => {
    expect(
      normalizeThrowingStarLoadout({
        owned: ["tier3", "tier3", "broken"],
        equipped: "tier3",
      }),
    ).toEqual({ owned: ["tier1", "tier3"], equipped: "tier3" });
    expect(
      normalizeThrowingStarLoadout({ owned: ["tier2"], equipped: "tier5" }),
    ).toEqual({ owned: ["tier1", "tier2"], equipped: "tier1" });
    expect(normalizeThrowingStarLoadout(null)).toEqual(
      DEFAULT_THROWING_STAR_LOADOUT,
    );
  });
});
