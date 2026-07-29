import type { PlayerProfile } from "../data/catalog";
import {
  awardExperience,
  expRequiredForLevel,
  MAX_CHARACTER_LEVEL,
  type ExperienceResult,
} from "../progression/progression-rules";
import {
  REVIVAL_CHARM_ITEM_ID,
  REVIVAL_CHARM_MAX_OWNED,
  REVIVAL_CHARM_PRICE,
} from "../inventory/revival-charm-rules";

export { MAX_CHARACTER_LEVEL };

export const ShopItemId = {
  ExperienceBook: "experienceBook",
  Puppuccino: "puppuccino",
  RevivalCharm: REVIVAL_CHARM_ITEM_ID,
} as const;

export type ShopItemId = (typeof ShopItemId)[keyof typeof ShopItemId];

export interface ShopItemDefinition {
  id: ShopItemId;
  name: string;
  price: number;
  inventoryItemId: string;
  kind: "consumable" | "pet-gift" | "automatic-consumable";
  maximumOwned?: number;
}

export const SHOP_ITEM_CATALOG = {
  [ShopItemId.ExperienceBook]: {
    id: ShopItemId.ExperienceBook,
    name: "경험의 서",
    price: 1,
    inventoryItemId: ShopItemId.ExperienceBook,
    kind: "consumable",
  },
  [ShopItemId.Puppuccino]: {
    id: ShopItemId.Puppuccino,
    name: "멍푸치노",
    price: 50_000,
    inventoryItemId: ShopItemId.Puppuccino,
    kind: "pet-gift",
  },
  [ShopItemId.RevivalCharm]: {
    id: ShopItemId.RevivalCharm,
    name: "부활의 부적",
    price: REVIVAL_CHARM_PRICE,
    inventoryItemId: REVIVAL_CHARM_ITEM_ID,
    kind: "automatic-consumable",
    maximumOwned: REVIVAL_CHARM_MAX_OWNED,
  },
} as const satisfies Record<ShopItemId, ShopItemDefinition>;

export const EXPERIENCE_BOOK_LEVEL_GAIN = 10;

export interface ShopInventoryState {
  mesos: number;
  inventory: Record<string, number>;
}

export type PurchaseFailureReason = "insufficient-mesos" | "maximum-owned";

export type PurchaseResult =
  | {
      success: true;
      state: ShopInventoryState;
      item: ShopItemDefinition;
    }
  | {
      success: false;
      state: ShopInventoryState;
      reason: PurchaseFailureReason;
    };

export interface ExperienceBookState {
  character: PlayerProfile;
  exp: number;
  inventory: Record<string, number>;
}

export type ExperienceBookFailureReason = "item-not-owned" | "max-level";

export type ExperienceBookUseResult =
  | {
      success: true;
      state: ExperienceBookState;
      progression: ExperienceResult;
    }
  | {
      success: false;
      state: ExperienceBookState;
      reason: ExperienceBookFailureReason;
    };

export function purchaseShopItem(
  state: ShopInventoryState,
  itemId: ShopItemId,
): PurchaseResult {
  const item: ShopItemDefinition = SHOP_ITEM_CATALOG[itemId];
  const owned = nonNegativeItemCount(state.inventory[item.inventoryItemId]);
  if (item.maximumOwned !== undefined && owned >= item.maximumOwned) {
    return { success: false, state, reason: "maximum-owned" };
  }
  if (!Number.isFinite(state.mesos) || state.mesos < item.price) {
    return { success: false, state, reason: "insufficient-mesos" };
  }

  return {
    success: true,
    item,
    state: {
      mesos: state.mesos - item.price,
      inventory: {
        ...state.inventory,
        [item.inventoryItemId]: owned + 1,
      },
    },
  };
}

export function useExperienceBook(
  state: ExperienceBookState,
): ExperienceBookUseResult {
  if (state.character.level >= MAX_CHARACTER_LEVEL) {
    return { success: false, state, reason: "max-level" };
  }

  const itemId = ShopItemId.ExperienceBook;
  const owned = nonNegativeItemCount(state.inventory[itemId]);
  if (owned === 0) {
    return { success: false, state, reason: "item-not-owned" };
  }

  const targetLevel = Math.min(
    MAX_CHARACTER_LEVEL,
    state.character.level + EXPERIENCE_BOOK_LEVEL_GAIN,
  );
  let experienceAward = 0;
  for (let level = state.character.level; level < targetLevel; level += 1) {
    experienceAward += expRequiredForLevel(level);
  }

  const progression = awardExperience(
    state.character,
    state.exp,
    experienceAward,
  );

  return {
    success: true,
    progression,
    state: {
      character: progression.character,
      exp: progression.exp,
      inventory: {
        ...state.inventory,
        [itemId]: owned - 1,
      },
    },
  };
}

function nonNegativeItemCount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value ?? 0)) : 0;
}
