import manifestJson from "../../../assets/sprites/sprite-manifest.json";
import { describe, expect, it } from "vitest";
import { validateSpriteManifest } from "./manifest-validation";
import { runtimeSpriteSheets } from "./runtime-assets";
import { runtimeUiAssets, UiAssetKey } from "./ui-assets";
import {
  MapObjectTheme,
  mapPlatformVisualTopY,
  mapPortalEffectFrame,
  runtimeMapAssets,
} from "./map-assets";
import { runtimeCombatAssets } from "./combat-assets";
import { ACTIVE_SKILL_ORDER } from "../skills/skill-rules";

describe("sprite manifest", () => {
  it("matches the fixed P0 sprite contract", () => {
    const manifest = validateSpriteManifest(manifestJson);

    expect(manifest.schemaVersion).toBe(1);
    expect(manifest.sheetDefaults).toMatchObject({
      width: 512,
      height: 512,
      columns: 4,
      rows: 4,
      frameWidth: 128,
      frameHeight: 128,
    });
    expect(Object.keys(manifest.sheets)).toEqual(
      expect.arrayContaining([
        "player",
        "playerRogue",
        "playerAssassin",
        "playerHermit",
        "playerHokage",
        "hokageEffects",
        "hokageAllies",
        "throwingStars",
        "greenMushroom",
        "shadowSentinel",
        "abyssGolem",
        "plagueZombie",
        "moonWolf",
        "ancientTreant",
        "emberWarden",
        "eclipseArchivist",
        "onePunchMan",
        "dungeonScout",
        "shadowMentor",
        "streetHealer",
        "gameDeveloper",
        "duaPet",
        "combatEffects",
        "worldEffectsLoot",
      ]),
    );
  });

  it("resolves every runtime image through Vite", () => {
    expect(runtimeSpriteSheets).toHaveLength(24);
    for (const sheet of runtimeSpriteSheets) {
      expect(sheet.url).toMatch(/\.webp(?:\?|$)/);
    }
  });

  it("registers distinct zombie, animal, and plant monster sheets", () => {
    const sheets = validateSpriteManifest(manifestJson).sheets;
    for (const [key, filename] of [
      ["plagueZombie", "plague-zombie-v2.webp"],
      ["moonWolf", "moon-wolf-v1.webp"],
      ["ancientTreant", "ancient-treant-v1.webp"],
    ] as const) {
      const sheet = sheets[key];
      if (!sheet) throw new Error(`Missing organic monster sheet: ${key}`);
      expect(sheet.image).toBe(`core/${filename}`);
      expect(Object.keys(sheet.frameOrigins)).toHaveLength(16);
      expect(sheet.animations.idle?.frames).toEqual([0, 1, 2, 3]);
      expect(sheet.animations.walk?.frames).toEqual([4, 5, 6, 7]);
      expect(sheet.animations.hurt?.frames).toEqual([8, 9, 10, 11]);
      expect(sheet.animations.defeat?.frames).toEqual([12, 13, 14, 15]);
    }
  });

  it("registers the game developer NPC conversation and thanks animations", () => {
    const sheet = validateSpriteManifest(manifestJson).sheets.gameDeveloper;
    if (!sheet) throw new Error("Missing gameDeveloper sheet");

    expect(sheet).toMatchObject({
      image: "core/game-developer-v1.webp",
      sourceImage: "source/game-developer-v1-chroma.png",
    });
    expect(Object.keys(sheet.frameOrigins)).toHaveLength(16);
    expect(sheet.animations.idle?.repeat).toBe(-1);
    expect(sheet.animations.talk?.repeat).toBe(-1);
    expect(sheet.animations.code?.repeat).toBe(-1);
    expect(sheet.animations.thanks?.repeat).toBe(0);
  });

  it("registers Dua's grounded pet animation contract", () => {
    const sheet = validateSpriteManifest(manifestJson).sheets.duaPet;
    if (!sheet) throw new Error("Missing duaPet sheet");

    expect(sheet).toMatchObject({
      image: "core/dua-pet-v3.webp",
      sourceImage: "source/dua-pet-v3-chroma.png",
      facing: "right",
      flipForLeft: true,
    });
    expect(Object.keys(sheet.frameOrigins)).toHaveLength(16);
    expect(sheet.animations.idle?.frames).toEqual([0, 1, 2, 3]);
    expect(sheet.animations.idle?.repeat).toBe(-1);
    expect(sheet.animations.run?.frames).toEqual([4, 5, 6, 7]);
    expect(sheet.animations.run?.repeat).toBe(-1);
    expect(sheet.animations.fetch?.frames).toEqual([8, 9, 10, 11]);
    expect(sheet.animations.fetch?.repeat).toBe(0);
    expect(sheet.animations.happy?.frames).toEqual([12, 13, 14, 15]);
    expect(sheet.animations.happy?.repeat).toBe(0);
  });

  it("registers the dedicated street healer sheet and one-shot recovery cast", () => {
    const healerSheet = validateSpriteManifest(manifestJson).sheets.streetHealer;
    if (!healerSheet) throw new Error("Missing streetHealer sheet");

    expect(healerSheet).toMatchObject({
      image: "core/street-healer-v1.webp",
      sourceImage: "source/street-healer-v1-chroma.png",
    });
    expect(Object.keys(healerSheet.frameOrigins)).toHaveLength(16);
    expect(healerSheet.animations.idle?.repeat).toBe(-1);
    expect(healerSheet.animations.cast?.repeat).toBe(0);
  });

  it("registers three boss sheets and the dungeon quest NPC contract", () => {
    const sheets = validateSpriteManifest(manifestJson).sheets;
    expect(sheets.abyssGolem).toMatchObject({
      image: "core/abyss-golem-v3.webp",
      sourceImage: "source/abyss-golem-v1-chroma.png",
    });
    for (const key of ["emberWarden", "eclipseArchivist", "onePunchMan"] as const) {
      const sheet = sheets[key];
      if (!sheet) throw new Error(`Missing boss sheet: ${key}`);
      expect(Object.keys(sheet.frameOrigins)).toHaveLength(16);
      expect(sheet.animations.hurt?.frames).toHaveLength(2);
      expect(sheet.animations.attack?.frames).toHaveLength(2);
      expect(sheet.animations.attack?.repeat).toBe(0);
      expect(sheet.animations.defeat?.frames).toEqual([12, 13, 14, 15]);
    }
    expect(sheets.onePunchMan).toMatchObject({
      image: "core/one-punch-man-v1.webp",
      sourceImage: "source/one-punch-man-v1-chroma.png",
    });

    const scout = sheets.dungeonScout;
    if (!scout) throw new Error("Missing dungeonScout sheet");
    expect(scout).toMatchObject({
      image: "core/dungeon-scout-v1.webp",
      sourceImage: "source/dungeon-scout-v1-chroma.png",
    });
    expect(scout.animations.talk?.repeat).toBe(-1);
    expect(scout.animations.brief?.repeat).toBe(0);
    expect(scout.animations.approve?.repeat).toBe(0);
  });

  it("maps five shop grades and the reward icicle onto the 16-frame projectile sheet", () => {
    const sheet = validateSpriteManifest(manifestJson).sheets.throwingStars;
    if (!sheet) throw new Error("Missing throwingStars sheet");

    expect(sheet.image).toBe("core/equipped-throwing-stars-v1.webp");
    expect(sheet.sourceImage).toBe(
      "source/equipped-throwing-stars-v1-chroma.png",
    );
    expect(sheet.animations.tier1?.frames).toEqual([0, 1, 2]);
    expect(sheet.animations.tier2?.frames).toEqual([3, 4, 5]);
    expect(sheet.animations.tier3?.frames).toEqual([6, 7, 8]);
    expect(sheet.animations.tier4?.frames).toEqual([9, 10, 11]);
    expect(sheet.animations.tier5?.frames).toEqual([12, 13, 14, 15]);
    expect(sheet.animations.tier6?.frames).toEqual([6, 7, 8]);
  });

  it("registers the Hokage player and chakra effect animation contracts", () => {
    const manifest = validateSpriteManifest(manifestJson);
    const player = manifest.sheets.playerHokage;
    const effects = manifest.sheets.hokageEffects;
    if (!player || !effects) throw new Error("Missing Hokage sprite sheets");

    expect(player.image).toBe("core/player-hokage-v5.webp");
    expect(player.sourceImage).toBe("source/player-hokage-v4-chroma.png");
    expect(player.animations.basicAttack?.frames).toEqual([12, 13]);
    expect(player.animations.luckySeven?.frames).toEqual([14, 15]);
    expect(effects.animations.nineTailsAura?.repeat).toBe(-1);
    expect(effects.animations.sageAura?.repeat).toBe(-1);
    expect(effects.animations.tailedBeastBombProjectile?.frames).toEqual([8, 9]);
    expect(effects.animations.tailedBeastBombExplosion?.repeat).toBe(0);
  });

  it("uses the grounded four-step walk cycle for every player advancement sheet", () => {
    const sheets = validateSpriteManifest(manifestJson).sheets;
    for (const [key, filename, version, sourceVersion] of [
      ["player", "player", "v4", "v4"],
      ["playerRogue", "player-rogue", "v4", "v3"],
      ["playerAssassin", "player-assassin", "v4", "v3"],
      ["playerHermit", "player-hermit", "v4", "v3"],
      ["playerHokage", "player-hokage", "v5", "v4"],
    ] as const) {
      const sheet = sheets[key];
      if (!sheet) throw new Error(`Missing player sheet: ${key}`);
      expect(sheet.image).toBe(`core/${filename}-${version}.webp`);
      expect(sheet.sourceImage).toBe(
        `source/${filename}-${sourceVersion}-chroma.png`,
      );
      expect(sheet.animations.walk?.frames).toEqual([4, 5, 6, 7]);
      expect(sheet.animations.walk?.repeat).toBe(-1);
    }
  });

  it("registers the two Hokage allies and their one-shot combat phases", () => {
    const allies = validateSpriteManifest(manifestJson).sheets.hokageAllies;
    if (!allies) throw new Error("Missing hokageAllies sheet");

    expect(allies).toMatchObject({
      image: "core/hokage-allies-v2.webp",
      sourceImage: "source/hokage-allies-v2-chroma.png",
    });
    expect(Object.keys(allies.frameOrigins)).toHaveLength(16);
    expect(allies.animations.shionEnter?.frames).toEqual([0, 1, 2, 3]);
    expect(allies.animations.shionThrow?.frames).toEqual([4, 5]);
    expect(allies.animations.shionExit?.frames).toEqual([6, 7]);
    expect(allies.animations.hanaEnter?.frames).toEqual([8, 9]);
    expect(allies.animations.hanaKick?.frames).toEqual([10, 11]);
    expect(allies.animations.hanaPunch?.frames).toEqual([12, 13]);
    expect(allies.animations.hanaExit?.frames).toEqual([14, 15]);
    for (const animation of Object.values(allies.animations)) {
      expect(animation.repeat).toBe(0);
    }
  });

  it("pins every advanced-job idle frame to one visual body root", () => {
    const manifest = validateSpriteManifest(manifestJson);
    const auditedIdleFrames = {
      playerRogue: {
        faceCentersX: [76, 63, 56, 43],
        visualBottomsY: [109, 109, 109, 109],
      },
      playerAssassin: {
        faceCentersX: [77, 66, 57, 45],
        visualBottomsY: [113, 113, 112, 112],
      },
      playerHermit: {
        faceCentersX: [73, 61, 53, 42],
        visualBottomsY: [114, 113, 114, 113],
      },
      playerHokage: {
        faceCentersX: [82, 70, 63, 47],
        visualBottomsY: [116, 116, 116, 116],
      },
    } as const;

    for (const [sheetKey, audit] of Object.entries(auditedIdleFrames)) {
      const sheet = manifest.sheets[sheetKey];
      if (!sheet) throw new Error(`Missing audited player sheet: ${sheetKey}`);
      const horizontalRootOffsets = audit.faceCentersX.map(
        (faceCenterX, frame) =>
          sheet.frameOrigins[String(frame)]!.x *
            manifest.sheetDefaults.frameWidth -
          faceCenterX,
      );
      const groundedOffsets = audit.visualBottomsY.map(
        (visualBottomY, frame) =>
          sheet.frameOrigins[String(frame)]!.y *
            manifest.sheetDefaults.frameHeight -
          visualBottomY,
      );

      expect(
        Math.max(...horizontalRootOffsets) - Math.min(...horizontalRootOffsets),
      ).toBeLessThanOrEqual(1);
      expect(
        Math.max(...groundedOffsets) - Math.min(...groundedOffsets),
      ).toBeLessThanOrEqual(1);
    }
  });

  it("uses the cleaned and centered loot sprite cells", () => {
    const lootSheet = validateSpriteManifest(manifestJson).sheets.worldEffectsLoot;
    if (!lootSheet) throw new Error("Missing worldEffectsLoot sheet");

    expect(lootSheet.image).toBe("core/world-effects-loot-v2.webp");
    for (let frame = 4; frame < 16; frame += 1) {
      expect(lootSheet.frameOrigins?.[frame]).toEqual({
        x: 0.5,
        y: 0.90625,
      });
    }
  });

  it("resolves the screen backgrounds and UI panels through Vite", () => {
    const screens = runtimeUiAssets.filter((asset) => asset.kind === "screen");
    const panels = runtimeUiAssets.filter((asset) => asset.kind === "panel");
    const generatedHudPanelKeys = new Set<string>([
      UiAssetKey.HudMetalPanel,
      UiAssetKey.HudMetalSurface,
    ]);
    const generatedHudPanels = panels.filter((asset) =>
      generatedHudPanelKeys.has(asset.key),
    );
    const vectorPanels = panels.filter(
      (asset) => !generatedHudPanels.includes(asset),
    );

    expect(screens).toHaveLength(3);
    expect(panels).toHaveLength(5);
    expect(generatedHudPanels).toHaveLength(2);
    expect(vectorPanels).toHaveLength(3);
    for (const asset of screens) expect(asset.url).toMatch(/\.webp(?:\?|$)/);
    for (const asset of generatedHudPanels) {
      expect(asset.url).toMatch(/\.webp(?:\?|$)/);
    }
    for (const asset of vectorPanels) {
      expect(asset.url).toMatch(/^(?:data:image\/svg\+xml|.*\.svg(?:\?|$))/);
    }
    expect(new Set(runtimeUiAssets.map((asset) => asset.key)).size).toBe(
      runtimeUiAssets.length,
    );
  });

  it("preloads the four-frame Hokage cinematic atlas and all action-bar icons", () => {
    const cinematic = runtimeUiAssets.find(
      (asset) => asset.key === "ui:cinematic-hokage",
    );
    const skillIcons = runtimeUiAssets.filter(
      (asset) => asset.kind === "skill-icon",
    );

    expect(cinematic).toMatchObject({
      kind: "cinematic",
      frameWidth: 640,
      frameHeight: 360,
    });
    expect(cinematic?.url).toMatch(/\.webp(?:\?|$)/);
    expect(skillIcons).toHaveLength(ACTIVE_SKILL_ORDER.length);
    expect(skillIcons.map((asset) => asset.skillId)).toEqual(ACTIVE_SKILL_ORDER);
    for (const skillIcon of skillIcons) {
      expect(skillIcon.url).toMatch(/\.webp(?:\?|$)/);
    }
  });

  it("resolves map backdrops, parallax layers, and imagegen object kits through Vite", () => {
    const backdrops = runtimeMapAssets.filter((asset) => asset.kind === "backdrop");
    const layers = runtimeMapAssets.filter((asset) => asset.kind === "layer");
    const objectKits = runtimeMapAssets.filter((asset) => asset.kind === "object-kit");

    expect(backdrops).toHaveLength(11);
    expect(layers).toHaveLength(3);
    expect(objectKits).toHaveLength(4);
    for (const asset of backdrops) expect(asset.url).toMatch(/\.webp(?:\?|$)/);
    for (const asset of layers) {
      expect(asset.url).toMatch(/^(?:data:image\/svg\+xml|.*\.svg(?:\?|$))/);
    }
    for (const asset of objectKits) expect(asset.url).toMatch(/\.webp(?:\?|$)/);
    expect(new Set(runtimeMapAssets.map((asset) => asset.key)).size).toBe(
      runtimeMapAssets.length,
    );
    expect(mapPortalEffectFrame()).toEqual({
      key: "map:object-kits-c",
      frame: "map-object:portal-effect",
    });
  });

  it("aligns every object-kit walking surface with its platform collider", () => {
    const collisionTopY = 610;
    const displayHeight = 110;
    const surfaceFrames = [
      [MapObjectTheme.KerningCity, 0, 61],
      [MapObjectTheme.ShadowHideout, 0, 66],
      [MapObjectTheme.MushroomCave, 16, 74],
      [MapObjectTheme.ShadowTrial, 1, 63],
      [MapObjectTheme.CrystalAntNest, 1, 60],
      [MapObjectTheme.ClockworkTower, 1, 59],
      [MapObjectTheme.SunkenCoralTemple, 4, 62],
      [MapObjectTheme.EmberMine, 2, 60],
      [MapObjectTheme.MoonlitArcaneLibrary, 1, 69],
      [MapObjectTheme.InfiniteDuelGround, 1, 63],
      [MapObjectTheme.PatienceForest, 12, 60],
    ] as const;

    for (const [theme, sourceSurfaceY, sourceFrameHeight] of surfaceFrames) {
      const visualTopY = mapPlatformVisualTopY(
        theme,
        collisionTopY,
        displayHeight,
      );
      const renderedSurfaceOffset =
        (sourceSurfaceY / sourceFrameHeight) * displayHeight;
      expect(visualTopY + renderedSurfaceOffset).toBeCloseTo(collisionTopY);
    }

    expect(
      collisionTopY -
        mapPlatformVisualTopY(
          MapObjectTheme.MushroomCave,
          collisionTopY,
          displayHeight,
        ),
    ).toBeCloseTo(23.78, 1);
  });

  it("resolves the damage-number atlas and punch shockwave through Vite", () => {
    expect(runtimeCombatAssets).toHaveLength(2);
    for (const asset of runtimeCombatAssets) {
      expect(asset.url).toMatch(/^(?:data:image\/svg\+xml|.*\.svg(?:\?|$))/);
    }
    expect(runtimeCombatAssets.map(({ key }) => key)).toContain(
      "onePunchShockwave",
    );
  });

  it("rejects out-of-range animation frames", () => {
    const invalid = structuredClone(manifestJson);
    invalid.sheets.player.animations.idle.frames = [16];
    expect(() => validateSpriteManifest(invalid)).toThrow("out-of-range frame");
  });

  it("validates normalized per-frame origins", () => {
    const manifest = validateSpriteManifest(manifestJson);
    for (const sheet of Object.values(manifest.sheets)) {
      expect(Object.keys(sheet.frameOrigins ?? {})).toHaveLength(16);
    }

    const invalidFrame = structuredClone(manifestJson);
    const frameOrigins = invalidFrame.sheets.player.frameOrigins as Record<
      string,
      { x: number; y: number }
    >;
    frameOrigins["16"] = { x: 0.5, y: 1 };
    expect(() => validateSpriteManifest(invalidFrame)).toThrow("out-of-range frame");

    const invalidOrigin = structuredClone(manifestJson);
    invalidOrigin.sheets.player.frameOrigins["0"] = { x: 1.1, y: 1 };
    expect(() => validateSpriteManifest(invalidOrigin)).toThrow("must be normalized");

    const invalidVerticalOrigin = structuredClone(manifestJson);
    invalidVerticalOrigin.sheets.player.frameOrigins["0"] = { x: 0.5, y: 1.6 };
    expect(() => validateSpriteManifest(invalidVerticalOrigin)).toThrow(
      "supported pivot range",
    );

    const missingOrigin = structuredClone(manifestJson);
    const incompleteOrigins = missingOrigin.sheets.greenMushroom
      .frameOrigins as Record<string, { x: number; y: number }>;
    delete incompleteOrigins["15"];
    expect(() => validateSpriteManifest(missingOrigin)).toThrow(
      "must define every frame",
    );
  });
});
