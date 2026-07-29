import Phaser from "phaser";
import kerningCityMidgroundUrl from "../../../assets/maps/layers/kerning-city-midground-v1.svg?url";
import mushroomCaveMidgroundUrl from "../../../assets/maps/layers/mushroom-cave-midground-v1.svg?url";
import kerningCityUrl from "../../../assets/maps/screens/kerning-city-v1.webp?url";
import mushroomCaveUrl from "../../../assets/maps/screens/mushroom-cave-v1.webp?url";
import shadowHideoutUrl from "../../../assets/maps/screens/shadow-hideout-v1.webp?url";
import shadowTrialUrl from "../../../assets/maps/screens/shadow-trial-v1.webp?url";
import shadowTrialMidgroundUrl from "../../../assets/maps/layers/shadow-trial-midground-v1.svg?url";
import crystalAntNestUrl from "../../../assets/maps/screens/crystal-ant-nest-v1.webp?url";
import clockworkTowerUrl from "../../../assets/maps/screens/clockwork-tower-v1.webp?url";
import sunkenCoralTempleUrl from "../../../assets/maps/screens/sunken-coral-temple-v1.webp?url";
import emberMineUrl from "../../../assets/maps/screens/ember-mine-v1.webp?url";
import moonlitArcaneLibraryUrl from "../../../assets/maps/screens/moonlit-arcane-library-v1.webp?url";
import infiniteDuelGroundUrl from "../../../assets/maps/screens/infinite-duel-ground-v1.webp?url";
import patienceForestUrl from "../../../assets/maps/screens/patience-forest-v1.webp?url";
import mapObjectKitsAUrl from "../../../assets/maps/objects/map-object-kits-a-v1.webp?url";
import mapObjectKitsBUrl from "../../../assets/maps/objects/map-object-kits-b-v1.webp?url";
import mapObjectKitsCUrl from "../../../assets/maps/objects/map-object-kits-c-v2.webp?url";
import patienceHazardsUrl from "../../../assets/maps/objects/patience-hazards-v1.webp?url";

export const MapAssetKey = {
  KerningCity: "map:kerning-city",
  KerningCityMidground: "map:kerning-city-midground",
  ShadowHideout: "map:shadow-hideout",
  MushroomCave: "map:mushroom-cave",
  MushroomCaveMidground: "map:mushroom-cave-midground",
  ShadowTrial: "map:shadow-trial",
  ShadowTrialMidground: "map:shadow-trial-midground",
  CrystalAntNest: "map:crystal-ant-nest",
  ClockworkTower: "map:clockwork-tower",
  SunkenCoralTemple: "map:sunken-coral-temple",
  EmberMine: "map:ember-mine",
  MoonlitArcaneLibrary: "map:moonlit-arcane-library",
  InfiniteDuelGround: "map:infinite-duel-ground",
  PatienceForest: "map:patience-forest",
  ObjectKitsA: "map:object-kits-a",
  ObjectKitsB: "map:object-kits-b",
  ObjectKitsC: "map:object-kits-c",
  PatienceHazards: "map:patience-hazards",
} as const;

export const MapObjectTheme = {
  KerningCity: "kerningCity",
  ShadowHideout: "shadowHideout",
  MushroomCave: "mushroomCave",
  ShadowTrial: "shadowTrial",
  CrystalAntNest: "crystalAntNest",
  ClockworkTower: "clockworkTower",
  SunkenCoralTemple: "sunkenCoralTemple",
  EmberMine: "emberMine",
  MoonlitArcaneLibrary: "moonlitArcaneLibrary",
  InfiniteDuelGround: "infiniteDuelGround",
  PatienceForest: "patienceForest",
} as const;

export type MapObjectTheme = (typeof MapObjectTheme)[keyof typeof MapObjectTheme];
export type MapObjectKind = "platform" | "rope" | "portal";

interface ObjectKitCell {
  atlasKey: (typeof MapAssetKey)["ObjectKitsA" | "ObjectKitsB" | "ObjectKitsC"];
  x: number;
  y: number;
}

interface ObjectFrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
  surfaceY?: number;
}

const MAP_OBJECT_KIT_CELLS: Record<MapObjectTheme, ObjectKitCell> = {
  [MapObjectTheme.KerningCity]: { atlasKey: MapAssetKey.ObjectKitsA, x: 0, y: 0 },
  [MapObjectTheme.ShadowHideout]: { atlasKey: MapAssetKey.ObjectKitsA, x: 256, y: 0 },
  [MapObjectTheme.MushroomCave]: { atlasKey: MapAssetKey.ObjectKitsA, x: 0, y: 256 },
  [MapObjectTheme.ShadowTrial]: { atlasKey: MapAssetKey.ObjectKitsA, x: 256, y: 256 },
  [MapObjectTheme.CrystalAntNest]: { atlasKey: MapAssetKey.ObjectKitsB, x: 0, y: 0 },
  [MapObjectTheme.ClockworkTower]: { atlasKey: MapAssetKey.ObjectKitsB, x: 256, y: 0 },
  [MapObjectTheme.SunkenCoralTemple]: { atlasKey: MapAssetKey.ObjectKitsB, x: 0, y: 256 },
  [MapObjectTheme.EmberMine]: { atlasKey: MapAssetKey.ObjectKitsB, x: 256, y: 256 },
  [MapObjectTheme.MoonlitArcaneLibrary]: { atlasKey: MapAssetKey.ObjectKitsC, x: 0, y: 0 },
  [MapObjectTheme.InfiniteDuelGround]: { atlasKey: MapAssetKey.ObjectKitsC, x: 256, y: 0 },
  [MapObjectTheme.PatienceForest]: { atlasKey: MapAssetKey.ObjectKitsC, x: 0, y: 256 },
};

const MAP_OBJECT_FRAME_RECTS: Record<MapObjectTheme, Record<MapObjectKind, ObjectFrameRect>> = {
  [MapObjectTheme.KerningCity]: {
    platform: { x: 21, y: 38, width: 212, height: 61, surfaceY: 0 },
    rope: { x: 49, y: 107, width: 14, height: 122 },
    portal: { x: 142, y: 104, width: 83, height: 125 },
  },
  [MapObjectTheme.ShadowHideout]: {
    platform: { x: 22, y: 38, width: 212, height: 66, surfaceY: 0 },
    rope: { x: 51, y: 106, width: 14, height: 123 },
    portal: { x: 142, y: 105, width: 79, height: 124 },
  },
  [MapObjectTheme.MushroomCave]: {
    platform: { x: 20, y: 32, width: 216, height: 74, surfaceY: 16 },
    rope: { x: 49, y: 107, width: 13, height: 124 },
    portal: { x: 140, y: 108, width: 83, height: 122 },
  },
  [MapObjectTheme.ShadowTrial]: {
    platform: { x: 20, y: 44, width: 216, height: 63, surfaceY: 1 },
    rope: { x: 50, y: 107, width: 13, height: 124 },
    portal: { x: 141, y: 106, width: 80, height: 124 },
  },
  [MapObjectTheme.CrystalAntNest]: {
    platform: { x: 24, y: 31, width: 208, height: 60, surfaceY: 1 },
    rope: { x: 58, y: 98, width: 17, height: 121 },
    portal: { x: 131, y: 95, width: 76, height: 122 },
  },
  [MapObjectTheme.ClockworkTower]: {
    platform: { x: 27, y: 31, width: 205, height: 59, surfaceY: 1 },
    rope: { x: 56, y: 98, width: 18, height: 120 },
    portal: { x: 127, y: 98, width: 79, height: 118 },
  },
  [MapObjectTheme.SunkenCoralTemple]: {
    platform: { x: 22, y: 29, width: 209, height: 62, surfaceY: 4 },
    rope: { x: 60, y: 97, width: 14, height: 121 },
    portal: { x: 125, y: 95, width: 88, height: 121 },
  },
  [MapObjectTheme.EmberMine]: {
    platform: { x: 22, y: 31, width: 209, height: 60, surfaceY: 2 },
    rope: { x: 56, y: 96, width: 17, height: 122 },
    portal: { x: 128, y: 95, width: 77, height: 121 },
  },
  [MapObjectTheme.MoonlitArcaneLibrary]: {
    platform: { x: 23, y: 31, width: 220, height: 69, surfaceY: 1 },
    rope: { x: 51, y: 107, width: 14, height: 136 },
    portal: { x: 134, y: 105, width: 81, height: 139 },
  },
  [MapObjectTheme.InfiniteDuelGround]: {
    platform: { x: 15, y: 31, width: 218, height: 63, surfaceY: 1 },
    rope: { x: 33, y: 105, width: 16, height: 139 },
    portal: { x: 112, y: 105, width: 100, height: 139 },
  },
  [MapObjectTheme.PatienceForest]: {
    platform: { x: 22, y: 19, width: 219, height: 60, surfaceY: 12 },
    rope: { x: 40, y: 98, width: 19, height: 132 },
    portal: { x: 130, y: 98, width: 95, height: 131 },
  },
};

const MAP_PORTAL_GLOW_COLORS: Record<MapObjectTheme, number> = {
  [MapObjectTheme.KerningCity]: 0x78e9ff,
  [MapObjectTheme.ShadowHideout]: 0xb58cff,
  [MapObjectTheme.MushroomCave]: 0x7dff9e,
  [MapObjectTheme.ShadowTrial]: 0xb26cff,
  [MapObjectTheme.CrystalAntNest]: 0xffc65a,
  [MapObjectTheme.ClockworkTower]: 0x78cfff,
  [MapObjectTheme.SunkenCoralTemple]: 0x61efff,
  [MapObjectTheme.EmberMine]: 0xff7a36,
  [MapObjectTheme.MoonlitArcaneLibrary]: 0xa789ff,
  [MapObjectTheme.InfiniteDuelGround]: 0xff5d54,
  [MapObjectTheme.PatienceForest]: 0xffd56a,
};

const PORTAL_EFFECT_FRAME = {
  x: 272,
  y: 360,
  width: 224,
  height: 112,
} as const;

const PORTAL_EFFECT_FRAME_NAME = "map-object:portal-effect";

export const runtimeMapAssets = [
  { key: MapAssetKey.KerningCity, url: kerningCityUrl, kind: "backdrop" },
  {
    key: MapAssetKey.KerningCityMidground,
    url: kerningCityMidgroundUrl,
    kind: "layer",
  },
  { key: MapAssetKey.ShadowHideout, url: shadowHideoutUrl, kind: "backdrop" },
  { key: MapAssetKey.MushroomCave, url: mushroomCaveUrl, kind: "backdrop" },
  {
    key: MapAssetKey.MushroomCaveMidground,
    url: mushroomCaveMidgroundUrl,
    kind: "layer",
  },
  { key: MapAssetKey.ShadowTrial, url: shadowTrialUrl, kind: "backdrop" },
  {
    key: MapAssetKey.ShadowTrialMidground,
    url: shadowTrialMidgroundUrl,
    kind: "layer",
  },
  { key: MapAssetKey.CrystalAntNest, url: crystalAntNestUrl, kind: "backdrop" },
  { key: MapAssetKey.ClockworkTower, url: clockworkTowerUrl, kind: "backdrop" },
  { key: MapAssetKey.SunkenCoralTemple, url: sunkenCoralTempleUrl, kind: "backdrop" },
  { key: MapAssetKey.EmberMine, url: emberMineUrl, kind: "backdrop" },
  { key: MapAssetKey.MoonlitArcaneLibrary, url: moonlitArcaneLibraryUrl, kind: "backdrop" },
  { key: MapAssetKey.InfiniteDuelGround, url: infiniteDuelGroundUrl, kind: "backdrop" },
  { key: MapAssetKey.PatienceForest, url: patienceForestUrl, kind: "backdrop" },
  { key: MapAssetKey.ObjectKitsA, url: mapObjectKitsAUrl, kind: "object-kit" },
  { key: MapAssetKey.ObjectKitsB, url: mapObjectKitsBUrl, kind: "object-kit" },
  { key: MapAssetKey.ObjectKitsC, url: mapObjectKitsCUrl, kind: "object-kit" },
  { key: MapAssetKey.PatienceHazards, url: patienceHazardsUrl, kind: "object-kit" },
] as const;

export function preloadMapAssets(scene: Phaser.Scene): void {
  for (const asset of runtimeMapAssets) {
    scene.load.image(asset.key, asset.url);
  }
}

function objectFrameName(theme: MapObjectTheme, kind: MapObjectKind): string {
  return `map-object:${theme}:${kind}`;
}

export function registerMapObjectFrames(scene: Phaser.Scene): void {
  for (const [theme, cell] of Object.entries(MAP_OBJECT_KIT_CELLS) as [MapObjectTheme, ObjectKitCell][]) {
    const texture = scene.textures.get(cell.atlasKey);
    for (const kind of ["platform", "rope", "portal"] as const) {
      const frame = MAP_OBJECT_FRAME_RECTS[theme][kind];
      texture.add(
        objectFrameName(theme, kind),
        0,
        cell.x + frame.x,
        cell.y + frame.y,
        frame.width,
        frame.height,
      );
    }
  }
  scene.textures.get(MapAssetKey.ObjectKitsC).add(
    PORTAL_EFFECT_FRAME_NAME,
    0,
    PORTAL_EFFECT_FRAME.x,
    PORTAL_EFFECT_FRAME.y,
    PORTAL_EFFECT_FRAME.width,
    PORTAL_EFFECT_FRAME.height,
  );
  const hazards = scene.textures.get(MapAssetKey.PatienceHazards);
  hazards.add("map-hazard:swingingLog", 0, 0, 112, 128, 144);
  hazards.add("map-hazard:fallingAcorn", 0, 128, 112, 128, 144);
  hazards.add("map-hazard:thornOrb", 0, 256, 112, 128, 144);
}

export function mapObjectFrame(theme: MapObjectTheme, kind: MapObjectKind): {
  key: ObjectKitCell["atlasKey"];
  frame: string;
} {
  return { key: MAP_OBJECT_KIT_CELLS[theme].atlasKey, frame: objectFrameName(theme, kind) };
}

export function mapPlatformVisualTopY(
  theme: MapObjectTheme,
  collisionTopY: number,
  displayHeight: number,
): number {
  const frame = MAP_OBJECT_FRAME_RECTS[theme].platform;
  const surfaceY = frame.surfaceY ?? 0;
  return collisionTopY - (surfaceY / frame.height) * displayHeight;
}

export function mapPortalGlowColor(theme: MapObjectTheme): number {
  return MAP_PORTAL_GLOW_COLORS[theme];
}

export function mapPortalEffectFrame(): {
  key: typeof MapAssetKey.ObjectKitsC;
  frame: typeof PORTAL_EFFECT_FRAME_NAME;
} {
  return {
    key: MapAssetKey.ObjectKitsC,
    frame: PORTAL_EFFECT_FRAME_NAME,
  };
}

export function mapHazardFrame(kind: "swingingLog" | "fallingAcorn" | "thornOrb"): {
  key: typeof MapAssetKey.PatienceHazards;
  frame: string;
} {
  return { key: MapAssetKey.PatienceHazards, frame: `map-hazard:${kind}` };
}
