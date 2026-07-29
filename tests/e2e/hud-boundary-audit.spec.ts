import { expect, test, type Page } from "@playwright/test";

const GAME = "#game";
const CANVAS = "#game canvas";
const PROFILE_KEY = "kerning-shadows.local-profile.v1";

type AuditLocation =
  | "kerningCity"
  | "greenMushroomCave"
  | "moonlitArcaneLibrary"
  | "sunkenCoralTemple";

interface BoundaryProgression {
  level: number;
  job: "hermit" | "hokage";
  activeJobAdvancementQuest: {
    id: "hokageTrial";
    defeated: number;
  } | null;
  dungeonBossStage: "upperboss";
}

const DEFAULT_BOUNDARY_PROGRESSION: BoundaryProgression = {
  level: 120,
  job: "hermit",
  activeJobAdvancementQuest: { id: "hokageTrial", defeated: 7 },
  dungeonBossStage: "upperboss",
};

async function seedBoundaryProfile(
  page: Page,
  location: AuditLocation,
  progression: BoundaryProgression = DEFAULT_BOUNDARY_PROGRESSION,
): Promise<void> {
  await page.evaluate(
    ({ key, nextLocation, nextProgression }) => {
      const maximum = Number.MAX_SAFE_INTEGER;
      window.localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 13,
          character: {
            id: "local-player",
            name: "루키",
            level: nextProgression.level,
            job: nextProgression.job,
            hp: maximum,
            maxHp: maximum,
            mp: maximum,
            maxMp: maximum,
            mesos: maximum,
            stats: {
              str: 10_000,
              dex: 10_000,
              int: 10_000,
              luk: 10_000,
            },
            statPoints: 1_000,
            autoAllocateStats: false,
            skillPoints: 1_000,
            skillLevels: {
              luckySeven: 20,
              shadowVolley: 20,
              keenSight: 20,
              drain: 20,
              phantomStars: 20,
              criticalThrow: 20,
              avenger: 20,
              abyssRain: 20,
              shadowBreathing: 20,
              rasengan: 0,
              nineTailsTransformation: 0,
              tailedBeastBomb: 0,
              teamAssault: 0,
              thunderOrb: 0,
              sageMode: 0,
            },
          },
          location: nextLocation,
          exp: 4_499,
          inventory: {
            recoveryBottle: maximum,
            mushroomCap: maximum,
            experienceBook: maximum,
            emberCore: maximum,
            moonlitCodex: maximum,
          },
          throwingStars: {
            owned: ["tier1", "tier2", "tier3", "tier4", "tier5", "tier6"],
            equipped: "tier6",
          },
          skillHotbar: [
            "luckySeven",
            "shadowVolley",
            "drain",
            "phantomStars",
            "avenger",
            "abyssRain",
            "rasengan",
            "nineTailsTransformation",
            "tailedBeastBomb",
            "teamAssault",
            "thunderOrb",
          ],
          activeJobAdvancementQuest:
            nextProgression.activeJobAdvancementQuest,
          dungeonBossQuest: {
            id: "moonlitSeal",
            stage: nextProgression.dungeonBossStage,
          },
        }),
      );
    },
    {
      key: PROFILE_KEY,
      nextLocation: location,
      nextProgression: progression,
    },
  );
}

async function loginAndStart(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("hud-boundary-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await page.getByTestId("start-game").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "gameplay",
  );
  await page.locator(CANVAS).focus();
  await expect(page.locator(CANVAS)).toBeFocused();
}

async function expectHudPaddingClean(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violation-items",
    "",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
}

test("keeps every HUD text group inside its safe area at persisted numeric limits", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedBoundaryProfile(page, "moonlitArcaneLibrary");
  await page.reload();
  await loginAndStart(page);

  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "moonlitArcaneLibrary",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-kind",
    "eclipseArchivist",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /보스 목표 · Lv\.140 달성 \(120\/140\)[\s\S]*4차 전직 시험 · 그림자 시험장 심연의 골렘 7\/8/,
  );
  await expectHudPaddingClean(page);

  await seedBoundaryProfile(page, "moonlitArcaneLibrary", {
    level: 140,
    job: "hokage",
    activeJobAdvancementQuest: null,
    dungeonBossStage: "upperboss",
  });
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /보스 목표 · 달빛 마도서고 루나시온 처치/,
  );
  await expect(page.locator(CANVAS)).not.toHaveAttribute(
    "aria-label",
    /다음 목표 · 4차 전직/,
  );
  await expectHudPaddingClean(page);

  const gameBounds = await page.locator(GAME).boundingBox();
  expect(gameBounds).not.toBeNull();
  const expandedHeaderCenterY = {
    miniMap: 32,
    quest: 258,
    controls: 32,
  } as const;
  const collapsedHeaderCenterY = {
    miniMap: 24,
    quest: 250,
    controls: 24,
  } as const;

  for (const panel of ["miniMap", "quest", "controls"] as const) {
    const toggle = page.locator(
      `#hud-window-controls [data-hud-panel="${panel}"]`,
    );
    await expect(toggle).toBeVisible();
    const expandedBounds = await toggle.boundingBox();
    expect(expandedBounds).not.toBeNull();
    expect(
      Math.abs(
        expandedBounds!.y +
          expandedBounds!.height / 2 -
          (gameBounds!.y +
            (gameBounds!.height * expandedHeaderCenterY[panel]) / 720),
      ),
    ).toBeLessThan(1.5);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator(CANVAS)).toHaveAttribute(
      `data-hud-${panel}-collapsed`,
      "true",
    );
    const collapsedBounds = await toggle.boundingBox();
    expect(collapsedBounds).not.toBeNull();
    expect(
      Math.abs(
        collapsedBounds!.y +
          collapsedBounds!.height / 2 -
          (gameBounds!.y +
            (gameBounds!.height * collapsedHeaderCenterY[panel]) / 720),
      ),
    ).toBeLessThan(1.5);
    await expectHudPaddingClean(page);
    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(page.locator(CANVAS)).toHaveAttribute(
      `data-hud-${panel}-collapsed`,
      "false",
    );
  }

  await seedBoundaryProfile(page, "sunkenCoralTemple");
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "sunkenCoralTemple",
  );
  await expectHudPaddingClean(page);
});

test("keeps the minimap top-left without opening negative jump camera space", async ({
  page,
}) => {
  await page.goto("/");
  await seedBoundaryProfile(page, "kerningCity");
  await page.reload();
  await loginAndStart(page);

  await expect(page.locator(GAME)).toHaveAttribute("data-active-map", "kerningCity");
  await expect(page.locator(GAME)).toHaveAttribute("data-mini-map-npc-count", "5");
  await expect(page.locator(GAME)).toHaveAttribute("data-mini-map-portal-count", "3");
  await expect(page.locator(GAME)).toHaveAttribute("data-portal-effect-count", "3");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-portal-effect-animated-objects",
    "27",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-portal-effect-animated",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-mini-map-markers-visible",
    "true",
  );
  await expect(page.locator(GAME)).not.toHaveAttribute(
    "data-mini-map-player-marker",
    "none",
  );
  const initialPlayerMarker = await page
    .locator(GAME)
    .getAttribute("data-mini-map-player-marker");
  await page.keyboard.press("ArrowRight", { delay: 500 });
  await expect
    .poll(() => page.locator(GAME).getAttribute("data-mini-map-player-marker"))
    .not.toBe(initialPlayerMarker);

  const miniMapToggle = page.locator(
    '#hud-window-controls [data-hud-panel="miniMap"]',
  );
  await expect(miniMapToggle).toBeVisible();
  await expect(miniMapToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "data-hud-miniMap-collapsed",
    "false",
  );
  await expect(page.locator(GAME)).not.toHaveAttribute(
    "data-camera-top-look-ahead-enabled",
  );
  await expect(page.locator(GAME)).not.toHaveAttribute(
    "data-camera-follow-offset-y",
  );

  const gameBounds = await page.locator(GAME).boundingBox();
  const miniMapToggleBounds = await miniMapToggle.boundingBox();
  expect(gameBounds).not.toBeNull();
  expect(miniMapToggleBounds).not.toBeNull();
  expect(miniMapToggleBounds!.x).toBeLessThan(gameBounds!.x + 320);
  expect(miniMapToggleBounds!.y).toBeLessThan(gameBounds!.y + 64);

  const expandedToggleY = miniMapToggleBounds!.y;
  await miniMapToggle.click();
  await expect(miniMapToggle).toHaveAttribute("aria-expanded", "false");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-mini-map-markers-visible",
    "false",
  );
  const collapsedToggleBounds = await miniMapToggle.boundingBox();
  expect(collapsedToggleBounds).not.toBeNull();
  expect(collapsedToggleBounds!.y).toBeLessThan(expandedToggleY - 6);
  expect(collapsedToggleBounds!.x).toBeCloseTo(miniMapToggleBounds!.x, 1);
  await miniMapToggle.click();
  await expect(miniMapToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-mini-map-markers-visible",
    "true",
  );
  await page.locator(CANVAS).focus();
  await expect(page.locator(CANVAS)).toBeFocused();

  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-player-y")),
    )
    .toBeGreaterThan(630);
  const groundedY = Number(
    await page.locator(GAME).getAttribute("data-player-y"),
  );
  expect(
    Number(await page.locator(GAME).getAttribute("data-camera-scroll-y")),
  ).toBeGreaterThanOrEqual(0);

  await page.keyboard.press("Alt", { delay: 100 });
  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-player-y")),
    )
    .toBeLessThan(groundedY - 30);
  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-camera-scroll-y")),
    )
    .toBeGreaterThanOrEqual(0);

  await expect(miniMapToggle).toBeVisible();
  await expect(miniMapToggle).toHaveAttribute("aria-expanded", "true");
});
