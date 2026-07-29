import { describe, expect, it } from "vitest";
import { AudioAssetKey } from "../assets/audio-assets";
import { MONSTER_CATALOG, type MonsterKind } from "../data/catalog";
import {
  MAP_DEFINITIONS,
  MapId,
  portalDestination,
  spawnPoint,
} from "./map-definitions";

describe("map definitions", () => {
  it("assigns ordered hunting level bands and matching regional monsters", () => {
    const huntingRoute = [
      [MapId.GreenMushroomCave, [10, 29], { greenMushroom: 4 }],
      [MapId.CrystalAntNest, [30, 49], { crystalSentinel: 4 }],
      [MapId.ClockworkTower, [50, 69], { clockworkSentinel: 4 }],
      [MapId.SunkenCoralTemple, [70, 99], { coralGolem: 4 }],
      [MapId.EmberMine, [100, 139], { emberGolem: 4 }],
      [MapId.MoonlitArcaneLibrary, [140, 199], { arcaneGolem: 4 }],
    ] as const;

    for (const [mapId, range, expectedKinds] of huntingRoute) {
      const definition = MAP_DEFINITIONS[mapId];
      expect(definition.recommendedLevelRange).toEqual(range);
      const counts = definition.monsters
        .filter(({ kind }) => MONSTER_CATALOG[kind].bossRank === "normal")
        .reduce<Partial<Record<MonsterKind, number>>>(
          (result, { kind }) => ({
            ...result,
            [kind]: (result[kind] ?? 0) + 1,
          }),
          {},
        );
      expect(counts).toEqual(expectedKinds);
    }
    expect(
      MAP_DEFINITIONS[MapId.InfiniteDuelGround].recommendedLevelRange,
    ).toEqual([200, 200]);
  });

  it("replaces mechanical hunting silhouettes with organic monster families", () => {
    const organicSheets = new Set([
      "greenMushroom",
      "plagueZombie",
      "moonWolf",
      "ancientTreant",
    ]);
    const routeMonsters = [
      MapId.GreenMushroomCave,
      MapId.CrystalAntNest,
      MapId.ClockworkTower,
      MapId.SunkenCoralTemple,
      MapId.EmberMine,
      MapId.MoonlitArcaneLibrary,
    ].flatMap((mapId) => MAP_DEFINITIONS[mapId].monsters);

    expect(
      routeMonsters.filter(({ kind }) =>
        organicSheets.has(MONSTER_CATALOG[kind].spriteSheet),
      ),
    ).toHaveLength(24);
    expect(
      new Set(
        routeMonsters
          .filter(({ kind }) => MONSTER_CATALOG[kind].bossRank === "normal")
          .map(({ kind }) => MONSTER_CATALOG[kind].spriteSheet),
      ),
    ).toEqual(organicSheets);
    for (const mapId of [
      MapId.CrystalAntNest,
      MapId.ClockworkTower,
      MapId.SunkenCoralTemple,
      MapId.EmberMine,
      MapId.MoonlitArcaneLibrary,
    ]) {
      expect(
        MAP_DEFINITIONS[mapId].monsters
          .filter(({ kind }) => MONSTER_CATALOG[kind].bossRank === "normal")
          .every(({ kind }) =>
            organicSheets.has(MONSTER_CATALOG[kind].spriteSheet),
          ),
      ).toBe(true);
    }
  });

  it("contains the two original regions and the six-map dungeon circuit", () => {
    const regions = new Set(
      Object.values(MAP_DEFINITIONS).map(
        (definition) => definition.topLevelRegion,
      ),
    );
    expect([...regions].sort()).toEqual([
      "dungeonCircuit",
      "greenMushroomCave",
      "kerningCity",
    ]);
  });

  it("keeps the shadow hideout inside Kerning City", () => {
    expect(MAP_DEFINITIONS[MapId.ShadowHideout].topLevelRegion).toBe(
      "kerningCity",
    );
    expect(MAP_DEFINITIONS[MapId.ShadowHideout].npcs).toContainEqual(
      expect.objectContaining({ id: "darkLord" }),
    );
  });

  it("connects the gated Shadow Trial dungeon to the hideout", () => {
    const entrance = portalDestination(
      MapId.ShadowHideout,
      "hideout-shadow-trial",
    );
    expect(entrance).toMatchObject({
      targetMap: MapId.ShadowTrialDungeon,
      access: { kind: "active-job-quest" },
    });
    expect(entrance.access?.questIds).toEqual([
      "rogueTrial",
      "assassinTrial",
      "hermitTrial",
      "hokageTrial",
    ]);
    expect(
      portalDestination(MapId.ShadowTrialDungeon, "shadow-trial-hideout")
        .targetMap,
    ).toBe(MapId.ShadowHideout);
    expect(MAP_DEFINITIONS[MapId.ShadowTrialDungeon].topLevelRegion).toBe(
      "kerningCity",
    );
  });

  it("assigns the shared game BGM to every map", () => {
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      expect(definition.bgm).toBe(AudioAssetKey.GameTheme);
    }
  });

  it("places a full-recovery NPC in Kerning City", () => {
    const healer = MAP_DEFINITIONS[MapId.KerningCity].npcs.find(
      (npc) => npc.id === "streetHealer",
    );

    expect(healer).toMatchObject({
      id: "streetHealer",
      interaction: "fullRecovery",
      spriteSheet: "streetHealer",
    });
    expect(healer).not.toHaveProperty("tint");
  });

  it("places the Experience Book merchant in Kerning City", () => {
    const merchant = MAP_DEFINITIONS[MapId.KerningCity].npcs.find(
      (npc) => npc.id === "bookMerchant",
    );

    expect(merchant).toMatchObject({
      id: "bookMerchant",
      label: "서적상 레오",
      interaction: "shop",
      spriteSheet: "streetHealer",
    });
  });

  it("marks the Kerning City Moonlit Library portal as a mid-boss reward", () => {
    expect(portalDestination(MapId.KerningCity, "city-library")).toMatchObject({
      targetMap: MapId.MoonlitArcaneLibrary,
      requiresDungeonMidBossDefeat: true,
    });
  });

  it("places the dungeon expedition quest giver away from portal interaction ranges", () => {
    const scout = MAP_DEFINITIONS[MapId.KerningCity].npcs.find(
      (npc) => npc.id === "dungeonScout",
    );
    expect(scout).toMatchObject({
      label: "원정대장 세라",
      interaction: "bossQuest",
      spriteSheet: "dungeonScout",
    });
    for (const portal of MAP_DEFINITIONS[MapId.KerningCity].portals) {
      expect(Math.abs((scout?.x ?? 0) - portal.x)).toBeGreaterThan(105);
    }
  });

  it("places the game developer promo NPC away from every town interaction", () => {
    const city = MAP_DEFINITIONS[MapId.KerningCity];
    const developer = city.npcs.find((npc) => npc.id === "gameDeveloper");

    expect(developer).toMatchObject({
      label: "일용직 개발자 임상진",
      interaction: "developerPromo",
      spriteSheet: "gameDeveloper",
      x: 650,
      y: 620,
    });
    for (const portal of city.portals) {
      expect(Math.abs((developer?.x ?? 0) - portal.x)).toBeGreaterThan(105);
    }
    for (const npc of city.npcs.filter(({ id }) => id !== "gameDeveloper")) {
      expect(Math.abs((developer?.x ?? 0) - npc.x)).toBeGreaterThan(105);
    }
  });

  it("places Dua sitting alone in Kerning City away from every interaction", () => {
    const city = MAP_DEFINITIONS[MapId.KerningCity];
    const dua = city.npcs.find((npc) => npc.id === "dua");

    expect(dua).toMatchObject({
      label: "두아",
      interaction: "petAdoption",
      spriteSheet: "duaPet",
      x: 430,
      y: 620,
    });
    for (const portal of city.portals) {
      expect(Math.abs((dua?.x ?? 0) - portal.x)).toBeGreaterThan(105);
    }
    for (const npc of city.npcs.filter(({ id }) => id !== "dua")) {
      expect(Math.abs((dua?.x ?? 0) - npc.x)).toBeGreaterThan(105);
    }
  });

  it("connects every portal to a valid destination spawn", () => {
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      for (const portal of definition.portals) {
        expect(() =>
          spawnPoint(portal.targetMap, portal.targetSpawn),
        ).not.toThrow();
      }
    }
  });

  it("keeps background layers ordered and within the parallax contract", () => {
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      expect(definition.backgroundLayers.length).toBeGreaterThan(0);
      const depths = definition.backgroundLayers.map((layer) => layer.depth);
      expect(depths).toEqual([...depths].sort((a, b) => a - b));
      for (const layer of definition.backgroundLayers) {
        expect(layer.scrollFactor).toBeGreaterThanOrEqual(0);
        expect(layer.scrollFactor).toBeLessThanOrEqual(1);
      }
    }

    const cityLayers = MAP_DEFINITIONS[MapId.KerningCity].backgroundLayers;
    expect(cityLayers).toHaveLength(2);
    expect(cityLayers.map((layer) => layer.scrollFactor)).toEqual([0, 0.55]);
    expect(cityLayers.at(-1)).toMatchObject({
      sizing: "world",
      scrollFactor: 0.55,
    });

    const caveLayers =
      MAP_DEFINITIONS[MapId.GreenMushroomCave].backgroundLayers;
    expect(caveLayers).toHaveLength(2);
    expect(caveLayers.map((layer) => layer.scrollFactor)).toEqual([0, 0.38]);
    expect(caveLayers[0]).toMatchObject({
      sizing: "viewport",
      scrollFactor: 0,
    });
    expect(caveLayers.at(-1)).toMatchObject({
      sizing: "world",
      scrollFactor: 0.38,
    });

    expect(
      new Set(
        Object.values(MAP_DEFINITIONS).map(({ objectTheme }) => objectTheme),
      ).size,
    ).toBe(11);
  });

  it("supports the required town and cave round trip", () => {
    expect(portalDestination(MapId.KerningCity, "city-cave").targetMap).toBe(
      MapId.GreenMushroomCave,
    );
    expect(
      portalDestination(MapId.GreenMushroomCave, "cave-city-ground").targetMap,
    ).toBe(MapId.KerningCity);
  });

  it("places an easy two-jump helper platform below the Crystal Ant Nest portal", () => {
    const platforms = MAP_DEFINITIONS[MapId.GreenMushroomCave].platforms;
    const platformTop = (platform: (typeof platforms)[number]): number =>
      platform.y - platform.height / 2;
    const groundPlatform = platforms.find(({ oneWay }) => !oneWay);
    const helperPlatform = platforms.find(
      ({ x, y, width, oneWay }) =>
        oneWay && x === 880 && y === 486 && width === 300,
    );
    const portalPlatform = platforms.find(
      ({ x, y, width, oneWay }) =>
        oneWay && x === 730 && y === 350 && width === 500,
    );

    expect(groundPlatform).toBeDefined();
    expect(helperPlatform).toBeDefined();
    expect(portalPlatform).toBeDefined();
    expect(
      platformTop(groundPlatform!) - platformTop(helperPlatform!),
    ).toBeLessThanOrEqual(140);
    expect(
      platformTop(helperPlatform!) - platformTop(portalPlatform!),
    ).toBeLessThanOrEqual(140);
    expect(helperPlatform!.x - helperPlatform!.width / 2).toBeLessThan(
      portalPlatform!.x + portalPlatform!.width / 2,
    );
    expect(helperPlatform!.x + helperPlatform!.width / 2).toBeGreaterThan(
      portalPlatform!.x - portalPlatform!.width / 2,
    );
  });

  it("connects the Green Mushroom Cave and Patience Forest challenge route", () => {
    expect(
      portalDestination(MapId.GreenMushroomCave, "cave-patience-forest")
        .targetMap,
    ).toBe(MapId.PatienceForest);
    expect(
      portalDestination(MapId.PatienceForest, "patience-forest-cave").targetMap,
    ).toBe(MapId.GreenMushroomCave);
    expect(
      portalDestination(MapId.PatienceForest, "patience-forest-summit")
        .targetMap,
    ).toBe(MapId.GreenMushroomCave);
    expect(MAP_DEFINITIONS[MapId.PatienceForest]).toMatchObject({
      name: "인내의 숲",
      npcs: [],
      monsters: [],
    });
    expect(MAP_DEFINITIONS[MapId.PatienceForest]).toMatchObject({
      width: 1920,
      height: 1440,
    });
    expect(MAP_DEFINITIONS[MapId.PatienceForest].platforms).toHaveLength(21);
    expect(
      MAP_DEFINITIONS[MapId.PatienceForest].platforms.filter(
        ({ oneWay }) => oneWay,
      ),
    ).toHaveLength(20);
    expect(MAP_DEFINITIONS[MapId.PatienceForest].climbables).toHaveLength(4);
    expect(MAP_DEFINITIONS[MapId.PatienceForest].climbables).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "patience-rope-middle",
          kind: "rope",
          width: 14,
        }),
      ]),
    );
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      for (const climbable of definition.climbables ?? []) {
        expect(climbable.kind).toBe("rope");
      }
    }
    expect(MAP_DEFINITIONS[MapId.PatienceForest].hazards).toHaveLength(10);
  });

  it("connects all six dungeons and the final-boss arena", () => {
    const route = [
      [MapId.GreenMushroomCave, "cave-ant-nest", MapId.CrystalAntNest],
      [MapId.CrystalAntNest, "ant-nest-clockwork", MapId.ClockworkTower],
      [MapId.ClockworkTower, "clockwork-coral-temple", MapId.SunkenCoralTemple],
      [MapId.SunkenCoralTemple, "coral-temple-ember-mine", MapId.EmberMine],
      [MapId.EmberMine, "ember-mine-library", MapId.MoonlitArcaneLibrary],
      [
        MapId.MoonlitArcaneLibrary,
        "library-duel-ground",
        MapId.InfiniteDuelGround,
      ],
      [
        MapId.InfiniteDuelGround,
        "duel-ground-library",
        MapId.MoonlitArcaneLibrary,
      ],
      [MapId.MoonlitArcaneLibrary, "library-city", MapId.KerningCity],
    ] as const;

    for (const [mapId, portalId, targetMap] of route) {
      expect(portalDestination(mapId, portalId).targetMap).toBe(targetMap);
    }
    expect(
      Object.values(MAP_DEFINITIONS).filter(
        ({ topLevelRegion }) => topLevelRegion === "dungeonCircuit",
      ),
    ).toHaveLength(6);
  });

  it("adds a ground-to-platform rope to every existing dungeon", () => {
    for (const mapId of [
      MapId.ShadowTrialDungeon,
      MapId.CrystalAntNest,
      MapId.ClockworkTower,
      MapId.SunkenCoralTemple,
      MapId.EmberMine,
      MapId.MoonlitArcaneLibrary,
      MapId.InfiniteDuelGround,
    ]) {
      const definition = MAP_DEFINITIONS[mapId];
      expect(definition.climbables).toHaveLength(1);
      expect(definition.climbables?.[0]).toMatchObject({
        kind: "rope",
        bottom: 610,
        width: 14,
      });
      expect(definition.climbables?.[0]?.top).toBeLessThan(610);
    }
  });

  it("keeps valid monster patrols in hunting grounds and the dungeon", () => {
    expect(MAP_DEFINITIONS[MapId.KerningCity].monsters).toHaveLength(0);
    expect(MAP_DEFINITIONS[MapId.ShadowHideout].monsters).toHaveLength(0);
    const monsters = MAP_DEFINITIONS[MapId.GreenMushroomCave].monsters;
    expect(monsters.length).toBeGreaterThan(0);
    for (const monster of monsters) {
      expect(monster.patrolMinX).toBeLessThan(monster.x);
      expect(monster.x).toBeLessThan(monster.patrolMaxX);
      expect(monster.respawnMs).toBeGreaterThan(0);
    }
    const dungeonMonsters = MAP_DEFINITIONS[MapId.ShadowTrialDungeon].monsters;
    expect(
      dungeonMonsters.filter(({ kind }) => kind === "shadowSentinel"),
    ).toHaveLength(3);
    expect(
      dungeonMonsters.filter(({ kind }) => kind === "abyssGolem"),
    ).toHaveLength(1);
    for (const monster of dungeonMonsters) {
      expect(monster.patrolMinX).toBeLessThan(monster.x);
      expect(monster.x).toBeLessThan(monster.patrolMaxX);
      expect(monster.respawnMs).toBeGreaterThan(0);
    }
    for (const mapId of [
      MapId.CrystalAntNest,
      MapId.ClockworkTower,
      MapId.SunkenCoralTemple,
      MapId.EmberMine,
      MapId.MoonlitArcaneLibrary,
    ]) {
      expect(MAP_DEFINITIONS[mapId].monsters.length).toBeGreaterThanOrEqual(4);
    }
    expect(MAP_DEFINITIONS[MapId.EmberMine].monsters).toContainEqual(
      expect.objectContaining({ kind: "emberWarden" }),
    );
    expect(MAP_DEFINITIONS[MapId.MoonlitArcaneLibrary].monsters).toContainEqual(
      expect.objectContaining({ kind: "eclipseArchivist" }),
    );
    expect(MAP_DEFINITIONS[MapId.InfiniteDuelGround]).toMatchObject({
      name: "무한의 결투장",
      npcs: [],
      monsters: [expect.objectContaining({ kind: "onePunchMan" })],
    });
    const duelPlatforms = MAP_DEFINITIONS[MapId.InfiniteDuelGround].platforms;
    expect(duelPlatforms).toHaveLength(6);
    expect(duelPlatforms.filter(({ oneWay }) => oneWay)).toHaveLength(5);
    expect(
      duelPlatforms
        .filter(({ oneWay }) => oneWay)
        .map(({ y, height }) => y - height / 2),
    ).toEqual([458, 448, 458, 298, 288]);
    expect(
      Object.values(MAP_DEFINITIONS)
        .flatMap(({ monsters: mapMonsters }) => mapMonsters)
        .filter(({ kind }) => kind === "emberWarden"),
    ).toHaveLength(1);
    expect(
      Object.values(MAP_DEFINITIONS)
        .flatMap(({ monsters: mapMonsters }) => mapMonsters)
        .filter(({ kind }) => kind === "eclipseArchivist"),
    ).toHaveLength(1);
    expect(
      Object.values(MAP_DEFINITIONS)
        .flatMap(({ monsters: mapMonsters }) => mapMonsters)
        .filter(({ kind }) => kind === "onePunchMan"),
    ).toHaveLength(1);
  });

  it("grounds every monster patrol on a matching collision platform", () => {
    const unsupportedPatrols: string[] = [];
    for (const definition of Object.values(MAP_DEFINITIONS)) {
      for (const monster of definition.monsters) {
        const supportingPlatform = definition.platforms.find((platform) => {
          const platformTop = platform.y - platform.height / 2;
          const platformLeft = platform.x - platform.width / 2;
          const platformRight = platform.x + platform.width / 2;
          return (
            platformTop === monster.y &&
            platformLeft <= monster.patrolMinX &&
            platformRight >= monster.patrolMaxX
          );
        });

        if (!supportingPlatform) {
          unsupportedPatrols.push(`${definition.id}:${monster.id}`);
        }
      }
    }
    expect(unsupportedPatrols).toEqual([]);
  });
});
