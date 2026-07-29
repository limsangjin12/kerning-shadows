import { ITEM_CATALOG, type PlayerProfile } from "../data/catalog";

export type InventoryItemId = keyof typeof ITEM_CATALOG;
export type UsableInventoryItemId = "recoveryBottle" | "experienceBook";

export function isUsableInventoryItemId(
  itemId: string,
): itemId is UsableInventoryItemId {
  return itemId === "recoveryBottle" || itemId === "experienceBook";
}

export const RECOVERY_BOTTLE_ITEM_ID = "recoveryBottle";
export const RECOVERY_BOTTLE_RESTORE_RATIO = 0.5;

export interface RecoveryBottleState {
  character: PlayerProfile;
  inventory: Record<string, number>;
}

export type RecoveryBottleFailureReason = "item-not-owned" | "already-full";

export type RecoveryBottleUseResult =
  | {
      success: true;
      state: RecoveryBottleState;
      hpRecovered: number;
      mpRecovered: number;
    }
  | {
      success: false;
      state: RecoveryBottleState;
      reason: RecoveryBottleFailureReason;
    };

export function useRecoveryBottle(
  state: RecoveryBottleState,
): RecoveryBottleUseResult {
  const owned = nonNegativeItemCount(
    state.inventory[RECOVERY_BOTTLE_ITEM_ID],
  );
  if (owned === 0) {
    return { success: false, state, reason: "item-not-owned" };
  }

  const hp = restoredResource(
    state.character.hp,
    state.character.maxHp,
    RECOVERY_BOTTLE_RESTORE_RATIO,
  );
  const mp = restoredResource(
    state.character.mp,
    state.character.maxMp,
    RECOVERY_BOTTLE_RESTORE_RATIO,
  );
  if (hp.recovered === 0 && mp.recovered === 0) {
    return { success: false, state, reason: "already-full" };
  }

  return {
    success: true,
    hpRecovered: hp.recovered,
    mpRecovered: mp.recovered,
    state: {
      character: {
        ...state.character,
        hp: hp.value,
        mp: mp.value,
      },
      inventory: {
        ...state.inventory,
        [RECOVERY_BOTTLE_ITEM_ID]: owned - 1,
      },
    },
  };
}

function restoredResource(
  current: number,
  maximum: number,
  ratio: number,
): { value: number; recovered: number } {
  const safeMaximum = Number.isFinite(maximum)
    ? Math.max(1, Math.floor(maximum))
    : 1;
  const safeCurrent = Number.isFinite(current)
    ? Math.min(safeMaximum, Math.max(0, Math.floor(current)))
    : 0;
  const value = Math.min(
    safeMaximum,
    safeCurrent + Math.max(1, Math.ceil(safeMaximum * ratio)),
  );
  return { value, recovered: value - safeCurrent };
}

function nonNegativeItemCount(value: number | undefined): number {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value ?? 0)) : 0;
}
