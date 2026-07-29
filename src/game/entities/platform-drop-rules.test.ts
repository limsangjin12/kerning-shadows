import { describe, expect, it } from "vitest";
import {
  PLATFORM_DROP_FOOT_TOLERANCE,
  canDropThroughPlatform,
  type PlatformDropProbe,
} from "./platform-drop-rules";

const standingProbe: PlatformDropProbe = {
  bodyLeft: 480,
  bodyRight: 520,
  bodyBottom: 438,
  platformLeft: 395,
  platformRight: 725,
  platformTop: 438,
  oneWay: true,
};

describe("platform drop rules", () => {
  it("allows a grounded player to drop through the overlapping one-way platform", () => {
    expect(canDropThroughPlatform(standingProbe)).toBe(true);
    expect(
      canDropThroughPlatform({
        ...standingProbe,
        bodyBottom: standingProbe.platformTop + PLATFORM_DROP_FOOT_TOLERANCE,
      }),
    ).toBe(true);
  });

  it("rejects solid ground, horizontal misses, and players away from the top", () => {
    expect(canDropThroughPlatform({ ...standingProbe, oneWay: false })).toBe(false);
    expect(
      canDropThroughPlatform({ ...standingProbe, bodyLeft: 730, bodyRight: 770 }),
    ).toBe(false);
    expect(
      canDropThroughPlatform({ ...standingProbe, bodyBottom: 460 }),
    ).toBe(false);
  });
});
