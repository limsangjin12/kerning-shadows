import { describe, expect, it } from "vitest";
import { AudioAssetKey } from "../assets/audio-assets";
import { MONSTER_CATALOG } from "../data/catalog";
import { MAP_DEFINITIONS, MapId } from "../maps/map-definitions";
import { bgmForBossPresence } from "./bgm-rules";

describe("boss BGM rules", () => {
  it("switches to the boss theme only while a boss is alive", () => {
    expect(bgmForBossPresence(AudioAssetKey.GameTheme, true)).toBe(
      AudioAssetKey.BossTheme,
    );
    expect(bgmForBossPresence(AudioAssetKey.GameTheme, false)).toBe(
      AudioAssetKey.GameTheme,
    );
  });

  it("selects the boss theme for every map that spawns a living boss", () => {
    const bossMaps = Object.values(MAP_DEFINITIONS)
      .filter((definition) => definition.monsters.some(
        ({ kind }) => MONSTER_CATALOG[kind].bossRank !== "normal",
      ))
      .map((definition) => definition.id)
      .sort();

    expect(bossMaps).toEqual([
      MapId.EmberMine,
      MapId.InfiniteDuelGround,
      MapId.MoonlitArcaneLibrary,
    ].sort());
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      expect(bgmForBossPresence(definition.bgm, bossMaps.includes(definition.id))).toBe(
        bossMaps.includes(definition.id)
          ? AudioAssetKey.BossTheme
          : AudioAssetKey.GameTheme,
      );
    }
  });
});
