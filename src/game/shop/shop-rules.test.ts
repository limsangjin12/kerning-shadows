import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE } from "../data/catalog";
import {
  EXPERIENCE_BOOK_LEVEL_GAIN,
  MAX_CHARACTER_LEVEL,
  SHOP_ITEM_CATALOG,
  ShopItemId,
  purchaseShopItem,
  useExperienceBook,
} from "./shop-rules";

describe("shop rules", () => {
  it("defines the experience book as a one-meso consumable", () => {
    expect(SHOP_ITEM_CATALOG[ShopItemId.ExperienceBook]).toMatchObject({
      id: "experienceBook",
      name: "경험의 서",
      price: 1,
      inventoryItemId: "experienceBook",
      kind: "consumable",
    });
  });

  it("defines the Puppuccino as a fifty-thousand-meso pet gift", () => {
    expect(SHOP_ITEM_CATALOG[ShopItemId.Puppuccino]).toEqual({
      id: "puppuccino",
      name: "멍푸치노",
      price: 50_000,
      inventoryItemId: "puppuccino",
      kind: "pet-gift",
    });
  });

  it("defines the Revival Charm as a one-million-meso single-owned item", () => {
    expect(SHOP_ITEM_CATALOG[ShopItemId.RevivalCharm]).toEqual({
      id: "revivalCharm",
      name: "부활의 부적",
      price: 1_000_000,
      inventoryItemId: "revivalCharm",
      kind: "automatic-consumable",
      maximumOwned: 1,
    });
  });

  it("buys only one Revival Charm and preserves mesos when already owned", () => {
    const state = { mesos: 1_500_000, inventory: { mushroomCap: 2 } };
    const purchase = purchaseShopItem(state, ShopItemId.RevivalCharm);

    expect(purchase).toMatchObject({
      success: true,
      state: {
        mesos: 500_000,
        inventory: { mushroomCap: 2, revivalCharm: 1 },
      },
    });
    if (!purchase.success) return;

    const duplicate = purchaseShopItem(
      purchase.state,
      ShopItemId.RevivalCharm,
    );
    expect(duplicate).toEqual({
      success: false,
      state: purchase.state,
      reason: "maximum-owned",
    });
    expect(duplicate.state).toBe(purchase.state);
  });

  it("spends fifty thousand mesos and adds one Puppuccino immutably", () => {
    const state = {
      mesos: 80_000,
      inventory: { mushroomCap: 2, puppuccino: 1 },
    };
    const result = purchaseShopItem(state, ShopItemId.Puppuccino);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.state).toEqual({
      mesos: 30_000,
      inventory: { mushroomCap: 2, puppuccino: 2 },
    });
    expect(result.item).toBe(SHOP_ITEM_CATALOG[ShopItemId.Puppuccino]);
    expect(result.state).not.toBe(state);
    expect(result.state.inventory).not.toBe(state.inventory);
    expect(state).toEqual({
      mesos: 80_000,
      inventory: { mushroomCap: 2, puppuccino: 1 },
    });
  });

  it("rejects a Puppuccino purchase with 49,999 mesos", () => {
    const state = { mesos: 49_999, inventory: { mushroomCap: 1 } };
    const result = purchaseShopItem(state, ShopItemId.Puppuccino);

    expect(result).toEqual({
      success: false,
      state,
      reason: "insufficient-mesos",
    });
    expect(result.state).toBe(state);
    expect(result.state.inventory).toBe(state.inventory);
  });

  it("spends one meso and adds one book without mutating shop state", () => {
    const state = {
      mesos: 3,
      inventory: { mushroomCap: 2, experienceBook: 1 },
    };
    const result = purchaseShopItem(state, ShopItemId.ExperienceBook);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.state).toEqual({
      mesos: 2,
      inventory: { mushroomCap: 2, experienceBook: 2 },
    });
    expect(result.state).not.toBe(state);
    expect(result.state.inventory).not.toBe(state.inventory);
    expect(state).toEqual({
      mesos: 3,
      inventory: { mushroomCap: 2, experienceBook: 1 },
    });
  });

  it("returns the original state when mesos are insufficient", () => {
    const state = { mesos: 0, inventory: { mushroomCap: 1 } };
    const result = purchaseShopItem(state, ShopItemId.ExperienceBook);

    expect(result).toEqual({
      success: false,
      state,
      reason: "insufficient-mesos",
    });
    expect(result.state).toBe(state);
    expect(result.state.inventory).toBe(state.inventory);
  });

  it("consumes one book, preserves current EXP, and gains exactly ten levels", () => {
    const state = {
      character: {
        ...DEFAULT_PLAYER_PROFILE,
        level: 10,
        hp: 1,
        mp: 1,
        stats: { ...DEFAULT_PLAYER_PROFILE.stats },
        skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
      },
      exp: 37,
      inventory: { mushroomCap: 2, experienceBook: 2 },
    };
    const result = useExperienceBook(state);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.state.character.level).toBe(
      state.character.level + EXPERIENCE_BOOK_LEVEL_GAIN,
    );
    expect(result.progression.levelsGained).toBe(EXPERIENCE_BOOK_LEVEL_GAIN);
    expect(result.state.exp).toBe(state.exp);
    expect(result.state.character.statPoints).toBe(50);
    expect(result.state.character.skillPoints).toBe(30);
    expect(result.state.inventory).toEqual({
      mushroomCap: 2,
      experienceBook: 1,
    });
    expect(result.state.character.hp).toBe(result.state.character.maxHp);
    expect(result.state.character.mp).toBe(result.state.character.maxMp);
    expect(state.character.level).toBe(10);
    expect(state.character.hp).toBe(1);
    expect(state.inventory.experienceBook).toBe(2);
    expect(result.state).not.toBe(state);
    expect(result.state.inventory).not.toBe(state.inventory);
  });

  it("stops at level 200 while preserving EXP and consuming one book", () => {
    const state = {
      character: {
        ...DEFAULT_PLAYER_PROFILE,
        level: 195,
        stats: { ...DEFAULT_PLAYER_PROFILE.stats },
        skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
      },
      exp: 71,
      inventory: { experienceBook: 1 },
    };
    const result = useExperienceBook(state);

    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.state.character.level).toBe(MAX_CHARACTER_LEVEL);
    expect(result.progression.levelsGained).toBe(5);
    expect(result.state.exp).toBe(71);
    expect(result.state.inventory.experienceBook).toBe(0);
  });

  it("does not consume a book at max level and reports the reason", () => {
    const state = {
      character: {
        ...DEFAULT_PLAYER_PROFILE,
        level: MAX_CHARACTER_LEVEL,
      },
      exp: 19,
      inventory: { experienceBook: 2 },
    };
    const result = useExperienceBook(state);

    expect(result).toEqual({ success: false, state, reason: "max-level" });
    expect(result.state).toBe(state);
    expect(state.inventory.experienceBook).toBe(2);
  });

  it("returns the original state when no experience book is owned", () => {
    const state = {
      character: { ...DEFAULT_PLAYER_PROFILE },
      exp: 19,
      inventory: { mushroomCap: 2 },
    };
    const result = useExperienceBook(state);

    expect(result).toEqual({
      success: false,
      state,
      reason: "item-not-owned",
    });
    expect(result.state).toBe(state);
    expect(result.state.inventory).toBe(state.inventory);
  });
});
