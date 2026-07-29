import { describe, expect, it } from "vitest";
import { AttackKind } from "../combat/combat-rules";
import {
  attackAdvancementTier,
  skillSpectacleDefinition,
} from "./skill-spectacle-rules";

describe("skill spectacle rules", () => {
  it("increases cast and impact density monotonically by advancement tier", () => {
    const representatives = [
      AttackKind.LuckySeven,
      AttackKind.Drain,
      AttackKind.Avenger,
      AttackKind.ThunderOrb,
    ];
    const definitions = representatives.map(skillSpectacleDefinition);
    expect(definitions.map(({ advancementTier }) => advancementTier)).toEqual([
      1, 2, 3, 4,
    ]);
    expect(definitions.map(({ castRingCount }) => castRingCount)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(definitions.map(({ impactRingCount }) => impactRingCount)).toEqual([
      0, 1, 2, 3,
    ]);
    expect(definitions.map(({ impactRayCount }) => impactRayCount)).toEqual([
      0, 0, 4, 8,
    ]);
  });

  it("keeps basic attacks plain and every Hokage attack at tier four", () => {
    expect(attackAdvancementTier(AttackKind.Basic)).toBe(0);
    for (const kind of [
      AttackKind.Rasengan,
      AttackKind.NineTailsClaw,
      AttackKind.TailedBeastBomb,
      AttackKind.TeamAssault,
      AttackKind.ThunderOrb,
    ]) {
      expect(attackAdvancementTier(kind)).toBe(4);
    }
  });
});
