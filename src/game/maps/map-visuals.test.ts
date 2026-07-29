import kerningForegroundSource from "../../../assets/maps/layers/kerning-city-foreground-v1.svg?raw";
import caveForegroundSource from "../../../assets/maps/layers/mushroom-cave-foreground-v1.svg?raw";
import shadowTrialForegroundSource from "../../../assets/maps/layers/shadow-trial-foreground-v1.svg?raw";
import antNestForegroundSource from "../../../assets/maps/layers/crystal-ant-nest-foreground-v1.svg?raw";
import clockworkForegroundSource from "../../../assets/maps/layers/clockwork-tower-foreground-v1.svg?raw";
import coralTempleForegroundSource from "../../../assets/maps/layers/sunken-coral-temple-foreground-v1.svg?raw";
import emberMineForegroundSource from "../../../assets/maps/layers/ember-mine-foreground-v1.svg?raw";
import libraryForegroundSource from "../../../assets/maps/layers/moonlit-arcane-library-foreground-v1.svg?raw";
import duelGroundForegroundSource from "../../../assets/maps/layers/infinite-duel-ground-foreground-v1.svg?raw";
import patienceForestForegroundSource from "../../../assets/maps/layers/patience-forest-foreground-v1.svg?raw";
import { describe, expect, it } from "vitest";
import { MAP_DEFINITIONS, MapId } from "./map-definitions";

describe("map visual alignment", () => {
  it("draws Kerning City foreground bands on every collision platform top", () => {
    const platformTops = MAP_DEFINITIONS[MapId.KerningCity].platforms.map(
      (platform) => platform.y - platform.height / 2,
    );

    for (const top of platformTops) {
      expect(kerningForegroundSource).toContain(`data-platform-top="${top}"`);
    }
  });

  it("keeps the generated city layer at the full world size", () => {
    expect(kerningForegroundSource).toContain('viewBox="0 0 1920 720"');
    expect(kerningForegroundSource).toContain('shape-rendering="crispEdges"');
  });

  it("draws every cave platform at the collision position and width", () => {
    for (const platform of MAP_DEFINITIONS[MapId.GreenMushroomCave].platforms) {
      const top = platform.y - platform.height / 2;
      expect(caveForegroundSource).toContain(
        `data-platform-top="${top}" data-platform-x="${platform.x}" data-platform-width="${platform.width}"`,
      );
    }
  });

  it("aligns cave portal sockets and keeps the layer at world size", () => {
    for (const portal of MAP_DEFINITIONS[MapId.GreenMushroomCave].portals) {
      expect(caveForegroundSource).toContain(`data-portal-id="${portal.id}"`);
      expect(caveForegroundSource).toContain(`data-portal-x="${portal.x}"`);
      expect(caveForegroundSource).toContain(`data-portal-y="${portal.y}"`);
    }
    expect(caveForegroundSource).toContain('viewBox="0 0 1920 720"');
    expect(caveForegroundSource).toContain('shape-rendering="crispEdges"');
  });

  it("aligns every new dungeon platform and portal with its foreground layer", () => {
    const layers = new Map([
      [MapId.CrystalAntNest, antNestForegroundSource],
      [MapId.ClockworkTower, clockworkForegroundSource],
      [MapId.SunkenCoralTemple, coralTempleForegroundSource],
      [MapId.EmberMine, emberMineForegroundSource],
      [MapId.MoonlitArcaneLibrary, libraryForegroundSource],
      [MapId.InfiniteDuelGround, duelGroundForegroundSource],
    ]);

    for (const [mapId, source] of layers) {
      const definition = MAP_DEFINITIONS[mapId];
      expect(source).toContain('viewBox="0 0 1920 720"');
      for (const platform of definition.platforms) {
        const top = platform.y - platform.height / 2;
        expect(source).toContain(
          `data-platform-top="${top}" data-platform-x="${platform.x}" data-platform-width="${platform.width}"`,
        );
      }
      for (const portal of definition.portals) {
        expect(source).toContain(`data-portal-id="${portal.id}"`);
        expect(source).toContain(`data-portal-x="${portal.x}"`);
        expect(source).toContain(`data-portal-y="${portal.y}"`);
      }
      for (const climbable of definition.climbables ?? []) {
        expect(source).toContain(`data-climbable-id="${climbable.id}"`);
        expect(source).toContain(`data-climbable-kind="${climbable.kind}"`);
        expect(source).toContain(`data-climbable-x="${climbable.x}"`);
        expect(source).toContain(`data-climbable-top="${climbable.top}"`);
        expect(source).toContain(`data-climbable-bottom="${climbable.bottom}"`);
      }
    }
  });

  it("aligns the Shadow Trial rope with its maintained foreground layer", () => {
    const climbable = MAP_DEFINITIONS[MapId.ShadowTrialDungeon].climbables?.[0];
    expect(climbable).toBeDefined();
    expect(shadowTrialForegroundSource).toContain(`data-climbable-id="${climbable?.id}"`);
    expect(shadowTrialForegroundSource).toContain(`data-climbable-kind="${climbable?.kind}"`);
    expect(shadowTrialForegroundSource).toContain(`data-climbable-x="${climbable?.x}"`);
    expect(shadowTrialForegroundSource).toContain(`data-climbable-top="${climbable?.top}"`);
    expect(shadowTrialForegroundSource).toContain(`data-climbable-bottom="${climbable?.bottom}"`);
  });

  it("aligns the tall Patience Forest platforms, portals, ropes, and hazards", () => {
    const definition = MAP_DEFINITIONS[MapId.PatienceForest];
    expect(patienceForestForegroundSource).toContain('viewBox="0 0 1920 1440"');
    expect(patienceForestForegroundSource).toContain('shape-rendering="crispEdges"');
    for (const platform of definition.platforms) {
      const top = platform.y - platform.height / 2;
      expect(patienceForestForegroundSource).toContain(
        `data-platform-top="${top}" data-platform-x="${platform.x}" data-platform-width="${platform.width}"`,
      );
    }
    for (const portal of definition.portals) {
      expect(patienceForestForegroundSource).toContain(`data-portal-id="${portal.id}"`);
      expect(patienceForestForegroundSource).toContain(`data-portal-x="${portal.x}"`);
      expect(patienceForestForegroundSource).toContain(`data-portal-y="${portal.y}"`);
    }
    for (const climbable of definition.climbables ?? []) {
      expect(patienceForestForegroundSource).toContain(`data-climbable-id="${climbable.id}"`);
      expect(patienceForestForegroundSource).toContain(`data-climbable-kind="${climbable.kind}"`);
      expect(patienceForestForegroundSource).toContain(`data-climbable-top="${climbable.top}"`);
      expect(patienceForestForegroundSource).toContain(`data-climbable-bottom="${climbable.bottom}"`);
    }
    for (const hazard of definition.hazards ?? []) {
      expect(patienceForestForegroundSource).toContain(`data-hazard-id="${hazard.id}"`);
      expect(patienceForestForegroundSource).toContain(`data-hazard-kind="${hazard.kind}"`);
      expect(patienceForestForegroundSource).toContain(`data-hazard-x="${hazard.x}"`);
      expect(patienceForestForegroundSource).toContain(`data-hazard-y="${hazard.y}"`);
    }
  });
});
