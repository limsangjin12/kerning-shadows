import { describe, expect, it } from "vitest";
import { AttackKind } from "../combat/combat-rules";
import {
  ATTACK_AFTERIMAGE_DEFINITIONS,
  attackAfterimageDelayMs,
  attackAfterimageX,
} from "./attack-afterimage-rules";

describe("attack motion afterimages", () => {
  it("defines a bounded afterimage trail for every active attack", () => {
    expect(Object.keys(ATTACK_AFTERIMAGE_DEFINITIONS).sort()).toEqual(
      Object.values(AttackKind).sort(),
    );
    for (const definition of Object.values(ATTACK_AFTERIMAGE_DEFINITIONS)) {
      expect(definition.count).toBeGreaterThanOrEqual(2);
      expect(definition.count).toBeLessThanOrEqual(5);
      expect(definition.lifetimeMs).toBeGreaterThanOrEqual(120);
      expect(definition.lifetimeMs).toBeLessThanOrEqual(220);
      expect(definition.alpha).toBeGreaterThan(0);
      expect(definition.alpha).toBeLessThan(0.5);
    }
  });

  it("delays each sample and trails behind the facing direction", () => {
    const definition = ATTACK_AFTERIMAGE_DEFINITIONS[AttackKind.Avenger];
    expect(attackAfterimageDelayMs(definition, 0)).toBe(30);
    expect(attackAfterimageDelayMs(definition, 3)).toBe(120);
    expect(attackAfterimageX(500, 1, definition, 2)).toBe(470);
    expect(attackAfterimageX(500, -1, definition, 2)).toBe(530);
  });
});
