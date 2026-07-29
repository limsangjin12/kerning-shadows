import { describe, expect, it } from "vitest";
import { ThrowingStarTier } from "../equipment/throwing-star-rules";
import {
  PATIENCE_FOREST_REWARD_MESOS,
  claimPatienceForestReward,
} from "./patience-forest-reward";

describe("Patience Forest reward", () => {
  it("grants one million mesos and the Giant Icicle once", () => {
    const original = {
      mesos: 250,
      throwingStars: {
        owned: [ThrowingStarTier.Tier1],
        equipped: ThrowingStarTier.Tier1,
      },
    };
    const first = claimPatienceForestReward(original);
    expect(first).toMatchObject({
      claimed: true,
      state: {
        mesos: 250 + PATIENCE_FOREST_REWARD_MESOS,
        throwingStars: { owned: ["tier1", "tier6"], equipped: "tier1" },
      },
    });
    const second = claimPatienceForestReward(first.state);
    expect(second).toEqual({ claimed: false, state: first.state });
    expect(original.throwingStars.owned).toEqual(["tier1"]);
  });
});
