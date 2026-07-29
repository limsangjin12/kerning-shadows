import { describe, expect, it } from "vitest";
import { applyLootReward, nearestLootIndex, resolveMonsterLoot } from "./loot-rules";

describe("loot rules", () => {
  it("always includes the green mushroom cap and configured mesos", () => {
    const randomValues = [0.99, 0.5, 0.99];
    const rewards = resolveMonsterLoot("greenMushroom", () => randomValues.shift() ?? 0);

    expect(rewards).toEqual([
      { kind: "mesos", amount: 38, spriteAnimation: "mesoPouch" },
      {
        kind: "item",
        itemId: "mushroomCap",
        amount: 1,
        spriteAnimation: "mushroomCap",
      },
    ]);
  });

  it("selects only the nearest reward inside pickup range", () => {
    expect(
      nearestLootIndex({ x: 100, y: 100 }, [{ x: 180, y: 100 }, { x: 120, y: 100 }], 90),
    ).toBe(1);
    expect(nearestLootIndex({ x: 0, y: 0 }, [{ x: 101, y: 0 }], 100)).toBeUndefined();
  });

  it("uses richer dungeon rewards for medium and large monsters", () => {
    expect(resolveMonsterLoot("shadowSentinel", () => 0)).toEqual([
      { kind: "mesos", amount: 400, spriteAnimation: "mesoPouch" },
      {
        kind: "item",
        itemId: "recoveryBottle",
        amount: 1,
        spriteAnimation: "recoveryBottle",
      },
    ]);
    expect(resolveMonsterLoot("abyssGolem", () => 0)).toEqual([
      { kind: "mesos", amount: 5_000, spriteAnimation: "mesoPouch" },
      {
        kind: "item",
        itemId: "recoveryBottle",
        amount: 2,
        spriteAnimation: "recoveryBottle",
      },
    ]);
  });

  it("guarantees distinct materials and richer rewards for both bosses", () => {
    expect(resolveMonsterLoot("emberWarden", () => 0)).toEqual([
      { kind: "mesos", amount: 50_000, spriteAnimation: "mesoPouch" },
      {
        kind: "item",
        itemId: "recoveryBottle",
        amount: 3,
        spriteAnimation: "recoveryBottle",
      },
      {
        kind: "item",
        itemId: "emberCore",
        amount: 1,
        spriteAnimation: "recoveryBottle",
      },
    ]);
    expect(resolveMonsterLoot("eclipseArchivist", () => 0)).toEqual([
      { kind: "mesos", amount: 200_000, spriteAnimation: "mesoPouch" },
      {
        kind: "item",
        itemId: "recoveryBottle",
        amount: 5,
        spriteAnimation: "recoveryBottle",
      },
      {
        kind: "item",
        itemId: "moonlitCodex",
        amount: 1,
        spriteAnimation: "mushroomCap",
      },
    ]);
  });

  it("adds mesos and inventory items without mutating saved state", () => {
    const original = { mesos: 5, inventory: { mushroomCap: 2 } };
    const withMesos = applyLootReward(original, {
      kind: "mesos",
      amount: 18,
      spriteAnimation: "mesoPouch",
    });
    const withItem = applyLootReward(withMesos, {
      kind: "item",
      itemId: "mushroomCap",
      amount: 1,
      spriteAnimation: "mushroomCap",
    });

    expect(original).toEqual({ mesos: 5, inventory: { mushroomCap: 2 } });
    expect(withItem).toEqual({ mesos: 23, inventory: { mushroomCap: 3 } });
  });
});
