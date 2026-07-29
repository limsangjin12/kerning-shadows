import type { PlayerProfile } from "../data/catalog";

export const REVIVAL_CHARM_ITEM_ID = "revivalCharm";
export const REVIVAL_CHARM_PRICE = 1_000_000;
export const REVIVAL_CHARM_MAX_OWNED = 1;

export interface RevivalCharmState {
  character: PlayerProfile;
  inventory: Record<string, number>;
}

export type RevivalCharmFailureReason = "item-not-owned" | "not-defeated";

export type RevivalCharmUseResult =
  | {
      success: true;
      state: RevivalCharmState;
      hpRestored: number;
      mpRestored: number;
    }
  | {
      success: false;
      state: RevivalCharmState;
      reason: RevivalCharmFailureReason;
    };

export function inventoryItemMaximum(itemId: string): number | undefined {
  return itemId === REVIVAL_CHARM_ITEM_ID
    ? REVIVAL_CHARM_MAX_OWNED
    : undefined;
}

export function consumeRevivalCharm(
  state: RevivalCharmState,
): RevivalCharmUseResult {
  if (state.character.hp > 0) {
    return { success: false, state, reason: "not-defeated" };
  }

  const owned = nonNegativeItemCount(state.inventory[REVIVAL_CHARM_ITEM_ID]);
  if (owned === 0) {
    return { success: false, state, reason: "item-not-owned" };
  }

  return {
    success: true,
    hpRestored: state.character.maxHp,
    mpRestored: state.character.maxMp - state.character.mp,
    state: {
      character: {
        ...state.character,
        hp: state.character.maxHp,
        mp: state.character.maxMp,
      },
      inventory: {
        ...state.inventory,
        [REVIVAL_CHARM_ITEM_ID]: owned - 1,
      },
    },
  };
}

function nonNegativeItemCount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value ?? 0)) : 0;
}
