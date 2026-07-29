import { describe, expect, it } from "vitest";
import { AttackKind } from "../combat/combat-rules";
import {
  SkillProjectileMotion,
  projectilePulseScale,
  projectileVerticalVelocity,
  skillProjectilePresentation,
} from "./skill-projectile-rules";

describe("skill projectile presentation", () => {
  it("gives slots 1 through 4 four distinct silhouettes", () => {
    const kinds = [
      AttackKind.LuckySeven,
      AttackKind.ShadowVolley,
      AttackKind.Drain,
      AttackKind.PhantomStars,
    ];
    expect(
      kinds.map((kind) => skillProjectilePresentation(kind, 0).motion),
    ).toEqual([
      SkillProjectileMotion.TwinStraight,
      SkillProjectileMotion.FanVolley,
      SkillProjectileMotion.SiphonPulse,
      SkillProjectileMotion.PhantomWave,
    ]);
  });

  it("fans shadow volleys and crosses phantom stars on opposite wave phases", () => {
    expect(
      [0, 1, 2].map(
        (index) => skillProjectilePresentation(AttackKind.ShadowVolley, index).initialVelocityY,
      ),
    ).toEqual([-95, 0, 95]);
    const first = skillProjectilePresentation(AttackKind.PhantomStars, 0);
    const second = skillProjectilePresentation(AttackKind.PhantomStars, 1);
    expect(projectileVerticalVelocity(first, 0)).toBeGreaterThan(0);
    expect(projectileVerticalVelocity(second, 0)).toBeLessThan(0);
  });

  it("pulses the drain projectile without changing straight projectiles", () => {
    const drain = skillProjectilePresentation(AttackKind.Drain, 0);
    const lucky = skillProjectilePresentation(AttackKind.LuckySeven, 0);
    expect(projectilePulseScale(drain, 90)).toBeGreaterThan(1);
    expect(projectilePulseScale(lucky, 90)).toBe(1);
  });
});
