import { describe, expect, it } from "vitest";
import {
  DamagePalette,
  damageNumberFrame,
  damageNumberPresentation,
  damagePaletteLabel,
  damagePaletteForMonsterHit,
} from "./damage-number";

describe("damage number atlas", () => {
  it("maps digits 0-9 across all four palette rows", () => {
    expect(damageNumberFrame(0, DamagePalette.Normal)).toBe(0);
    expect(damageNumberFrame(9, DamagePalette.Normal)).toBe(9);
    expect(damageNumberFrame(0, DamagePalette.Strong)).toBe(10);
    expect(damageNumberFrame(9, DamagePalette.Player)).toBe(29);
    expect(damageNumberFrame(0, DamagePalette.Critical)).toBe(30);
    expect(damageNumberFrame(9, DamagePalette.Critical)).toBe(39);
    expect(damagePaletteLabel(DamagePalette.Critical)).toBe("critical");
  });

  it("gives every critical hit its dedicated emphasized palette", () => {
    expect(damagePaletteForMonsterHit(false, false)).toBe(DamagePalette.Normal);
    expect(damagePaletteForMonsterHit(false, true)).toBe(DamagePalette.Strong);
    expect(damagePaletteForMonsterHit(true, false)).toBe(DamagePalette.Critical);
    expect(damagePaletteForMonsterHit(true, true)).toBe(DamagePalette.Critical);
  });

  it("renders critical numbers larger, higher, and longer", () => {
    const normal = damageNumberPresentation(DamagePalette.Normal);
    const critical = damageNumberPresentation(DamagePalette.Critical);
    expect(critical.initialScale).toBeGreaterThan(normal.initialScale);
    expect(critical.rise).toBeGreaterThan(normal.rise);
    expect(critical.durationMs).toBeGreaterThan(normal.durationMs);
  });

  it("rejects invalid damage digits", () => {
    expect(() => damageNumberFrame(10, DamagePalette.Normal)).toThrow("0 to 9");
  });
});
