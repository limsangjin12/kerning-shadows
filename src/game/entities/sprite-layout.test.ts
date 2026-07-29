import { describe, expect, it } from "vitest";
import {
  centeredBodyOffsetX,
  centeredBodyOffsetY,
  groundedBodyOffsetY,
} from "./sprite-layout";

describe("shared sprite body alignment", () => {
  it("keeps a centered body fixed while the frame pivot changes", () => {
    for (const displayOrigin of [43.5, 64, 76]) {
      const bodyCenter =
        -displayOrigin + centeredBodyOffsetX(displayOrigin, 48) + 48 / 2;
      expect(bodyCenter).toBe(0);
    }
  });

  it("keeps centered effects on the visual anchor", () => {
    for (const displayOrigin of [52.5, 70, 82]) {
      const bodyCenter =
        -displayOrigin + centeredBodyOffsetY(displayOrigin, 34) + 34 / 2;
      expect(bodyCenter).toBe(0);
    }
  });

  it("keeps grounded loot and monsters on the visual anchor", () => {
    for (const displayOrigin of [97, 113, 128]) {
      const bodyBottom =
        -displayOrigin + groundedBodyOffsetY(displayOrigin, 38) + 38;
      expect(bodyBottom).toBe(0);
    }
  });
});
