import {
  MapAssetKey,
  MapObjectTheme,
  type MapObjectTheme as MapObjectThemeType,
} from "../assets/map-assets";
import { AudioAssetKey, type BgmAssetKey } from "../assets/audio-assets";
import type { MonsterKind } from "../data/catalog";
import {
  JobAdvancementQuestId,
  type JobAdvancementQuestId as JobAdvancementQuestIdType,
} from "../quests/job-advancement-quests";

export const MapId = {
  KerningCity: "kerningCity",
  ShadowHideout: "shadowHideout",
  GreenMushroomCave: "greenMushroomCave",
  ShadowTrialDungeon: "shadowTrialDungeon",
  CrystalAntNest: "crystalAntNest",
  ClockworkTower: "clockworkTower",
  SunkenCoralTemple: "sunkenCoralTemple",
  EmberMine: "emberMine",
  MoonlitArcaneLibrary: "moonlitArcaneLibrary",
  InfiniteDuelGround: "infiniteDuelGround",
  PatienceForest: "patienceForest",
} as const;

export type MapId = (typeof MapId)[keyof typeof MapId];

export interface Point {
  x: number;
  y: number;
}

export interface PlatformDefinition extends Point {
  width: number;
  height: number;
  oneWay: boolean;
}

export interface PortalDefinition extends Point {
  id: string;
  label: string;
  targetMap: MapId;
  targetSpawn: string;
  requiresDungeonMidBossDefeat?: boolean;
  access?: {
    kind: "active-job-quest";
    questIds: readonly JobAdvancementQuestIdType[];
  };
}

export interface NpcDefinition extends Point {
  id:
    | "darkLord"
    | "streetHealer"
    | "bookMerchant"
    | "dungeonScout"
    | "gameDeveloper"
    | "dua";
  label: string;
  spriteSheet:
    | "shadowMentor"
    | "streetHealer"
    | "dungeonScout"
    | "gameDeveloper"
    | "duaPet";
  interaction:
    | "jobAdvancement"
    | "fullRecovery"
    | "shop"
    | "bossQuest"
    | "developerPromo"
    | "petAdoption";
}

export interface MonsterSpawnDefinition extends Point {
  id: string;
  kind: MonsterKind;
  patrolMinX: number;
  patrolMaxX: number;
  respawnMs: number;
}

export interface ClimbableDefinition {
  id: string;
  kind: "rope";
  x: number;
  top: number;
  bottom: number;
  width: number;
}

export interface HazardDefinition extends Point {
  id: string;
  kind: "swingingLog" | "thornOrb" | "fallingAcorn";
  width: number;
  height: number;
  motion: {
    axis: "x" | "y";
    distance: number;
    periodMs: number;
    phaseMs: number;
  };
}

export interface MapBackgroundLayerDefinition {
  key: string;
  depth: number;
  scrollFactor: number;
  sizing: "viewport" | "world";
}

export interface MapDefinition {
  id: MapId;
  topLevelRegion: "kerningCity" | "greenMushroomCave" | "dungeonCircuit";
  name: string;
  recommendedLevelRange: readonly [minimum: number, maximum: number] | null;
  bgm: BgmAssetKey;
  objectTheme: MapObjectThemeType;
  backgroundLayers: MapBackgroundLayerDefinition[];
  width: number;
  height: number;
  spawnPoints: Record<string, Point>;
  platforms: PlatformDefinition[];
  portals: PortalDefinition[];
  npcs: NpcDefinition[];
  monsters: MonsterSpawnDefinition[];
  climbables?: ClimbableDefinition[];
  hazards?: HazardDefinition[];
}

const ground = (width: number, top: number): PlatformDefinition => ({
  x: width / 2,
  y: top + 60,
  width,
  height: 120,
  oneWay: false,
});

export const MAP_DEFINITIONS: Record<MapId, MapDefinition> = {
  [MapId.KerningCity]: {
    id: MapId.KerningCity,
    topLevelRegion: "kerningCity",
    name: "커닝시티",
    recommendedLevelRange: null,
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.KerningCity,
    backgroundLayers: [
      {
        key: MapAssetKey.KerningCity,
        depth: -130,
        scrollFactor: 0,
        sizing: "viewport",
      },
      {
        key: MapAssetKey.KerningCityMidground,
        depth: -120,
        scrollFactor: 0.55,
        sizing: "world",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      initial: { x: 260, y: 620 },
      fromHideout: { x: 285, y: 620 },
      fromCave: { x: 1600, y: 620 },
      fromLibrary: { x: 1400, y: 620 },
    },
    platforms: [
      ground(1920, 620),
      { x: 560, y: 470, width: 330, height: 24, oneWay: true },
      { x: 1110, y: 520, width: 310, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "city-hideout",
        label: "도적 아지트",
        x: 180,
        y: 620,
        targetMap: MapId.ShadowHideout,
        targetSpawn: "entry",
      },
      {
        id: "city-cave",
        label: "초록버섯굴",
        x: 1710,
        y: 620,
        targetMap: MapId.GreenMushroomCave,
        targetSpawn: "fromCity",
      },
      {
        id: "city-library",
        label: "달빛 서고",
        x: 1460,
        y: 620,
        targetMap: MapId.MoonlitArcaneLibrary,
        targetSpawn: "fromCity",
        requiresDungeonMidBossDefeat: true,
      },
    ],
    npcs: [
      {
        id: "dua",
        label: "두아",
        spriteSheet: "duaPet",
        interaction: "petAdoption",
        x: 430,
        y: 620,
      },
      {
        id: "gameDeveloper",
        label: "일용직 개발자 임상진",
        spriteSheet: "gameDeveloper",
        interaction: "developerPromo",
        x: 650,
        y: 620,
      },
      {
        id: "streetHealer",
        label: "도시 치료사",
        spriteSheet: "streetHealer",
        interaction: "fullRecovery",
        x: 820,
        y: 620,
      },
      {
        id: "bookMerchant",
        label: "서적상 레오",
        spriteSheet: "streetHealer",
        interaction: "shop",
        x: 1210,
        y: 620,
      },
      {
        id: "dungeonScout",
        label: "원정대장 세라",
        spriteSheet: "dungeonScout",
        interaction: "bossQuest",
        x: 940,
        y: 620,
      },
    ],
    monsters: [],
  },
  [MapId.ShadowHideout]: {
    id: MapId.ShadowHideout,
    topLevelRegion: "kerningCity",
    name: "커닝시티 · 도적 아지트",
    recommendedLevelRange: null,
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.ShadowHideout,
    backgroundLayers: [
      {
        key: MapAssetKey.ShadowHideout,
        depth: -120,
        scrollFactor: 1,
        sizing: "world",
      },
    ],
    width: 1280,
    height: 720,
    spawnPoints: {
      entry: { x: 170, y: 595 },
    },
    platforms: [ground(1280, 595)],
    portals: [
      {
        id: "hideout-city",
        label: "커닝시티",
        x: 105,
        y: 595,
        targetMap: MapId.KerningCity,
        targetSpawn: "fromHideout",
      },
      {
        id: "hideout-shadow-trial",
        label: "그림자 시험장",
        x: 1170,
        y: 595,
        targetMap: MapId.ShadowTrialDungeon,
        targetSpawn: "entry",
        access: {
          kind: "active-job-quest",
          questIds: [
            JobAdvancementQuestId.RogueTrial,
            JobAdvancementQuestId.AssassinTrial,
            JobAdvancementQuestId.HermitTrial,
            JobAdvancementQuestId.HokageTrial,
          ],
        },
      },
    ],
    npcs: [
      {
        id: "darkLord",
        label: "다크로드",
        spriteSheet: "shadowMentor",
        interaction: "jobAdvancement",
        x: 1040,
        y: 595,
      },
    ],
    monsters: [],
  },
  [MapId.GreenMushroomCave]: {
    id: MapId.GreenMushroomCave,
    topLevelRegion: "greenMushroomCave",
    name: "초록버섯굴",
    recommendedLevelRange: [10, 29],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.MushroomCave,
    backgroundLayers: [
      {
        key: MapAssetKey.MushroomCave,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
      {
        key: MapAssetKey.MushroomCaveMidground,
        depth: -120,
        scrollFactor: 0.38,
        sizing: "world",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromCity: { x: 180, y: 610 },
      upper: { x: 1660, y: 180 },
      fromAntNest: { x: 840, y: 350 },
      fromPatienceForest: { x: 380, y: 230 },
    },
    platforms: [
      ground(1920, 610),
      { x: 1490, y: 465, width: 570, height: 24, oneWay: true },
      { x: 880, y: 486, width: 300, height: 24, oneWay: true },
      { x: 730, y: 350, width: 500, height: 24, oneWay: true },
      { x: 1320, y: 180, width: 720, height: 24, oneWay: true },
      { x: 300, y: 230, width: 320, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "cave-city-ground",
        label: "커닝시티",
        x: 145,
        y: 610,
        targetMap: MapId.KerningCity,
        targetSpawn: "fromCave",
      },
      {
        id: "cave-city-upper",
        label: "커닝시티",
        x: 1680,
        y: 180,
        targetMap: MapId.KerningCity,
        targetSpawn: "fromCave",
      },
      {
        id: "cave-ant-nest",
        label: "수정 개미굴",
        x: 880,
        y: 350,
        targetMap: MapId.CrystalAntNest,
        targetSpawn: "fromCave",
      },
      {
        id: "cave-patience-forest",
        label: "인내의 숲",
        x: 300,
        y: 230,
        targetMap: MapId.PatienceForest,
        targetSpawn: "fromCave",
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "green-mushroom-1",
        kind: "greenMushroom",
        x: 610,
        y: 610,
        patrolMinX: 430,
        patrolMaxX: 790,
        respawnMs: 2400,
      },
      {
        id: "green-mushroom-2",
        kind: "greenMushroom",
        x: 1090,
        y: 610,
        patrolMinX: 900,
        patrolMaxX: 1270,
        respawnMs: 2400,
      },
      {
        id: "green-mushroom-3",
        kind: "greenMushroom",
        x: 1510,
        y: 453,
        patrolMinX: 1300,
        patrolMaxX: 1690,
        respawnMs: 2400,
      },
      {
        id: "green-mushroom-4",
        kind: "greenMushroom",
        x: 1160,
        y: 168,
        patrolMinX: 1030,
        patrolMaxX: 1280,
        respawnMs: 2400,
      },
    ],
  },
  [MapId.ShadowTrialDungeon]: {
    id: MapId.ShadowTrialDungeon,
    topLevelRegion: "kerningCity",
    name: "그림자 시험장",
    recommendedLevelRange: null,
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.ShadowTrial,
    backgroundLayers: [
      {
        key: MapAssetKey.ShadowTrial,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
      {
        key: MapAssetKey.ShadowTrialMidground,
        depth: -120,
        scrollFactor: 0.42,
        sizing: "world",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      entry: { x: 150, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 610, y: 440, width: 520, height: 24, oneWay: true },
      { x: 1360, y: 440, width: 480, height: 24, oneWay: true },
      { x: 980, y: 270, width: 620, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "shadow-trial-hideout",
        label: "도적 아지트",
        x: 105,
        y: 610,
        targetMap: MapId.ShadowHideout,
        targetSpawn: "entry",
      },
    ],
    climbables: [
      {
        id: "shadow-trial-rope",
        kind: "rope",
        x: 400,
        top: 438,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "shadow-sentinel-1",
        kind: "shadowSentinel",
        x: 560,
        y: 610,
        patrolMinX: 360,
        patrolMaxX: 760,
        respawnMs: 3600,
      },
      {
        id: "shadow-sentinel-2",
        kind: "shadowSentinel",
        x: 1040,
        y: 610,
        patrolMinX: 820,
        patrolMaxX: 1240,
        respawnMs: 3600,
      },
      {
        id: "shadow-sentinel-3",
        kind: "shadowSentinel",
        x: 1390,
        y: 428,
        patrolMinX: 1190,
        patrolMaxX: 1550,
        respawnMs: 3600,
      },
      {
        id: "abyss-golem-1",
        kind: "abyssGolem",
        x: 1690,
        y: 610,
        patrolMinX: 1540,
        patrolMaxX: 1810,
        respawnMs: 10_000,
      },
    ],
  },
  [MapId.CrystalAntNest]: {
    id: MapId.CrystalAntNest,
    topLevelRegion: "dungeonCircuit",
    name: "수정 개미굴",
    recommendedLevelRange: [30, 49],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.CrystalAntNest,
    backgroundLayers: [
      {
        key: MapAssetKey.CrystalAntNest,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromCave: { x: 150, y: 610 },
      fromClockwork: { x: 1760, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 510, y: 460, width: 420, height: 24, oneWay: true },
      { x: 1050, y: 330, width: 440, height: 24, oneWay: true },
      { x: 1570, y: 470, width: 380, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "ant-nest-cave",
        label: "초록버섯굴",
        x: 105,
        y: 610,
        targetMap: MapId.GreenMushroomCave,
        targetSpawn: "fromAntNest",
      },
      {
        id: "ant-nest-clockwork",
        label: "시계태엽 탑",
        x: 1815,
        y: 610,
        targetMap: MapId.ClockworkTower,
        targetSpawn: "fromAntNest",
      },
    ],
    climbables: [
      {
        id: "ant-nest-rope",
        kind: "rope",
        x: 350,
        top: 458,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "ant-nest-sentinel-1",
        kind: "crystalSentinel",
        x: 520,
        y: 610,
        patrolMinX: 330,
        patrolMaxX: 720,
        respawnMs: 3600,
      },
      {
        id: "ant-nest-sentinel-2",
        kind: "crystalSentinel",
        x: 510,
        y: 448,
        patrolMinX: 340,
        patrolMaxX: 680,
        respawnMs: 3600,
      },
      {
        id: "ant-nest-sentinel-3",
        kind: "crystalSentinel",
        x: 1050,
        y: 318,
        patrolMinX: 880,
        patrolMaxX: 1220,
        respawnMs: 3600,
      },
      {
        id: "ant-nest-sentinel-4",
        kind: "crystalSentinel",
        x: 1570,
        y: 458,
        patrolMinX: 1430,
        patrolMaxX: 1710,
        respawnMs: 3600,
      },
    ],
  },
  [MapId.ClockworkTower]: {
    id: MapId.ClockworkTower,
    topLevelRegion: "dungeonCircuit",
    name: "시계태엽 탑",
    recommendedLevelRange: [50, 69],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.ClockworkTower,
    backgroundLayers: [
      {
        key: MapAssetKey.ClockworkTower,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromAntNest: { x: 150, y: 610 },
      fromCoral: { x: 1760, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 430, y: 460, width: 360, height: 24, oneWay: true },
      { x: 950, y: 310, width: 430, height: 24, oneWay: true },
      { x: 1510, y: 460, width: 430, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "clockwork-ant-nest",
        label: "수정 개미굴",
        x: 105,
        y: 610,
        targetMap: MapId.CrystalAntNest,
        targetSpawn: "fromClockwork",
      },
      {
        id: "clockwork-coral-temple",
        label: "산호 신전",
        x: 1815,
        y: 610,
        targetMap: MapId.SunkenCoralTemple,
        targetSpawn: "fromClockwork",
      },
    ],
    climbables: [
      {
        id: "clockwork-rope",
        kind: "rope",
        x: 300,
        top: 458,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "clockwork-sentinel-1",
        kind: "clockworkSentinel",
        x: 520,
        y: 610,
        patrolMinX: 320,
        patrolMaxX: 720,
        respawnMs: 3800,
      },
      {
        id: "clockwork-sentinel-2",
        kind: "clockworkSentinel",
        x: 430,
        y: 448,
        patrolMinX: 310,
        patrolMaxX: 550,
        respawnMs: 3800,
      },
      {
        id: "clockwork-sentinel-3",
        kind: "clockworkSentinel",
        x: 950,
        y: 298,
        patrolMinX: 790,
        patrolMaxX: 1110,
        respawnMs: 3800,
      },
      {
        id: "clockwork-sentinel-4",
        kind: "clockworkSentinel",
        x: 1510,
        y: 448,
        patrolMinX: 1360,
        patrolMaxX: 1660,
        respawnMs: 3800,
      },
    ],
  },
  [MapId.SunkenCoralTemple]: {
    id: MapId.SunkenCoralTemple,
    topLevelRegion: "dungeonCircuit",
    name: "가라앉은 산호 신전",
    recommendedLevelRange: [70, 99],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.SunkenCoralTemple,
    backgroundLayers: [
      {
        key: MapAssetKey.SunkenCoralTemple,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromClockwork: { x: 150, y: 610 },
      fromEmber: { x: 1760, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 540, y: 460, width: 500, height: 24, oneWay: true },
      { x: 960, y: 300, width: 400, height: 24, oneWay: true },
      { x: 1370, y: 460, width: 500, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "coral-temple-clockwork",
        label: "시계태엽 탑",
        x: 105,
        y: 610,
        targetMap: MapId.ClockworkTower,
        targetSpawn: "fromCoral",
      },
      {
        id: "coral-temple-ember-mine",
        label: "잿불 광산",
        x: 1815,
        y: 610,
        targetMap: MapId.EmberMine,
        targetSpawn: "fromCoral",
      },
    ],
    climbables: [
      {
        id: "coral-temple-rope",
        kind: "rope",
        x: 340,
        top: 458,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "coral-golem-1",
        kind: "coralGolem",
        x: 470,
        y: 610,
        patrolMinX: 300,
        patrolMaxX: 650,
        respawnMs: 7200,
      },
      {
        id: "coral-golem-2",
        kind: "coralGolem",
        x: 540,
        y: 448,
        patrolMinX: 350,
        patrolMaxX: 730,
        respawnMs: 7200,
      },
      {
        id: "coral-golem-3",
        kind: "coralGolem",
        x: 960,
        y: 288,
        patrolMinX: 830,
        patrolMaxX: 1090,
        respawnMs: 7200,
      },
      {
        id: "coral-golem-4",
        kind: "coralGolem",
        x: 1370,
        y: 448,
        patrolMinX: 1190,
        patrolMaxX: 1550,
        respawnMs: 7200,
      },
    ],
  },
  [MapId.EmberMine]: {
    id: MapId.EmberMine,
    topLevelRegion: "dungeonCircuit",
    name: "잿불 광산",
    recommendedLevelRange: [100, 139],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.EmberMine,
    backgroundLayers: [
      {
        key: MapAssetKey.EmberMine,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromCoral: { x: 150, y: 610 },
      fromLibrary: { x: 1760, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 430, y: 450, width: 360, height: 24, oneWay: true },
      { x: 970, y: 320, width: 480, height: 24, oneWay: true },
      { x: 1550, y: 450, width: 420, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "ember-mine-coral-temple",
        label: "산호 신전",
        x: 105,
        y: 610,
        targetMap: MapId.SunkenCoralTemple,
        targetSpawn: "fromEmber",
      },
      {
        id: "ember-mine-library",
        label: "달빛 서고",
        x: 1815,
        y: 610,
        targetMap: MapId.MoonlitArcaneLibrary,
        targetSpawn: "fromEmber",
      },
    ],
    climbables: [
      {
        id: "ember-mine-rope",
        kind: "rope",
        x: 300,
        top: 448,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "ember-golem-1",
        kind: "emberGolem",
        x: 520,
        y: 610,
        patrolMinX: 300,
        patrolMaxX: 720,
        respawnMs: 9000,
      },
      {
        id: "ember-golem-2",
        kind: "emberGolem",
        x: 430,
        y: 438,
        patrolMinX: 320,
        patrolMaxX: 540,
        respawnMs: 9000,
      },
      {
        id: "ember-golem-3",
        kind: "emberGolem",
        x: 970,
        y: 308,
        patrolMinX: 800,
        patrolMaxX: 1140,
        respawnMs: 9000,
      },
      {
        id: "ember-golem-4",
        kind: "emberGolem",
        x: 1550,
        y: 438,
        patrolMinX: 1400,
        patrolMaxX: 1700,
        respawnMs: 9000,
      },
      {
        id: "ember-warden-boss",
        kind: "emberWarden",
        x: 1280,
        y: 610,
        patrolMinX: 1180,
        patrolMaxX: 1460,
        respawnMs: 45_000,
      },
    ],
  },
  [MapId.MoonlitArcaneLibrary]: {
    id: MapId.MoonlitArcaneLibrary,
    topLevelRegion: "dungeonCircuit",
    name: "달빛 마도서고",
    recommendedLevelRange: [140, 199],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.MoonlitArcaneLibrary,
    backgroundLayers: [
      {
        key: MapAssetKey.MoonlitArcaneLibrary,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromEmber: { x: 150, y: 610 },
      fromCity: { x: 1760, y: 610 },
      fromDuelGround: { x: 1550, y: 218 },
    },
    platforms: [
      ground(1920, 610),
      { x: 470, y: 480, width: 430, height: 24, oneWay: true },
      { x: 1010, y: 350, width: 430, height: 24, oneWay: true },
      { x: 1550, y: 230, width: 430, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "library-ember-mine",
        label: "잿불 광산",
        x: 105,
        y: 610,
        targetMap: MapId.EmberMine,
        targetSpawn: "fromLibrary",
      },
      {
        id: "library-city",
        label: "커닝시티",
        x: 1815,
        y: 610,
        targetMap: MapId.KerningCity,
        targetSpawn: "fromLibrary",
      },
      {
        id: "library-duel-ground",
        label: "무한의 결투장",
        x: 1550,
        y: 230,
        targetMap: MapId.InfiniteDuelGround,
        targetSpawn: "fromLibrary",
      },
    ],
    climbables: [
      {
        id: "library-rope",
        kind: "rope",
        x: 300,
        top: 478,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "library-golem-1",
        kind: "arcaneGolem",
        x: 520,
        y: 610,
        patrolMinX: 320,
        patrolMaxX: 720,
        respawnMs: 12_000,
      },
      {
        id: "library-golem-2",
        kind: "arcaneGolem",
        x: 470,
        y: 468,
        patrolMinX: 310,
        patrolMaxX: 630,
        respawnMs: 12_000,
      },
      {
        id: "library-golem-3",
        kind: "arcaneGolem",
        x: 1010,
        y: 338,
        patrolMinX: 850,
        patrolMaxX: 1170,
        respawnMs: 12_000,
      },
      {
        id: "library-golem-4",
        kind: "arcaneGolem",
        x: 1430,
        y: 218,
        patrolMinX: 1340,
        patrolMaxX: 1480,
        respawnMs: 12_000,
      },
      {
        id: "eclipse-archivist-boss",
        kind: "eclipseArchivist",
        x: 1350,
        y: 610,
        patrolMinX: 1200,
        patrolMaxX: 1650,
        respawnMs: 90_000,
      },
    ],
  },
  [MapId.InfiniteDuelGround]: {
    id: MapId.InfiniteDuelGround,
    topLevelRegion: "dungeonCircuit",
    name: "무한의 결투장",
    recommendedLevelRange: [200, 200],
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.InfiniteDuelGround,
    backgroundLayers: [
      {
        key: MapAssetKey.InfiniteDuelGround,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 720,
    spawnPoints: {
      fromLibrary: { x: 180, y: 610 },
    },
    platforms: [
      ground(1920, 610),
      { x: 480, y: 470, width: 360, height: 24, oneWay: true },
      { x: 980, y: 460, width: 420, height: 24, oneWay: true },
      { x: 1520, y: 470, width: 360, height: 24, oneWay: true },
      { x: 690, y: 310, width: 360, height: 24, oneWay: true },
      { x: 1310, y: 300, width: 420, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "duel-ground-library",
        label: "달빛 마도서고",
        x: 105,
        y: 610,
        targetMap: MapId.MoonlitArcaneLibrary,
        targetSpawn: "fromDuelGround",
      },
    ],
    climbables: [
      {
        id: "duel-ground-rope",
        kind: "rope",
        x: 350,
        top: 468,
        bottom: 610,
        width: 14,
      },
    ],
    npcs: [],
    monsters: [
      {
        id: "one-punch-man-boss",
        kind: "onePunchMan",
        x: 1_100,
        y: 610,
        patrolMinX: 950,
        patrolMaxX: 1_650,
        respawnMs: 300_000,
      },
    ],
  },
  [MapId.PatienceForest]: {
    id: MapId.PatienceForest,
    topLevelRegion: "greenMushroomCave",
    name: "인내의 숲",
    recommendedLevelRange: null,
    bgm: AudioAssetKey.GameTheme,
    objectTheme: MapObjectTheme.PatienceForest,
    backgroundLayers: [
      {
        key: MapAssetKey.PatienceForest,
        depth: -140,
        scrollFactor: 0,
        sizing: "viewport",
      },
    ],
    width: 1920,
    height: 1440,
    spawnPoints: {
      fromCave: { x: 160, y: 1330 },
    },
    platforms: [
      ground(1920, 1330),
      { x: 250, y: 1232, width: 105, height: 24, oneWay: true },
      { x: 410, y: 1162, width: 90, height: 24, oneWay: true },
      { x: 570, y: 1222, width: 80, height: 24, oneWay: true },
      { x: 730, y: 1122, width: 84, height: 24, oneWay: true },
      { x: 890, y: 1042, width: 78, height: 24, oneWay: true },
      { x: 1050, y: 1112, width: 82, height: 24, oneWay: true },
      { x: 1210, y: 1012, width: 78, height: 24, oneWay: true },
      { x: 1370, y: 922, width: 82, height: 24, oneWay: true },
      { x: 1530, y: 992, width: 76, height: 24, oneWay: true },
      { x: 1690, y: 882, width: 92, height: 24, oneWay: true },
      { x: 1690, y: 682, width: 96, height: 24, oneWay: true },
      { x: 1510, y: 602, width: 82, height: 24, oneWay: true },
      { x: 1330, y: 672, width: 76, height: 24, oneWay: true },
      { x: 1150, y: 572, width: 84, height: 24, oneWay: true },
      { x: 970, y: 482, width: 80, height: 24, oneWay: true },
      { x: 830, y: 322, width: 100, height: 24, oneWay: true },
      { x: 650, y: 242, width: 80, height: 24, oneWay: true },
      { x: 470, y: 312, width: 76, height: 24, oneWay: true },
      { x: 300, y: 212, width: 84, height: 24, oneWay: true },
      { x: 180, y: 132, width: 110, height: 24, oneWay: true },
    ],
    portals: [
      {
        id: "patience-forest-cave",
        label: "초록버섯굴",
        x: 105,
        y: 1330,
        targetMap: MapId.GreenMushroomCave,
        targetSpawn: "fromPatienceForest",
      },
      {
        id: "patience-forest-summit",
        label: "정상 보상·초록버섯굴",
        x: 180,
        y: 132,
        targetMap: MapId.GreenMushroomCave,
        targetSpawn: "fromPatienceForest",
      },
    ],
    npcs: [],
    monsters: [],
    climbables: [
      {
        id: "patience-rope-entry",
        kind: "rope",
        x: 250,
        top: 1230,
        bottom: 1330,
        width: 14,
      },
      {
        id: "patience-rope-lower",
        kind: "rope",
        x: 1770,
        top: 680,
        bottom: 900,
        width: 14,
      },
      {
        id: "patience-rope-middle",
        kind: "rope",
        x: 830,
        top: 320,
        bottom: 510,
        width: 14,
      },
      {
        id: "patience-rope-summit",
        kind: "rope",
        x: 180,
        top: 130,
        bottom: 240,
        width: 14,
      },
    ],
    hazards: [
      {
        id: "patience-log-1",
        kind: "swingingLog",
        x: 650,
        y: 1170,
        width: 76,
        height: 28,
        motion: { axis: "x", distance: 95, periodMs: 1900, phaseMs: 0 },
      },
      {
        id: "patience-thorn-1",
        kind: "thornOrb",
        x: 980,
        y: 1060,
        width: 38,
        height: 38,
        motion: { axis: "y", distance: 82, periodMs: 1700, phaseMs: 340 },
      },
      {
        id: "patience-acorn-1",
        kind: "fallingAcorn",
        x: 1290,
        y: 965,
        width: 34,
        height: 46,
        motion: { axis: "y", distance: 105, periodMs: 2100, phaseMs: 760 },
      },
      {
        id: "patience-thorn-2",
        kind: "thornOrb",
        x: 1590,
        y: 900,
        width: 40,
        height: 40,
        motion: { axis: "x", distance: 92, periodMs: 1600, phaseMs: 210 },
      },
      {
        id: "patience-log-2",
        kind: "swingingLog",
        x: 1570,
        y: 720,
        width: 82,
        height: 28,
        motion: { axis: "x", distance: 110, periodMs: 2000, phaseMs: 900 },
      },
      {
        id: "patience-acorn-2",
        kind: "fallingAcorn",
        x: 1260,
        y: 610,
        width: 36,
        height: 48,
        motion: { axis: "y", distance: 92, periodMs: 1850, phaseMs: 450 },
      },
      {
        id: "patience-log-3",
        kind: "swingingLog",
        x: 960,
        y: 520,
        width: 74,
        height: 26,
        motion: { axis: "x", distance: 88, periodMs: 1500, phaseMs: 180 },
      },
      {
        id: "patience-thorn-3",
        kind: "thornOrb",
        x: 620,
        y: 375,
        width: 38,
        height: 38,
        motion: { axis: "y", distance: 70, periodMs: 1450, phaseMs: 620 },
      },
      {
        id: "patience-thorn-4",
        kind: "thornOrb",
        x: 400,
        y: 245,
        width: 36,
        height: 36,
        motion: { axis: "x", distance: 78, periodMs: 1350, phaseMs: 360 },
      },
      {
        id: "patience-acorn-3",
        kind: "fallingAcorn",
        x: 230,
        y: 150,
        width: 34,
        height: 46,
        motion: { axis: "y", distance: 62, periodMs: 1250, phaseMs: 130 },
      },
    ],
  },
};

export function portalDestination(
  mapId: MapId,
  portalId: string,
): PortalDefinition {
  const portal = MAP_DEFINITIONS[mapId].portals.find(
    (candidate) => candidate.id === portalId,
  );
  if (!portal) {
    throw new Error(`Unknown portal ${portalId} in ${mapId}.`);
  }
  return portal;
}

export function spawnPoint(mapId: MapId, spawnId: string): Point {
  const point = MAP_DEFINITIONS[mapId].spawnPoints[spawnId];
  if (!point) {
    throw new Error(`Unknown spawn ${spawnId} in ${mapId}.`);
  }
  return point;
}
