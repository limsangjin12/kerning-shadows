import {
  ITEM_CATALOG,
  MONSTER_CATALOG,
  type MonsterKind,
} from "../data/catalog";

export type ItemId = keyof typeof ITEM_CATALOG;
export type { MonsterKind } from "../data/catalog";

export type LootReward =
  | {
      kind: "mesos";
      amount: number;
      spriteAnimation: "mesoPouch";
    }
  | {
      kind: "item";
      itemId: ItemId;
      amount: number;
      spriteAnimation: "recoveryBottle" | "mushroomCap";
    };

export interface PointLike {
  x: number;
  y: number;
}

export interface LootCollectionState {
  mesos: number;
  inventory: Record<string, number>;
}

type RandomSource = () => number;

export function resolveMonsterLoot(
  monsterKind: MonsterKind,
  random: RandomSource = Math.random,
): LootReward[] {
  const table = MONSTER_CATALOG[monsterKind].drops;
  const rewards: LootReward[] = [];

  for (const entry of table) {
    if (random() >= entry.chance) {
      continue;
    }
    if (entry.kind === "mesos") {
      const amountRange = entry.maxAmount - entry.minAmount + 1;
      const amount = entry.minAmount + Math.floor(random() * amountRange);
      rewards.push({
        kind: "mesos",
        amount,
        spriteAnimation: entry.spriteAnimation,
      });
    } else {
      rewards.push({
        kind: "item",
        itemId: entry.itemId,
        amount: entry.amount,
        spriteAnimation: entry.spriteAnimation,
      });
    }
  }

  return rewards;
}

export function nearestLootIndex(
  origin: PointLike,
  candidates: readonly PointLike[],
  maxDistance: number,
): number | undefined {
  const maximumSquared = maxDistance * maxDistance;
  let nearestIndex: number | undefined;
  let nearestSquared = Number.POSITIVE_INFINITY;

  candidates.forEach((candidate, index) => {
    const distanceSquared =
      (candidate.x - origin.x) ** 2 + (candidate.y - origin.y) ** 2;
    if (distanceSquared <= maximumSquared && distanceSquared < nearestSquared) {
      nearestIndex = index;
      nearestSquared = distanceSquared;
    }
  });

  return nearestIndex;
}

export function applyLootReward(
  state: LootCollectionState,
  reward: LootReward,
): LootCollectionState {
  if (reward.kind === "mesos") {
    return {
      mesos: state.mesos + reward.amount,
      inventory: { ...state.inventory },
    };
  }

  return {
    mesos: state.mesos,
    inventory: {
      ...state.inventory,
      [reward.itemId]: (state.inventory[reward.itemId] ?? 0) + reward.amount,
    },
  };
}
