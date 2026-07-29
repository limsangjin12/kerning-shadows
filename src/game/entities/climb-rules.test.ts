import { describe, expect, it } from "vitest";
import {
  CLIMB_SPEED,
  canAttachToClimbable,
  clampClimbY,
  climbVelocity,
  shouldDetachFromClimbable,
} from "./climb-rules";

const rope = { id: "rope-1", x: 200, top: 100, bottom: 400, width: 12 };

describe("climb rules", () => {
  it("attaches only while pressing vertically inside the climbable bounds", () => {
    expect(canAttachToClimbable(220, 250, rope, true, false)).toBe(true);
    expect(canAttachToClimbable(200, 250, rope, false, false)).toBe(false);
    expect(canAttachToClimbable(260, 250, rope, true, false)).toBe(false);
    expect(canAttachToClimbable(200, 450, rope, false, true)).toBe(false);
  });

  it("moves vertically and clamps to the rope ends", () => {
    expect(climbVelocity(true, false)).toBe(-CLIMB_SPEED);
    expect(climbVelocity(false, true)).toBe(CLIMB_SPEED);
    expect(climbVelocity(true, true)).toBe(0);
    expect(clampClimbY(40, rope)).toBe(100);
    expect(clampClimbY(460, rope)).toBe(400);
  });

  it("detaches on horizontal movement or jump", () => {
    expect(shouldDetachFromClimbable(true, false, false)).toBe(true);
    expect(shouldDetachFromClimbable(false, true, false)).toBe(true);
    expect(shouldDetachFromClimbable(false, false, true)).toBe(true);
    expect(shouldDetachFromClimbable(false, false, false)).toBe(false);
  });
});
