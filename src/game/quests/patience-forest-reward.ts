import {
  ThrowingStarTier,
  type ThrowingStarLoadout,
} from "../equipment/throwing-star-rules";

export const PATIENCE_FOREST_REWARD_MESOS = 1_000_000;

export interface PatienceForestRewardState {
  mesos: number;
  throwingStars: ThrowingStarLoadout;
}

export type PatienceForestRewardResult =
  | { claimed: false; state: PatienceForestRewardState }
  | { claimed: true; state: PatienceForestRewardState };

export function claimPatienceForestReward(
  state: PatienceForestRewardState,
): PatienceForestRewardResult {
  if (state.throwingStars.owned.includes(ThrowingStarTier.Tier6)) {
    return { claimed: false, state };
  }
  const mesos = Number.isSafeInteger(state.mesos) && state.mesos >= 0
    ? state.mesos
    : 0;
  return {
    claimed: true,
    state: {
      mesos: mesos + PATIENCE_FOREST_REWARD_MESOS,
      throwingStars: {
        owned: [...state.throwingStars.owned, ThrowingStarTier.Tier6],
        equipped: state.throwingStars.equipped,
      },
    },
  };
}
