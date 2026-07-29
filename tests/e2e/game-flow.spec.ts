import { expect, test, type Page } from "@playwright/test";

const GAME = "#game";
const CANVAS = "#game canvas";
const REQUIRED_LOOP_RUNS = Number(process.env.QA_LOOP_RUNS ?? 2);

function monitorBrowserFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(`console: ${message.text()}`);
  });
  page.on("requestfailed", (request) => {
    failures.push(
      `requestfailed: ${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`,
    );
  });
  return failures;
}

async function dataNumber(page: Page, name: string): Promise<number> {
  const raw = await page.locator(GAME).getAttribute(`data-${name}`);
  return Number(raw ?? Number.NaN);
}

async function dataText(page: Page, name: string): Promise<string> {
  return (await page.locator(GAME).getAttribute(`data-${name}`)) ?? "";
}

async function expectSkillIconLoaded(
  page: Page,
  skillId: string,
): Promise<void> {
  const icon = page.getByTestId(`skill-icon-${skillId}`);
  await expect(icon).toBeVisible();
  await expect(icon).toHaveAttribute("src", /.+/);
  expect(
    await icon.evaluate(
      (element) => {
        if (!(element instanceof HTMLImageElement)) return false;
        const source = element.currentSrc || element.src;
        return (
          element.complete &&
          element.naturalWidth === 128 &&
          element.naturalHeight === 128 &&
          (source.startsWith("data:image/webp") ||
            /\.webp(?:[?#]|$)/.test(source))
        );
      },
    ),
  ).toBe(true);
}

async function focusGame(page: Page): Promise<void> {
  await page.locator(CANVAS).focus();
  await expect(page.locator(CANVAS)).toBeFocused();
}

async function interact(page: Page): Promise<void> {
  await focusGame(page);
  await page.keyboard.press("ArrowUp", { delay: 80 });
  await page.waitForTimeout(100);
}

async function waitForMap(page: Page, mapId: string): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-active-map", mapId);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-map-timers",
    "0",
  );
}

async function waitForPortalDestination(
  page: Page,
  mapId: string,
  portalId: string,
): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-active-map", mapId);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    `portal:${portalId}:complete`,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-map-timers",
    "0",
  );
  await page.waitForTimeout(500);
}

async function moveToX(
  page: Page,
  targetX: number,
  tolerance = 90,
  dodgeContacts = false,
): Promise<void> {
  for (let correction = 0; correction < 30; correction += 1) {
    await focusGame(page);
    const currentX = await dataNumber(page, "player-x");
    const distance = Math.abs(currentX - targetX);
    if (distance <= tolerance) return;

    const key = currentX < targetX ? "ArrowRight" : "ArrowLeft";
    const holdMs = Math.min(
      600,
      Math.max(80, Math.round(((distance - tolerance / 2) / 260) * 750)),
    );
    if (dodgeContacts) {
      const currentY = await dataNumber(page, "player-y");
      if (currentY > 600) {
        await page.keyboard.press("Alt", { delay: 40 });
      } else {
        // A dodge jump can land on a one-way platform occupied by another
        // monster. Drop through it before the next horizontal correction so
        // the helper cannot spend every retry being knocked back in place.
        await page.keyboard.down("ArrowDown");
        try {
          await page.keyboard.press("Alt", { delay: 40 });
        } finally {
          await page.keyboard.up("ArrowDown");
        }
      }
    }
    await page.keyboard.down(key);
    try {
      await page.waitForTimeout(holdMs);
    } finally {
      await page.keyboard.up(key);
    }
    await page.waitForTimeout(250);
  }
  if (Math.abs((await dataNumber(page, "player-x")) - targetX) <= tolerance) {
    return;
  }
  throw new Error(
    `Could not move player close enough to x=${targetX}; ` +
      `current=(${await dataNumber(page, "player-x")}, ${await dataNumber(page, "player-y")}), ` +
      `effect=${await dataText(page, "milestone-effect")}.`,
  );
}

async function loginAndStart(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "login",
  );
  await page.getByTestId("account-id").fill("qa-player");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("password").press("Enter");
  await expect
    .poll(() => page.locator(GAME).getAttribute("data-active-scene"))
    .toMatch(/character-(create|select)/);
  if (
    (await page.locator(GAME).getAttribute("data-active-scene")) ===
    "character-create"
  ) {
    await page.getByTestId("character-name").fill("테스트도적");
    await page.getByTestId("create-character").click();
  }
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-select",
  );
  await page.getByTestId("start-game").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "gameplay",
  );
}

test("creates a named character with dice stats and restores the name in gameplay", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("new-character-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-create",
  );
  await expect(page.getByTestId("character-create-screen")).toBeVisible();
  await expect(page.getByTestId("character-create-screen")).toContainText(
    "저장된 캐릭터가 없습니다.",
  );
  expect(
    await page.evaluate(() => ({
      profile: window.localStorage.getItem("kerning-shadows.local-profile.v1"),
      slot2: window.localStorage.getItem(
        "kerning-shadows.local-profile.v1.slot-2",
      ),
      slot3: window.localStorage.getItem(
        "kerning-shadows.local-profile.v1.slot-3",
      ),
      activeSlot: window.localStorage.getItem(
        "kerning-shadows.local-profile.v1.active-slot",
      ),
    })),
  ).toEqual({ profile: null, slot2: null, slot3: null, activeSlot: null });

  await page.getByTestId("character-name").fill("한");
  await expect(page.getByTestId("create-character")).toBeDisabled();
  await page.getByTestId("character-name").fill("그림자07");
  await expect(page.getByTestId("character-name-status")).toHaveText(
    "사용할 수 있는 닉네임입니다.",
  );
  await expect(page.getByTestId("create-character")).toBeEnabled();
  await page.getByTestId("roll-stats").click();
  await expect(page.getByTestId("dice-roll-effect")).toHaveClass(/rolling/);
  await expect(page.getByTestId("dice-roll-effect")).toHaveCSS(
    "animation-name",
    "creation-dice-roll",
  );
  await expect(page.getByTestId("roll-stats")).toBeDisabled();
  await expect(page.getByTestId("create-character")).toBeDisabled();
  await expect(page.getByTestId("roll-stats")).toBeEnabled();
  await expect(page.getByTestId("dice-roll-effect")).not.toHaveClass(/rolling/);

  const rolledStats = await Promise.all(
    (["str", "dex", "int", "luk"] as const).map(async (stat) =>
      Number(await page.getByTestId(`creation-stat-${stat}`).textContent()),
    ),
  );
  expect(rolledStats.reduce((sum, value) => sum + value, 0)).toBe(25);
  expect(Math.min(...rolledStats)).toBeGreaterThanOrEqual(4);
  expect(Math.max(...rolledStats)).toBeLessThanOrEqual(13);

  await page.getByTestId("create-character").click();
  await expect(page.getByTestId("character-slot-1")).toHaveAttribute(
    "aria-label",
    /그림자07/,
  );
  const stored = await page.evaluate(() =>
    JSON.parse(
      window.localStorage.getItem("kerning-shadows.local-profile.v1") ?? "null",
    ),
  );
  expect(stored).toMatchObject({
    schemaVersion: 16,
    character: {
      name: "그림자07",
      level: 9,
      stats: {
        str: rolledStats[0],
        dex: rolledStats[1],
        int: rolledStats[2],
        luk: rolledStats[3],
      },
    },
  });

  await page.getByTestId("start-game").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-name",
    "그림자07",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute("aria-label", /그림자07/);
  const questToggle = page.locator(
    '#hud-window-controls [data-hud-panel="quest"]',
  );
  await expect(questToggle).toBeVisible();
  await expect(questToggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /초보자 목표 · Lv\.10 달성 \(9\/10\)[\s\S]*초록버섯굴에서 몬스터를 사냥하세요\./,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-nameplate-visible",
    "true",
  );
  await expect
    .poll(async () => ({
      deltaX: Math.abs(
        (await dataNumber(page, "player-nameplate-x")) -
          (await dataNumber(page, "player-x")),
      ),
      deltaY:
        (await dataNumber(page, "player-nameplate-y")) -
        (await dataNumber(page, "player-y")),
    }))
    .toEqual({ deltaX: 0, deltaY: -20 });
  expect(failures).toEqual([]);
});

test("opens the game developer channel promo from the Kerning City NPC", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await loginAndStart(page);
  await moveToX(page, 650, 55);
  await interact(page);

  const dialog = page.getByTestId("developer-promo-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("일용직 개발자 임상진");
  await expect(dialog).toContainText("이 게임을 만들고 고치는");
  await expect(dialog).toContainText("큰 힘이 됩니다");

  const subscribe = page.getByTestId("developer-subscribe-link");
  await expect(subscribe).toHaveText("구독하기");
  await expect(subscribe).toHaveAttribute(
    "href",
    "https://www.youtube.com/@limsangjin12",
  );
  await expect(subscribe).toHaveAttribute("target", "_blank");
  await expect(subscribe).toHaveAttribute("rel", "noopener noreferrer");
  await subscribe.evaluate((element) => {
    element.addEventListener("click", (event) => event.preventDefault(), {
      once: true,
    });
    (element as HTMLAnchorElement).click();
  });
  await expect(page.getByTestId("developer-subscribe-thanks")).toBeVisible();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "developer-channel-opened",
  );

  await page.getByTestId("developer-dialog-close").click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(CANVAS)).toBeFocused();
  expect(failures).toEqual([]);
});

test("creates characters in slots 2 and 3 and starts the selected slot", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("multi-slot-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();

  await page.getByTestId("character-name").fill("첫슬롯");
  await page.getByTestId("create-character").click();
  await expect(page.getByTestId("character-slot-1")).toHaveAttribute(
    "aria-label",
    /첫슬롯/,
  );
  await expect(
    page.getByTestId("selected-character-stats").locator("dd").first(),
  ).toHaveCSS("color", "rgb(42, 26, 15)");

  await page.getByTestId("character-slot-2").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-create",
  );
  await expect(page.getByTestId("character-create-screen")).toContainText(
    "슬롯 2",
  );
  await page.getByTestId("character-name").fill("둘슬롯");
  await page.getByTestId("create-character").click();
  await expect(page.getByTestId("character-slot-2")).toHaveAttribute(
    "aria-label",
    /둘슬롯.*선택됨/,
  );

  await page.getByTestId("character-slot-3").click();
  await expect(page.getByTestId("character-create-screen")).toContainText(
    "슬롯 3",
  );
  await page.getByTestId("character-name").fill("셋슬롯");
  await page.getByTestId("create-character").click();
  await expect(page.getByTestId("character-slot-3")).toHaveAttribute(
    "aria-label",
    /셋슬롯.*선택됨/,
  );

  const storedNames = await page.evaluate(() => {
    const baseKey = "kerning-shadows.local-profile.v1";
    return [baseKey, `${baseKey}.slot-2`, `${baseKey}.slot-3`].map((key) => {
      const profile = JSON.parse(
        window.localStorage.getItem(key) ?? "null",
      ) as {
        character?: { name?: string };
      } | null;
      return profile?.character?.name;
    });
  });
  expect(storedNames).toEqual(["첫슬롯", "둘슬롯", "셋슬롯"]);

  await page.getByTestId("character-slot-2").click();
  await expect(page.getByTestId("character-slot-2")).toHaveAttribute(
    "aria-label",
    /둘슬롯.*선택됨/,
  );
  await page.getByTestId("start-game").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-name",
    "둘슬롯",
  );

  await page.reload();
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("multi-slot-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("character-slot-2")).toHaveAttribute(
    "aria-label",
    /둘슬롯.*선택됨/,
  );
  expect(failures).toEqual([]);
});

async function seedProfile(
  page: Page,
  options: {
    job?: "beginner" | "rogue" | "assassin" | "hermit" | "hokage";
    level?: number;
    exp?: number;
    hp?: number;
    maxHp?: number;
    mp?: number;
    maxMp?: number;
    location?:
      | "kerningCity"
      | "shadowHideout"
      | "greenMushroomCave"
      | "shadowTrialDungeon"
      | "crystalAntNest"
      | "clockworkTower"
      | "sunkenCoralTemple"
      | "emberMine"
      | "moonlitArcaneLibrary"
      | "infiniteDuelGround"
      | "patienceForest";
    statPoints?: number;
    autoAllocateStats?: boolean;
    stats?: { str: number; dex: number; int: number; luk: number };
    skillPoints?: number;
    mesos?: number;
    inventory?: Record<string, number>;
    throwingStars?: {
      owned: Array<"tier1" | "tier2" | "tier3" | "tier4" | "tier5" | "tier6">;
      equipped: "tier1" | "tier2" | "tier3" | "tier4" | "tier5" | "tier6";
    };
    skillLevels?: {
      luckySeven: number;
      shadowVolley: number;
      keenSight: number;
      drain: number;
      phantomStars: number;
      criticalThrow: number;
      avenger: number;
      abyssRain: number;
      shadowBreathing: number;
      rasengan: number;
      nineTailsTransformation: number;
      tailedBeastBomb: number;
      teamAssault: number;
      thunderOrb: number;
      sageMode: number;
    };
    activeJobAdvancementQuest?: {
      id: "rogueTrial" | "assassinTrial" | "hermitTrial" | "hokageTrial";
      defeated: number;
    } | null;
    dungeonBossQuest?: {
      id: "moonlitSeal";
      stage:
        | "offer"
        | "midboss"
        | "upperboss"
        | "finalboss"
        | "turn-in"
        | "complete";
    };
    skillHotbar?: string[];
  },
): Promise<void> {
  await page.evaluate((seed) => {
    window.localStorage.setItem(
      "kerning-shadows.local-profile.v1",
      JSON.stringify({
        schemaVersion: 13,
        character: {
          id: "local-player",
          name: "루키",
          level: seed.level ?? 10,
          job: seed.job ?? "beginner",
          hp: seed.hp ?? seed.maxHp ?? 400,
          maxHp: seed.maxHp ?? 400,
          mp: seed.mp ?? seed.maxMp ?? 300,
          maxMp: seed.maxMp ?? 300,
          mesos: seed.mesos ?? 0,
          stats: seed.stats ?? { str: 4, dex: 25, int: 4, luk: 37 },
          statPoints: seed.statPoints ?? 0,
          autoAllocateStats: seed.autoAllocateStats ?? false,
          skillPoints: seed.skillPoints ?? 0,
          skillLevels: seed.skillLevels ?? {
            luckySeven: 0,
            shadowVolley: 0,
            keenSight: 0,
            drain: 0,
            phantomStars: 0,
            criticalThrow: 0,
            avenger: 0,
            abyssRain: 0,
            shadowBreathing: 0,
            rasengan: 0,
            nineTailsTransformation: 0,
            tailedBeastBomb: 0,
            teamAssault: 0,
            thunderOrb: 0,
            sageMode: 0,
          },
        },
        location: seed.location ?? "kerningCity",
        exp: seed.exp ?? 0,
        inventory: seed.inventory ?? {},
        throwingStars: seed.throwingStars ?? {
          owned: ["tier1"],
          equipped: "tier1",
        },
        skillHotbar: seed.skillHotbar ?? [
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
        activeJobAdvancementQuest: seed.activeJobAdvancementQuest ?? null,
        dungeonBossQuest: seed.dungeonBossQuest ?? {
          id: "moonlitSeal",
          stage: "offer",
        },
      }),
    );
  }, options);
}

async function enterShadowHideout(page: Page): Promise<void> {
  await moveToX(page, 180, 60);
  await expect.poll(() => dataNumber(page, "player-y")).toBeGreaterThan(600);
  await interact(page);
  await interact(page);
  await waitForPortalDestination(page, "shadowHideout", "city-hideout");
  await moveToX(page, 1_040);
  await interact(page);
  await expect(page.getByTestId("job-advancement-dialog")).toBeVisible();
}

async function collectBothDrops(page: Page): Promise<void> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await focusGame(page);
    const mesos = await dataNumber(page, "player-mesos");
    const inventory = JSON.parse(
      (await dataText(page, "player-inventory")) || "{}",
    ) as Record<string, number>;
    if (mesos > 0 && (inventory.mushroomCap ?? 0) > 0) return;

    const positions = JSON.parse(
      (await dataText(page, "runtime-loot-positions")) || "[]",
    ) as number[];
    if (positions[0] !== undefined) {
      await moveToX(page, positions[0], 80, true);
      await expect
        .poll(() => dataNumber(page, "player-y"))
        .toBeGreaterThan(600);
      await page.keyboard.press("z", { delay: 60 });
    }
    await page.waitForTimeout(350);
  }
  throw new Error("Timed out while collecting both guaranteed drops.");
}

async function reachFirstAdvancementLevel(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "9");
  await moveToX(page, 1_710);
  await interact(page);
  await waitForPortalDestination(page, "greenMushroomCave", "city-cave");

  for (let defeat = 0; defeat < 6; defeat += 1) {
    if ((await dataNumber(page, "player-level")) >= 10) break;
    if (defeat > 0) await page.waitForTimeout(2_600);
    await moveToX(page, 200, 30, true);
    await moveToX(page, 360, 30, true);
    await page.waitForTimeout(250);
    for (let attack = 0; attack < 12; attack += 1) {
      if ((await dataNumber(page, "player-level")) >= 10) break;
      await focusGame(page);
      await page.keyboard.press("Control");
      await page.waitForTimeout(850);
    }
  }

  await expect
    .poll(() => dataNumber(page, "player-level"), { timeout: 30_000 })
    .toBeGreaterThanOrEqual(10);
  await moveToX(page, 145, 90, true);
  await expect.poll(() => dataNumber(page, "player-y")).toBeGreaterThan(600);
  await interact(page);
  await waitForPortalDestination(page, "kerningCity", "cave-city-ground");
}

async function runRequiredLoop(page: Page): Promise<{
  exp: number;
  mesos: number;
  inventory: string;
}> {
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await page.waitForTimeout(500);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "player",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
  await expect
    .poll(async () => {
      const playerY = await dataNumber(page, "player-y");
      const cameraScrollY = await dataNumber(page, "camera-scroll-y");
      return playerY - cameraScrollY;
    })
    .toBeLessThan(596);

  const baselineObjects = await dataNumber(page, "runtime-map-objects");
  const baselineColliders = await dataNumber(page, "runtime-map-colliders");

  const initialUrl = page.url();
  await focusGame(page);
  await page.keyboard.press("Alt+ArrowLeft");
  expect(page.url()).toBe(initialUrl);

  await reachFirstAdvancementLevel(page);
  await moveToX(page, 180, 60);
  await expect.poll(() => dataNumber(page, "player-y")).toBeGreaterThan(600);
  await interact(page);
  await interact(page);
  await waitForPortalDestination(page, "shadowHideout", "city-hideout");

  await moveToX(page, 1_040);
  await interact(page);
  await expect(page.getByTestId("job-advancement-dialog")).toBeVisible();
  await expect(page.getByTestId("job-quest-recommended-level")).toHaveText(
    "필수 레벨 · Lv.10",
  );
  await page.getByTestId("job-quest-accept").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-id",
    "rogueTrial",
  );

  await moveToX(page, 1_170, 55);
  await interact(page);
  await waitForPortalDestination(
    page,
    "shadowTrialDungeon",
    "hideout-shadow-trial",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-monsters-alive", "4");

  for (let defeat = 1; defeat <= 5; defeat += 1) {
    if (defeat > 1) await page.waitForTimeout(3_700);
    await moveToX(page, 360, 30, true);
    await page.waitForTimeout(250);
    for (let attack = 0; attack < 12; attack += 1) {
      if ((await dataNumber(page, "job-quest-defeated")) >= defeat) break;
      await focusGame(page);
      await page.keyboard.press("Control");
      await page.waitForTimeout(850);
    }
    await expect
      .poll(() => dataNumber(page, "job-quest-defeated"), { timeout: 30_000 })
      .toBeGreaterThanOrEqual(defeat);
    // The first mushroom guarantees both reward types. Collect them while the
    // fresh pair is still present instead of waiting through later respawns.
    if (defeat === 1) await collectBothDrops(page);
  }
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-status",
    "ready-to-advance",
  );
  await expect
    .poll(() => dataNumber(page, "player-exp"), { timeout: 8_000 })
    .toBeGreaterThan(0);
  const exp = await dataNumber(page, "player-exp");
  const mesos = await dataNumber(page, "player-mesos");
  const inventory = await dataText(page, "player-inventory");
  expect(mesos).toBeGreaterThan(0);
  expect(JSON.parse(inventory)).toMatchObject({ mushroomCap: 1 });

  await moveToX(page, 105, 90, true);
  await expect.poll(() => dataNumber(page, "player-y")).toBeGreaterThan(600);
  await interact(page);
  await waitForPortalDestination(page, "shadowHideout", "shadow-trial-hideout");
  await moveToX(page, 1_040);
  await interact(page);
  await expect(page.getByTestId("job-advancement-dialog")).toBeVisible();
  await page.getByTestId("job-advance-confirm").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-player-job", "rogue");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerRogue",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "jobAdvancement:complete",
  );
  await focusGame(page);
  await page.keyboard.press("Shift");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "luckySeven-attack",
  );
  expect(await dataNumber(page, "player-mp")).toBeLessThan(97);

  await moveToX(page, 105);
  await interact(page);
  await waitForPortalDestination(page, "kerningCity", "hideout-city");
  await page.waitForTimeout(1_200);

  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-projectiles",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-runtime-loot", "0");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-pending-rewards",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-tracked-effects",
    "0",
  );
  expect(await dataNumber(page, "runtime-map-objects")).toBe(baselineObjects);
  expect(await dataNumber(page, "runtime-map-colliders")).toBe(
    baselineColliders,
  );
  await expect
    .poll(() => dataNumber(page, "runtime-fps"))
    .toBeGreaterThanOrEqual(50);

  await page.reload();
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("qa-player");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("character-slot-1")).toHaveAttribute(
    "aria-label",
    /로그/,
  );
  await page.getByTestId("start-game").click();
  await waitForMap(page, "kerningCity");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-job", "rogue");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerRogue",
  );
  expect(await dataNumber(page, "player-exp")).toBe(exp);
  expect(await dataNumber(page, "player-mesos")).toBe(mesos);
  expect(await dataText(page, "player-inventory")).toBe(inventory);

  return { exp, mesos, inventory };
}

test("required loop completes twice, restores persistence, and releases map objects", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);

  for (let run = 1; run <= REQUIRED_LOOP_RUNS; run += 1) {
    if (run === 1) {
      await page.goto("/");
    } else {
      await page.evaluate(() => window.localStorage.clear());
      await page.reload();
    }
    await runRequiredLoop(page);
  }

  expect(failures).toEqual([]);
});

test("stats dialog supports manual and recommended automatic allocation with persistence", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { statPoints: 5 });
  await page.reload();
  await loginAndStart(page);

  await focusGame(page);
  await page.keyboard.press("s");
  await expect(page.getByTestId("stats-dialog")).toBeVisible();
  await expect(page.getByTestId("equipment-dialog")).toBeVisible();
  await expect(page.getByTestId("remaining-stat-points")).toContainText(
    "남은 AP 5",
  );
  await expect(page.getByTestId("stat-luk")).toHaveText("37");

  await page.getByTestId("allocate-luk").click();
  await expect(page.getByTestId("stat-luk")).toHaveText("38");
  await expect(page.getByTestId("remaining-stat-points")).toContainText(
    "남은 AP 4",
  );
  await page.getByTestId("auto-allocate-toggle").check();
  await expect(page.getByTestId("auto-allocate-toggle")).toBeChecked();
  await expect(page.getByTestId("stat-luk")).toHaveText("42");
  await expect(page.getByTestId("remaining-stat-points")).toContainText(
    "남은 AP 0",
  );

  await page.getByTestId("stats-close").click();
  await expect(page.locator(CANVAS)).toBeFocused();
  await page.reload();
  await loginAndStart(page);
  expect(JSON.parse(await dataText(page, "player-stats"))).toMatchObject({
    dex: 25,
    luk: 42,
  });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-stat-points",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-auto-allocate-stats",
    "true",
  );
  expect(failures).toEqual([]);
});

test("ESC menu exposes gameplay panels and keeps audio settings inside Settings", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { job: "rogue", level: 10 });
  await page.reload();
  await loginAndStart(page);

  await focusGame(page);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("game-menu-dialog")).toBeVisible();
  await expect(page.locator("#hud-window-controls")).toBeHidden();
  for (const testId of [
    "menu-inventory",
    "menu-stats",
    "menu-skills",
    "menu-skill-hotkeys",
    "menu-settings",
  ]) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }

  await page.getByTestId("menu-settings").click();
  await expect(page.getByTestId("settings-dialog")).toBeVisible();
  await expect(page.getByTestId("audio-bgm-volume")).toHaveValue("45");
  await expect(page.getByTestId("audio-sfx-volume")).toHaveValue("38");
  await page.getByTestId("audio-bgm-volume").fill("20");
  await page.getByTestId("audio-sfx-volume").fill("65");
  await page.getByTestId("audio-mute-toggle").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-audio-muted", "true");
  await expect(page.locator(GAME)).toHaveAttribute("data-bgm-volume", "0.2");
  await expect(page.locator(GAME)).toHaveAttribute("data-sfx-volume", "0.65");
  expect(
    await page.evaluate(() =>
      JSON.parse(
        window.localStorage.getItem("kerning-shadows.local-settings.v1") ??
          "null",
      ),
    ),
  ).toMatchObject({
    schemaVersion: 1,
    audio: { muted: true, bgmVolume: 0.2, sfxVolume: 0.65 },
  });

  await page.keyboard.press("Escape");
  await expect(page.getByTestId("settings-dialog")).toBeHidden();
  await expect(page.locator(CANVAS)).toBeFocused();
  await page.reload();
  await loginAndStart(page);
  await focusGame(page);
  await page.keyboard.press("Escape");
  await page.getByTestId("menu-settings").click();
  await expect(page.getByTestId("audio-mute-toggle")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("audio-bgm-volume")).toHaveValue("20");
  await expect(page.getByTestId("audio-sfx-volume")).toHaveValue("65");
  expect(failures).toEqual([]);
});

test("existing dungeon ropes support attach, climb, and jump detach", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { location: "crystalAntNest" });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "crystalAntNest");

  await focusGame(page);
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(900);
  await page.keyboard.up("ArrowRight");
  const dungeonYBeforeClimb = await dataNumber(page, "player-y");
  await page.keyboard.down("ArrowUp");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-climbing",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-climbable-id",
    "ant-nest-rope",
  );
  await expect
    .poll(() => dataNumber(page, "player-y"))
    .toBeLessThan(dungeonYBeforeClimb - 18);
  await page.keyboard.up("ArrowUp");
  await page.keyboard.press("Alt");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-climbing",
    "false",
  );
  expect(failures).toEqual([]);
});

test("inventory, dungeon maps, Patience Forest, and airborne attacks remain accessible", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    location: "crystalAntNest",
    inventory: { recoveryBottle: 2, mushroomCap: 3, experienceBook: 1 },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "crystalAntNest");

  await focusGame(page);
  await page.keyboard.press("i");
  await expect(page.getByTestId("inventory-dialog")).toBeVisible();
  await expect(page.getByTestId("inventory-capacity")).toContainText(
    "4 / 24칸",
  );
  await expect(page.getByTestId("inventory-slot-recoveryBottle")).toBeVisible();
  await expect(page.getByTestId("inventory-slot-mushroomCap")).toBeVisible();
  await expect(page.getByTestId("inventory-slot-experienceBook")).toBeVisible();
  await expect(page.getByTestId("inventory-slot-tier1")).toBeVisible();
  await page.getByTestId("inventory-close").click();

  await focusGame(page);
  await page.keyboard.down("ArrowLeft");
  const walkFrames = new Set<string>();
  for (let sample = 0; sample < 16; sample += 1) {
    walkFrames.add(await dataText(page, "player-animation-frame"));
    await page.waitForTimeout(55);
  }
  expect([...walkFrames].sort()).toEqual(["1", "2", "3", "4"]);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-animation",
    "walk",
  );
  await page.keyboard.up("ArrowLeft");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(260);
  const xBeforeJumpAttack = await dataNumber(page, "player-x");
  await page.keyboard.down("Alt");
  await page.keyboard.down("Control");
  await page.waitForTimeout(80);
  await page.keyboard.up("Control");
  await page.keyboard.up("Alt");
  await page.keyboard.up("ArrowRight");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "basicAttack-attack",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-attack-afterimage-kind",
    "basicAttack",
  );
  await expect.poll(() => dataNumber(page, "player-y")).toBeLessThan(610);
  await expect
    .poll(() => dataNumber(page, "player-x"))
    .toBeGreaterThan(xBeforeJumpAttack + 8);

  for (const mapId of [
    "clockworkTower",
    "sunkenCoralTemple",
    "emberMine",
    "moonlitArcaneLibrary",
    "infiniteDuelGround",
    "patienceForest",
  ] as const) {
    await seedProfile(page, { location: mapId });
    await page.reload();
    await loginAndStart(page);
    await waitForMap(page, mapId);
    const expectedMonsters =
      mapId === "infiniteDuelGround"
        ? 1
        : mapId === "patienceForest"
          ? 0
          : mapId === "emberMine" || mapId === "moonlitArcaneLibrary"
            ? 5
            : 4;
    await expect
      .poll(() => dataNumber(page, "monsters-alive"))
      .toBe(expectedMonsters);
    if (mapId === "patienceForest") {
      await focusGame(page);
      await page.keyboard.down("ArrowRight");
      await page.waitForTimeout(430);
      await page.keyboard.up("ArrowRight");
      const yBeforeClimb = await dataNumber(page, "player-y");
      await page.keyboard.down("ArrowUp");
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-player-climbing",
        "true",
      );
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-player-climbable-id",
        "patience-rope-entry",
      );
      await expect
        .poll(() => dataNumber(page, "player-y"))
        .toBeLessThan(yBeforeClimb - 18);
      await page.keyboard.up("ArrowUp");
      await page.keyboard.press("Alt");
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-player-climbing",
        "false",
      );
    }
  }
  expect(failures).toEqual([]);
});

test("down plus jump drops through only the current one-way platform", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { location: "kerningCity" });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await moveToX(page, 520, 35);
  const groundY = await dataNumber(page, "player-y");
  await focusGame(page);
  await page.keyboard.press("Alt", { delay: 60 });
  await expect
    .poll(() => dataNumber(page, "player-y"))
    .toBeLessThan(groundY - 100);
  await expect
    .poll(() => dataText(page, "player-animation"), { timeout: 2_000 })
    .toBe("idle");
  const platformY = await dataNumber(page, "player-y");
  expect(platformY).toBeLessThan(groundY - 100);

  await page.keyboard.down("ArrowDown");
  try {
    await page.keyboard.press("Alt", { delay: 60 });
    await expect(page.locator(GAME)).toHaveAttribute(
      "data-last-combat-event",
      "platform-drop-through",
    );
    await expect
      .poll(() => dataNumber(page, "player-y"))
      .toBeGreaterThan(platformY + 40);
  } finally {
    await page.keyboard.up("ArrowDown");
  }
  await expect
    .poll(
      async () => Math.abs((await dataNumber(page, "player-y")) - groundY),
      {
        timeout: 2_000,
      },
    )
    .toBeLessThanOrEqual(2);
  expect(failures).toEqual([]);
});

test("Kerning City reveals the Moonlit Library portal after the mid-boss defeat", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    location: "kerningCity",
    dungeonBossQuest: { id: "moonlitSeal", stage: "midboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-mini-map-portal-count",
    "2",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-portal-effect-count",
    "2",
  );

  await page.evaluate(() => {
    const key = "kerning-shadows.local-profile.v1";
    const profile = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    profile.dungeonBossQuest.stage = "upperboss";
    window.localStorage.setItem(key, JSON.stringify(profile));
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-mini-map-portal-count",
    "3",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-portal-effect-count",
    "3",
  );
  expect(failures).toEqual([]);
});

test("airborne movement reverses immediately and remains controllable during attacks", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { location: "kerningCity" });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await focusGame(page);

  const groundY = await dataNumber(page, "player-y");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(320);
  await expect
    .poll(() => dataNumber(page, "player-velocity-x"))
    .toBeGreaterThan(220);
  await page.keyboard.press("Alt", { delay: 40 });
  await expect
    .poll(() => dataNumber(page, "player-y"))
    .toBeLessThan(groundY - 36);
  await expect.poll(() => dataNumber(page, "player-velocity-x")).toBe(260);

  await page.keyboard.up("ArrowRight");
  await page.keyboard.down("ArrowLeft");
  const reverseX = await dataNumber(page, "player-x");
  await expect.poll(() => dataNumber(page, "player-velocity-x")).toBe(-260);
  await page.keyboard.press("Control", { delay: 40 });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "basicAttack-attack",
  );
  await expect.poll(() => dataNumber(page, "player-velocity-x")).toBe(-260);
  await expect
    .poll(() => dataNumber(page, "player-x"))
    .toBeLessThan(reverseX - 8);
  await page.keyboard.up("ArrowLeft");
  expect(failures).toEqual([]);
});

test("Sera tracks the dungeon boss quest, boss HUD, and one-time expedition reward", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { location: "kerningCity" });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await moveToX(page, 940, 55);
  await interact(page);
  await expect(page.getByTestId("dungeon-boss-quest-dialog")).toBeVisible();
  await expect(page.getByTestId("dungeon-boss-quest-stage")).toContainText(
    "새 원정 의뢰",
  );
  await expect(
    page.getByTestId("dungeon-boss-quest-recommended-level"),
  ).toHaveText("적정 레벨 · Lv.100~200");
  await page.getByTestId("dungeon-boss-quest-accept").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-dungeon-boss-quest-stage",
    "midboss",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /폭열군주 이그니카르 처치/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );

  await seedProfile(page, {
    job: "hokage",
    level: 120,
    hp: 5_000,
    maxHp: 5_000,
    stats: { str: 4, dex: 135, int: 4, luk: 477 },
    location: "emberMine",
    dungeonBossQuest: { id: "moonlitSeal", stage: "midboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "emberMine");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-kind",
    "emberWarden",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-boss-rank", "midboss");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-max-hp",
    "2000000",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-boss-status", "alive");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
  const emberInitialHp = await dataNumber(page, "player-hp");
  await moveToX(page, 980, 70, true);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-skill",
    "furnaceShard",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "hit",
  );
  await expect
    .poll(() => dataNumber(page, "player-hp"))
    .toBeLessThan(emberInitialHp);

  await seedProfile(page, {
    job: "hokage",
    level: 120,
    hp: 5_000,
    maxHp: 5_000,
    stats: { str: 4, dex: 135, int: 4, luk: 477 },
    location: "moonlitArcaneLibrary",
    dungeonBossQuest: { id: "moonlitSeal", stage: "upperboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "moonlitArcaneLibrary");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-kind",
    "eclipseArchivist",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-rank",
    "upperboss",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-max-hp",
    "12000000",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /월식현자 루나시온 처치/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
  const eclipseInitialHp = await dataNumber(page, "player-hp");
  await moveToX(page, 1_000, 70, true);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-skill",
    "eclipseBolt",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "hit",
  );
  await expect
    .poll(() => dataNumber(page, "player-hp"))
    .toBeLessThan(eclipseInitialHp);

  await seedProfile(page, {
    job: "hokage",
    level: 200,
    stats: { str: 4, dex: 215, int: 4, luk: 797 },
    location: "infiniteDuelGround",
    dungeonBossQuest: { id: "moonlitSeal", stage: "finalboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "infiniteDuelGround");
  await expect(page.locator(GAME)).toHaveAttribute("data-monsters-alive", "1");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-kind",
    "onePunchMan",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-rank",
    "finalboss",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-max-hp",
    "80000000",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-boss-phase", "1");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-knockback-immune",
    "true",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /원펀맨 처치/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-skill",
    "normalPunchShockwave",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "launched",
  );
  await expect.poll(() => dataNumber(page, "runtime-boss-projectiles")).toBe(1);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "hit",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-hp", "0");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "kerningCity",
  );

  await seedProfile(page, {
    location: "kerningCity",
    mesos: 100,
    dungeonBossQuest: { id: "moonlitSeal", stage: "turn-in" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await moveToX(page, 940, 55);
  await interact(page);
  await expect(page.getByTestId("dungeon-boss-quest-claim")).toBeVisible();
  await page.getByTestId("dungeon-boss-quest-claim").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-dungeon-boss-quest-stage",
    "complete",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-mesos", "7600");
  expect(JSON.parse(await dataText(page, "player-inventory"))).toMatchObject({
    experienceBook: 2,
  });

  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-dungeon-boss-quest-stage",
    "complete",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-mesos", "7600");
  expect(failures).toEqual([]);
});

test("One Punch Man launches a punch shockwave without knockback", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 200,
    location: "infiniteDuelGround",
    dungeonBossQuest: { id: "moonlitSeal", stage: "finalboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "infiniteDuelGround");
  await expect(page.locator(GAME)).toHaveAttribute("data-boss-phase", "1");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-knockback-immune",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-skill",
    "normalPunchShockwave",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "launched",
  );
  await expect.poll(() => dataNumber(page, "runtime-boss-projectiles")).toBe(1);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-boss-ranged-status",
    "hit",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-hp", "0");
  expect(failures).toEqual([]);
});

test("Nine-Tails Claw hits One Punch Man from the duel-ground second floor", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 200,
    mp: 10_000,
    maxMp: 10_000,
    stats: { str: 4, dex: 215, int: 4, luk: 797 },
    location: "infiniteDuelGround",
    inventory: { revivalCharm: 1 },
    throwingStars: { owned: ["tier1", "tier6"], equipped: "tier6" },
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
      rasengan: 20,
      nineTailsTransformation: 20,
      tailedBeastBomb: 20,
      teamAssault: 20,
      thunderOrb: 20,
      sageMode: 20,
    },
    dungeonBossQuest: { id: "moonlitSeal", stage: "finalboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "infiniteDuelGround");

  await focusGame(page);
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );

  const bossHpBeforeClaw = await dataNumber(page, "boss-hp");
  expect(bossHpBeforeClaw).toBeGreaterThan(0);
  await page.keyboard.down("ArrowRight");
  await page.keyboard.press("Alt", { delay: 40 });
  await expect
    .poll(() => dataNumber(page, "player-x"), { timeout: 1_200 })
    .toBeGreaterThan(320);
  if ((await dataNumber(page, "player-y")) >= 500) {
    await page.keyboard.press("Alt", { delay: 40 });
  }
  await expect
    .poll(() => dataNumber(page, "player-y"), { timeout: 1_200 })
    .toBeLessThan(500);
  await page.keyboard.up("ArrowRight");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "infiniteDuelGround",
  );
  const attackCountBeforeClaw = await dataNumber(page, "player-attack-count");
  await focusGame(page);
  await page.keyboard.press("Control", { delay: 40 });
  await expect
    .poll(() => dataNumber(page, "player-attack-count"), { timeout: 1_500 })
    .toBeGreaterThan(attackCountBeforeClaw);
  await expect
    .poll(
      async () => {
        const activeMap = await dataText(page, "active-map");
        const currentBossHp = await dataNumber(page, "boss-hp");
        return (
          activeMap === "infiniteDuelGround" &&
          currentBossHp > 0 &&
          currentBossHp < bossHpBeforeClaw
        );
      },
      {
        timeout: 1_500,
        message: "Nine-Tails Claw should damage One Punch Man before respawn",
      },
    )
    .toBe(true);
  expect(failures).toEqual([]);
});

test("One Punch Man clear shows pixel credits and returns to live gameplay", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 200,
    mp: 10_000,
    maxMp: 10_000,
    stats: { str: 10_000, dex: 10_000, int: 10_000, luk: 10_000 },
    location: "infiniteDuelGround",
    inventory: { revivalCharm: 1 },
    throwingStars: { owned: ["tier1", "tier6"], equipped: "tier6" },
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
      rasengan: 20,
      nineTailsTransformation: 20,
      tailedBeastBomb: 20,
      teamAssault: 20,
      thunderOrb: 20,
      sageMode: 20,
    },
    dungeonBossQuest: { id: "moonlitSeal", stage: "finalboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "infiniteDuelGround");
  await focusGame(page);

  for (let attack = 0; attack < 3; attack += 1) {
    await page.keyboard.press("Shift", { delay: 40 });
    await page.waitForTimeout(360);
  }

  const credits = page.getByTestId("ending-credits");
  await expect(credits).toBeVisible({ timeout: 8_000 });
  await expect(credits).toHaveCSS(
    "background-image",
    /ending-credits-v1.*\.webp/,
  );
  for (const role of [
    "시스템",
    "던전 디자인",
    "몬스터 디자인",
    "캐릭터 디자인",
    "스킬 디자인",
    "FX",
    "테스트",
  ]) {
    await expect(credits).toContainText(role);
  }
  await expect(credits).toContainText("임상진 with Codex");
  await expect(credits).toContainText("게임 레퍼런스");
  await expect(credits).toContainText("메이플스토리");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-ending-credits",
    "playing",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-dungeon-boss-quest-stage",
    "turn-in",
  );

  await page.getByTestId("ending-credits-continue").click();
  await expect(credits).toBeHidden();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-ending-credits",
    "closed",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-ending-credits-close-reason",
    "continue",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    /^(?:infiniteDuelGround|kerningCity)$/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-boss-projectiles",
    "0",
  );
  await expect(page.locator(CANVAS)).toBeFocused();

  const xBeforeResume = await dataNumber(page, "player-x");
  await page.keyboard.down("ArrowRight");
  await page.waitForTimeout(300);
  await page.keyboard.up("ArrowRight");
  await expect
    .poll(() => dataNumber(page, "player-x"))
    .toBeGreaterThan(xBeforeResume);
  expect(failures).toEqual([]);
});

test("a Revival Charm revives once in place before the next defeat returns to Kerning City", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 200,
    hp: 400,
    maxHp: 400,
    mp: 7,
    maxMp: 300,
    location: "infiniteDuelGround",
    inventory: { revivalCharm: 1 },
    dungeonBossQuest: { id: "moonlitSeal", stage: "finalboss" },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "infiniteDuelGround");

  await expect
    .poll(
      async () =>
        (
          JSON.parse(await dataText(page, "player-inventory")) as Record<
            string,
            number
          >
        ).revivalCharm,
      { timeout: 8_000 },
    )
    .toBe(0);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "infiniteDuelGround",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-hp", "400");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-mp", "300");
  expect(JSON.parse(await dataText(page, "player-inventory"))).toMatchObject({
    revivalCharm: 0,
  });

  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "kerningCity",
    { timeout: 10_000 },
  );
  expect(failures).toEqual([]);
});

test("Dark Lord advances Rogue to Assassin and Hermit and unlocks their attacks", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "rogue",
    level: 30,
    stats: { str: 4, dex: 45, int: 4, luk: 117 },
    activeJobAdvancementQuest: { id: "assassinTrial", defeated: 6 },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await enterShadowHideout(page);
  await page.getByTestId("job-advance-confirm").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-job",
    "assassin",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerAssassin",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "jobAdvancement:complete",
  );
  await focusGame(page);
  await page.keyboard.press("x");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "drain-attack",
  );
  await page.waitForTimeout(1_000);

  await page.reload();
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.evaluate(() => {
    const key = "kerning-shadows.local-profile.v1";
    const profile = JSON.parse(window.localStorage.getItem(key) ?? "null") as {
      character: {
        level: number;
        hp: number;
        maxHp: number;
        mp: number;
        maxMp: number;
        stats: { str: number; dex: number; int: number; luk: number };
      };
    };
    profile.character.level = 60;
    profile.character.hp = 600;
    profile.character.maxHp = 600;
    profile.character.mp = 400;
    profile.character.maxMp = 400;
    profile.character.stats = { str: 4, dex: 75, int: 4, luk: 237 };
    (
      profile as unknown as { activeJobAdvancementQuest: unknown }
    ).activeJobAdvancementQuest = {
      id: "hermitTrial",
      defeated: 3,
    };
    window.localStorage.setItem(key, JSON.stringify(profile));
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "shadowHideout");
  await moveToX(page, 1_040);
  await interact(page);
  await expect(page.getByTestId("job-advancement-dialog")).toBeVisible();
  await page.getByTestId("job-advance-confirm").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-player-job", "hermit");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerHermit",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "jobAdvancement:complete",
  );
  await focusGame(page);
  await page.keyboard.press("c");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "avenger-attack",
  );
  await page.waitForTimeout(1_000);
  await page.reload();
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("qa-player");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("character-slot-1")).toHaveAttribute(
    "aria-label",
    /허밋/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerHermit",
  );
  expect(failures).toEqual([]);
});

test("Assassin trial opens the Shadow Trial dungeon with medium and large monsters", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "rogue",
    level: 30,
    stats: { str: 4, dex: 45, int: 4, luk: 117 },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await enterShadowHideout(page);
  await page.getByTestId("job-quest-accept").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-id",
    "assassinTrial",
  );

  await moveToX(page, 1_170, 55);
  await interact(page);
  await waitForPortalDestination(
    page,
    "shadowTrialDungeon",
    "hideout-shadow-trial",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-monsters-alive", "4");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-status",
    "active",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerRogue",
  );
  expect(failures).toEqual([]);
});

test("Rogue first advancement trial opens in the Shadow Trial dungeon", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "beginner",
    level: 10,
    location: "shadowHideout",
    activeJobAdvancementQuest: { id: "rogueTrial", defeated: 0 },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "shadowHideout");
  await moveToX(page, 1_170, 55);
  await interact(page);
  await waitForPortalDestination(
    page,
    "shadowTrialDungeon",
    "hideout-shadow-trial",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-monsters-alive", "4");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-id",
    "rogueTrial",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-job-quest-status",
    "active",
  );
  expect(failures).toEqual([]);
});

test("level-up grants AP and SP, supports skill allocation, and completes the effect cleanly", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "rogue",
    level: 10,
    exp: 99,
    location: "greenMushroomCave",
    autoAllocateStats: true,
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "greenMushroomCave");
  await moveToX(page, 300, 90);

  for (let attack = 0; attack < 4; attack += 1) {
    if ((await dataNumber(page, "player-level")) >= 11) break;
    await focusGame(page);
    await page.keyboard.press("Shift");
    await page.waitForTimeout(750);
  }
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "11", {
    timeout: 10_000,
  });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "levelUp:complete",
  );
  expect(JSON.parse(await dataText(page, "player-stats"))).toMatchObject({
    dex: 26,
    luk: 41,
  });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-stat-points",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-skill-points",
    "3",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-tracked-effects",
    "0",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-runtime-map-timers",
    "0",
  );

  await focusGame(page);
  await page.keyboard.press("k");
  await expect(page.getByTestId("skill-dialog")).toBeVisible();
  await expect(page.getByTestId("remaining-skill-points")).toContainText(
    "남은 SP 3",
  );
  await expect(page.getByTestId("skill-level-luckySeven")).toContainText(
    "LV. 0 / 20",
  );
  await expect(page.getByTestId("skill-level-keenSight")).toContainText(
    "LV. 0 / 20",
  );
  for (const skillId of ["luckySeven", "shadowVolley", "keenSight"] as const) {
    await expectSkillIconLoaded(page, skillId);
  }
  await page.getByTestId("allocate-skill-luckySeven").click();
  await expect(page.getByTestId("remaining-skill-points")).toContainText(
    "남은 SP 2",
  );
  await expect(page.getByTestId("skill-level-luckySeven")).toContainText(
    "LV. 1 / 20",
  );
  await page.getByTestId("allocate-skill-keenSight").click();
  await expect(page.getByTestId("remaining-skill-points")).toContainText(
    "남은 SP 1",
  );
  await expect(page.getByTestId("skill-level-keenSight")).toContainText(
    "LV. 1 / 20",
  );
  await page.getByTestId("skill-tab-drain").click();
  await expect(page.getByTestId("allocate-skill-drain")).toBeDisabled();
  await expect(page.getByTestId("allocate-skill-phantomStars")).toBeDisabled();
  await expect(page.getByTestId("allocate-skill-criticalThrow")).toBeDisabled();
  await expectSkillIconLoaded(page, "drain");
  await expectSkillIconLoaded(page, "phantomStars");
  await expectSkillIconLoaded(page, "criticalThrow");
  await page.getByTestId("skill-tab-avenger").click();
  await expectSkillIconLoaded(page, "avenger");
  await expectSkillIconLoaded(page, "abyssRain");
  await expectSkillIconLoaded(page, "shadowBreathing");
  await page.getByTestId("skill-tab-rasengan").click();
  for (const skillId of [
    "rasengan",
    "nineTailsTransformation",
    "tailedBeastBomb",
    "teamAssault",
    "thunderOrb",
    "sageMode",
  ] as const) {
    await expectSkillIconLoaded(page, skillId);
  }
  await page.getByTestId("skill-close").click();
  await focusGame(page);
  await page.keyboard.press("1");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "luckySeven-attack",
  );
  await page.waitForTimeout(1_000);
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-skill-points",
    "1",
  );
  expect(JSON.parse(await dataText(page, "player-skill-levels"))).toMatchObject(
    {
      luckySeven: 1,
      keenSight: 1,
      drain: 0,
      criticalThrow: 0,
      avenger: 0,
      shadowBreathing: 0,
    },
  );
  expect(failures).toEqual([]);
});

test("critical hits use the dedicated emphasized damage-number palette", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "assassin",
    level: 60,
    location: "greenMushroomCave",
    skillLevels: {
      luckySeven: 20,
      shadowVolley: 20,
      keenSight: 20,
      drain: 20,
      phantomStars: 20,
      criticalThrow: 20,
      avenger: 0,
      abyssRain: 0,
      shadowBreathing: 0,
      rasengan: 0,
      nineTailsTransformation: 0,
      tailedBeastBomb: 0,
      teamAssault: 0,
      thunderOrb: 0,
      sageMode: 0,
    },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "greenMushroomCave");
  await moveToX(page, 300, 90);
  await focusGame(page);
  await page.keyboard.press("Control");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-damage-palette",
    "critical",
  );
  await expect
    .poll(() => dataNumber(page, "last-damage-amount"))
    .toBeGreaterThan(0);
  expect(failures).toEqual([]);
});

test("active skills use distinct effects and the shortcut screen persists freely arranged slots", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 120,
    mp: 1_000,
    maxMp: 1_000,
  });
  await page.evaluate(() => {
    const key = "kerning-shadows.local-profile.v1";
    const profile = JSON.parse(window.localStorage.getItem(key) ?? "null");
    profile.skillHotkeyAliases = {
      ...profile.skillHotkeyAliases,
      Z: "abyssRain",
    };
    window.localStorage.setItem(key, JSON.stringify(profile));
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await focusGame(page);
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "data-hud-skill-icon-count",
    "11",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hud-padding-violations",
    "0",
  );
  await expect(page.locator(GAME)).not.toHaveAttribute(
    "data-player-skill-hotkey-aliases",
    /"Z":/,
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "data-hud-skill-slots",
    "1:luckySeven,2:shadowVolley,3:drain,4:phantomStars,5:avenger,6:abyssRain,7:rasengan,8:nineTailsTransformation,9:tailedBeastBomb,0:teamAssault,-:thunderOrb",
  );
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "aria-label",
    /스킬 슬롯 1 럭키세븐 LV\.0, 2 그림자 연사 LV\.0/,
  );

  for (const [key, event, motion] of [
    ["1", "luckySeven-attack", "twin-straight"],
    ["2", "shadowVolley-attack", "fan-volley"],
    ["3", "drain-attack", "siphon-pulse"],
    ["4", "phantomStars-attack", "phantom-wave"],
    ["6", "abyssRain-attack"],
    ["-", "thunderOrb-attack"],
  ] as const) {
    await page.keyboard.press(key);
    await expect(page.locator(GAME)).toHaveAttribute(
      "data-last-combat-event",
      event,
    );
    if (motion) {
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-last-skill-projectile-motion",
        motion,
      );
    }
    await page.waitForTimeout(260);
  }
  for (const [key, event] of [
    ["q", "shadowVolley-attack"],
    ["w", "phantomStars-attack"],
    ["e", "abyssRain-attack"],
    ["r", "thunderOrb-attack"],
  ] as const) {
    await page.keyboard.press(key);
    await expect(page.locator(GAME)).toHaveAttribute(
      "data-last-combat-event",
      event,
    );
    if (key === "r") {
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-hokage-cinematic",
        "thunderOrb",
      );
      await expect(page.locator(GAME)).toHaveAttribute(
        "data-last-skill-spectacle-tier",
        "4",
      );
    }
    await page.waitForTimeout(260);
  }

  await expect
    .poll(() => dataNumber(page, "runtime-projectiles"))
    .toBeGreaterThan(0);
  await expect.poll(() => dataNumber(page, "runtime-projectiles")).toBe(0);
  await focusGame(page);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("game-menu-dialog")).toBeVisible();
  await page.getByTestId("menu-skill-hotkeys").click();
  await expect(page.getByTestId("skill-hotkey-dialog")).toBeVisible();
  for (const hotkey of [
    "Shift",
    "Q",
    "W",
    "E",
    "R",
    "A",
    "S",
    "D",
    "F",
    "X",
    "C",
    "V",
  ]) {
    await expect(
      page.getByTestId(`skill-hotbar-slot-extra-${hotkey}`),
    ).toBeVisible();
  }
  await expect(page.getByTestId("skill-hotbar-slot-extra-Z")).toHaveCount(0);
  await expect(page.getByTestId("skill-hotbar-slot-1")).toHaveAttribute(
    "data-skill-id",
    "luckySeven",
  );
  await page.getByTestId("skill-hotbar-slot-1").click();
  await page.getByTestId("skill-hotkey-choice-phantomStars").click();
  await expect(page.getByTestId("skill-hotbar-slot-1")).toHaveAttribute(
    "data-skill-id",
    "phantomStars",
  );
  await expect(page.getByTestId("skill-hotbar-slot-4")).toHaveAttribute(
    "data-skill-id",
    "luckySeven",
  );
  await page.getByTestId("skill-hotbar-slot-extra-A").click();
  await page.getByTestId("skill-hotkey-choice-drain").click();
  await expect(page.getByTestId("skill-hotbar-slot-extra-A")).toHaveAttribute(
    "data-skill-id",
    "drain",
  );
  await page.getByTestId("skill-hotbar-slot-extra-S").click();
  await page.getByTestId("skill-hotkey-choice-thunderOrb").click();
  await page.getByTestId("skill-hotkey-clear").click();
  await expect(page.getByTestId("skill-hotbar-slot-extra-S")).toHaveAttribute(
    "data-skill-id",
    "",
  );
  await page.getByTestId("skill-hotkey-close").click();
  await focusGame(page);
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "data-hud-skill-slots",
    /^1:phantomStars,2:shadowVolley,3:drain,4:luckySeven/,
  );
  await page.keyboard.press("1");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "phantomStars-attack",
  );
  await page.waitForTimeout(800);
  await page.keyboard.press("a");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "drain-attack",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-skill-hotkey-aliases",
    /"A":"drain"/,
  );
  await page.waitForTimeout(800);
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(CANVAS)).toHaveAttribute(
    "data-hud-skill-slots",
    /^1:phantomStars,2:shadowVolley,3:drain,4:luckySeven/,
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-skill-hotkey-aliases",
    /"A":"drain"/,
  );
  await focusGame(page);
  await page.keyboard.press("a");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "drain-attack",
  );

  expect(failures).toEqual([]);
});

test("the Kerning City merchant sells and uses an Experience Book", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { mesos: 2, exp: 37 });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await moveToX(page, 1_210, 75);
  await interact(page);
  await expect(page.getByTestId("shop-dialog")).toBeVisible();
  await page.getByTestId("purchase-experience-book").click();
  await expect(page.getByTestId("shop-wallet")).toContainText("보유 메소 1");
  await expect(page.getByTestId("experience-book-owned")).toHaveText(
    "보유 1개",
  );
  await page.getByTestId("use-experience-book").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "20");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-exp", "37");
  await expect(page.getByTestId("experience-book-owned")).toHaveText(
    "보유 0개",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "levelUp:complete",
  );
  await page.getByTestId("shop-close").click();
  await expect(page.locator(CANVAS)).toBeFocused();
  expect(JSON.parse(await dataText(page, "player-inventory"))).toMatchObject({
    experienceBook: 0,
  });
  expect(failures).toEqual([]);
});

test("the Kerning City merchant sells at most one Revival Charm", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { mesos: 2_000_000 });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await moveToX(page, 1_210, 75);
  await interact(page);
  await expect(page.getByTestId("shop-dialog")).toBeVisible();
  await expect(page.getByTestId("revival-charm-owned")).toHaveText("보유 0개");
  await page.getByTestId("purchase-revival-charm").click();
  await expect(page.getByTestId("shop-wallet")).toContainText(
    "보유 메소 1,000,000",
  );
  await expect(page.getByTestId("revival-charm-owned")).toHaveText("보유 1개");
  await expect(page.getByTestId("purchase-revival-charm")).toBeDisabled();
  await expect(page.getByTestId("purchase-revival-charm")).toHaveText(
    "보유 중",
  );
  await page.getByTestId("shop-close").click();

  await focusGame(page);
  await page.keyboard.press("i");
  await expect(page.getByTestId("inventory-slot-revivalCharm")).toBeVisible();
  await page.getByTestId("inventory-slot-revivalCharm").click();
  await expect(page.getByTestId("inventory-dialog")).toContainText(
    "사망하는 순간 자동으로 1개를 소비",
  );
  await expect(page.getByTestId("inventory-use-revivalCharm")).toHaveCount(0);
  await page.getByTestId("inventory-close").click();

  await page.reload();
  await loginAndStart(page);
  expect(JSON.parse(await dataText(page, "player-inventory"))).toMatchObject({
    revivalCharm: 1,
  });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-mesos",
    "1000000",
  );
  expect(failures).toEqual([]);
});

test("the merchant sells five throwing-star grades and S equips their projectile", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { mesos: 20_000 });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await moveToX(page, 1_210, 70);
  await interact(page);
  await expect(page.getByTestId("shop-dialog")).toBeVisible();
  for (const tier of ["tier1", "tier2", "tier3", "tier4", "tier5"]) {
    await expect(
      page.getByTestId(`purchase-throwing-star-${tier}`),
    ).toBeVisible();
  }
  await expect(page.getByTestId("purchase-throwing-star-tier6")).toHaveCount(0);
  await page.getByTestId("purchase-throwing-star-tier5").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-player-mesos", "8000");
  await page.getByTestId("shop-close").click();

  await focusGame(page);
  await page.keyboard.press("s");
  await expect(page.getByTestId("stats-dialog")).toBeVisible();
  await expect(page.getByTestId("equipment-dialog")).toBeVisible();
  await page.getByTestId("equip-throwing-star-tier5").click();
  await expect(page.getByTestId("equipped-throwing-star")).toContainText(
    "일식 표창",
  );
  await page.getByTestId("stats-close").click();
  await focusGame(page);
  await page.keyboard.press("Control");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-equipped-throwing-star",
    "tier5",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-projectile-frame",
    "12",
  );

  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-equipped-throwing-star",
    "tier5",
  );
  expect(failures).toEqual([]);
});

test("the reward-only Giant Icicle equips, persists, and uses its ice frame", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    throwingStars: { owned: ["tier1", "tier6"], equipped: "tier1" },
  });
  await page.reload();
  await loginAndStart(page);
  await focusGame(page);
  await page.keyboard.press("s");
  await page.getByTestId("equip-throwing-star-tier6").click();
  await expect(page.getByTestId("equipped-throwing-star")).toContainText(
    "초대형 고드름",
  );
  await page.getByTestId("stats-close").click();
  await focusGame(page);
  await page.keyboard.press("Control");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-equipped-throwing-star",
    "tier6",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-projectile-frame",
    "6",
  );
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-equipped-throwing-star",
    "tier6",
  );
  expect(failures).toEqual([]);
});

test("Hokage advancement enables Sage aura and Nine-Tails combat switching", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hermit",
    level: 120,
    skillPoints: 4,
    stats: { str: 4, dex: 135, int: 4, luk: 477 },
    activeJobAdvancementQuest: { id: "hokageTrial", defeated: 8 },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await enterShadowHideout(page);
  await page.getByTestId("job-advance-confirm").click();
  await expect(page.locator(GAME)).toHaveAttribute("data-player-job", "hokage");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-appearance",
    "playerHokage",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-milestone-effect",
    "jobAdvancement:complete",
  );

  await focusGame(page);
  await page.keyboard.press("k");
  await page.getByTestId("skill-tab-rasengan").click();
  for (const skillId of [
    "rasengan",
    "nineTailsTransformation",
    "tailedBeastBomb",
    "sageMode",
  ]) {
    await page.getByTestId(`allocate-skill-${skillId}`).click();
  }
  await expect(page.locator(GAME)).toHaveAttribute("data-sage-aura", "true");
  await page.getByTestId("skill-close").click();
  await expect.poll(() => dataNumber(page, "runtime-tracked-effects")).toBe(1);

  await focusGame(page);
  await page.keyboard.press("v");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "rasengan",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "rasengan-attack",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-attack-afterimage-kind",
    "rasengan",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-attack-afterimage-count",
    "4",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "true",
  );
  await expect.poll(() => dataNumber(page, "runtime-tracked-effects")).toBe(2);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await page.keyboard.press("Control");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "nineTailsClaw-attack",
  );
  await page.waitForTimeout(650);
  await page.keyboard.press("Shift");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "tailedBeastBomb-attack",
  );
  await page.waitForTimeout(1_100);
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "false",
  );
  await expect.poll(() => dataNumber(page, "runtime-tracked-effects")).toBe(1);
  expect(failures).toEqual([]);
});

test("Hokage cinematics lock cleanly and team assault lands five staged hits", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 120,
    mp: 600,
    maxMp: 600,
    stats: { str: 4, dex: 135, int: 4, luk: 477 },
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
      rasengan: 1,
      nineTailsTransformation: 1,
      tailedBeastBomb: 1,
      teamAssault: 1,
      thunderOrb: 1,
      sageMode: 1,
    },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");

  await focusGame(page);
  await page.keyboard.press("v");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "rasengan",
  );
  await expect(page.locator("#hud-window-controls")).toBeHidden();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await expect(page.locator("#hud-window-controls")).toBeVisible();

  await focusGame(page);
  await page.keyboard.press("r");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "thunderOrb",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await focusGame(page);
  await page.keyboard.press("r");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "thunderOrb",
  );
  await expect
    .poll(
      async () =>
        (
          JSON.parse(
            await dataText(page, "runtime-projectile-states"),
          ) as Array<{
            kind: string;
          }>
        ).filter(({ kind }) => kind === "thunderOrb").length,
    )
    .toBe(4);
  const repeatedThunderOrbs = (
    JSON.parse(await dataText(page, "runtime-projectile-states")) as Array<{
      kind: string;
      activeAgeMs: number;
      lifetimeMs: number;
    }>
  ).filter(({ kind }) => kind === "thunderOrb");
  expect(repeatedThunderOrbs).toHaveLength(4);
  expect(
    repeatedThunderOrbs.every(({ lifetimeMs }) => lifetimeMs === 900),
  ).toBe(true);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );

  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "nineTailsTransformation",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await page.keyboard.press("Shift");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "tailedBeastBomb",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "false",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );

  await page.waitForTimeout(260);
  await page.keyboard.press("n");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "teamAssault",
  );
  await page.waitForTimeout(760);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-team-assault-hit-count",
    "5",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await expect
    .poll(() => dataNumber(page, "runtime-cinematic-objects"))
    .toBe(0);
  expect(failures).toEqual([]);
});

test("Nine-Tails drains MP and boosts claw and movement speed until deactivation", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    job: "hokage",
    level: 120,
    mp: 1_000,
    maxMp: 1_000,
    stats: { str: 4, dex: 135, int: 4, luk: 477 },
    throwingStars: { owned: ["tier1", "tier6"], equipped: "tier6" },
    skillLevels: {
      luckySeven: 0,
      shadowVolley: 0,
      keenSight: 0,
      drain: 0,
      phantomStars: 0,
      criticalThrow: 0,
      avenger: 0,
      abyssRain: 0,
      shadowBreathing: 0,
      rasengan: 0,
      nineTailsTransformation: 20,
      tailedBeastBomb: 0,
      teamAssault: 0,
      thunderOrb: 0,
      sageMode: 0,
    },
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await expect.poll(() => dataNumber(page, "player-max-velocity-x")).toBe(260);

  await focusGame(page);
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-mp", "940");
  await expect.poll(() => dataNumber(page, "player-max-velocity-x")).toBe(312);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-hokage-cinematic",
    "none",
  );
  await expect
    .poll(() => dataNumber(page, "nine-tails-drain-ticks"))
    .toBeGreaterThanOrEqual(1);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-last-drain-mp",
    "10",
  );

  await focusGame(page);
  await page.keyboard.press("Control", { delay: 20 });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "nineTailsClaw-attack",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-player-attack-speed-multiplier",
    "2.00",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-attack-count",
    "1",
  );
  await page.waitForTimeout(120);
  await page.keyboard.press("Control", { delay: 20 });
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-player-attack-count",
    "2",
  );
  await page.waitForTimeout(120);
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "false",
  );
  await expect.poll(() => dataNumber(page, "player-max-velocity-x")).toBe(260);

  await seedProfile(page, {
    job: "hokage",
    level: 120,
    mp: 70,
    maxMp: 1_000,
  });
  await page.reload();
  await loginAndStart(page);
  await waitForMap(page, "kerningCity");
  await focusGame(page);
  await page.keyboard.press("b");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "true",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-transformation",
    "false",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-nine-tails-last-drain-remaining-mp",
    "0",
  );
  await expect.poll(() => dataNumber(page, "player-max-velocity-x")).toBe(260);
  expect(failures).toEqual([]);
});
