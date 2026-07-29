import { expect, test, type Page } from "@playwright/test";

const GAME = "#game";
const CANVAS = "#game canvas";
const PROFILE_KEY = "kerning-shadows.local-profile.v1";

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
  return Number((await page.locator(GAME).getAttribute(`data-${name}`)) ?? NaN);
}

async function dataText(page: Page, name: string): Promise<string> {
  return (await page.locator(GAME).getAttribute(`data-${name}`)) ?? "";
}

async function focusGame(page: Page): Promise<void> {
  await page.locator(CANVAS).focus();
  await expect(page.locator(CANVAS)).toBeFocused();
}

async function interact(page: Page): Promise<void> {
  await focusGame(page);
  await page.keyboard.press("ArrowUp", { delay: 80 });
  await page.waitForTimeout(120);
}

async function moveToX(
  page: Page,
  targetX: number,
  tolerance = 65,
): Promise<void> {
  for (let correction = 0; correction < 32; correction += 1) {
    await focusGame(page);
    const currentX = await dataNumber(page, "player-x");
    const distance = Math.abs(currentX - targetX);
    if (distance <= tolerance) return;
    const key = currentX < targetX ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key);
    try {
      await page.waitForTimeout(
        Math.min(650, Math.max(90, Math.round((distance / 260) * 760))),
      );
    } finally {
      await page.keyboard.up(key);
    }
    await page.waitForTimeout(160);
  }
  throw new Error(
    `Could not move to x=${targetX}; current=${await dataNumber(page, "player-x")}`,
  );
}

async function seedProfile(
  page: Page,
  options: {
    location?: "kerningCity" | "greenMushroomCave";
    mesos?: number;
    duaRegistered?: boolean;
    powerful?: boolean;
  },
): Promise<void> {
  await page.evaluate(
    ({ key, seed }) => {
      const powerful = seed.powerful ?? false;
      window.localStorage.setItem(
        key,
        JSON.stringify({
          schemaVersion: 15,
          character: {
            id: "local-player",
            name: "두아친구",
            level: powerful ? 200 : 10,
            job: powerful ? "hokage" : "beginner",
            hp: powerful ? 100_000 : 400,
            maxHp: powerful ? 100_000 : 400,
            mp: powerful ? 100_000 : 300,
            maxMp: powerful ? 100_000 : 300,
            mesos: seed.mesos ?? 0,
            stats: powerful
              ? { str: 10_000, dex: 10_000, int: 10_000, luk: 10_000 }
              : { str: 4, dex: 25, int: 4, luk: 37 },
            statPoints: 0,
            autoAllocateStats: false,
            skillPoints: 0,
            skillLevels: {
              luckySeven: powerful ? 20 : 0,
              shadowVolley: powerful ? 20 : 0,
              keenSight: powerful ? 20 : 0,
              drain: powerful ? 20 : 0,
              phantomStars: powerful ? 20 : 0,
              criticalThrow: powerful ? 20 : 0,
              avenger: powerful ? 20 : 0,
              abyssRain: powerful ? 20 : 0,
              shadowBreathing: powerful ? 20 : 0,
              rasengan: powerful ? 20 : 0,
              nineTailsTransformation: powerful ? 20 : 0,
              tailedBeastBomb: powerful ? 20 : 0,
              teamAssault: powerful ? 20 : 0,
              thunderOrb: powerful ? 20 : 0,
              sageMode: powerful ? 20 : 0,
            },
          },
          location: seed.location ?? "kerningCity",
          exp: 0,
          inventory: {},
          throwingStars: { owned: ["tier1"], equipped: "tier1" },
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
          activeJobAdvancementQuest: null,
          dungeonBossQuest: { id: "moonlitSeal", stage: "offer" },
          pets: { dua: { registered: seed.duaRegistered ?? false } },
        }),
      );
    },
    { key: PROFILE_KEY, seed: options },
  );
}

async function loginAndStart(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("dua-pet-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await page.getByTestId("start-game").click();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "gameplay",
  );
  await focusGame(page);
}

test("buys a Puppuccino, registers Dua, follows, and restores the pet", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { mesos: 50_000 });
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute("data-active-map", "kerningCity");
  await expect(page.locator(GAME)).toHaveAttribute("data-mini-map-npc-count", "5");
  await expect(page.locator(GAME)).toHaveAttribute("data-pet-active", "false");

  await moveToX(page, 1_210);
  await interact(page);
  await expect(page.getByTestId("shop-dialog")).toBeVisible();
  await page.getByTestId("purchase-puppuccino").click();
  await expect(page.getByTestId("shop-wallet")).toContainText("보유 메소 0");
  await expect(page.getByTestId("puppuccino-owned")).toHaveText("보유 1개");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "shop-purchased:puppuccino",
  );
  await page.getByTestId("shop-close").click();

  await moveToX(page, 430);
  await interact(page);
  const dialog = page.getByTestId("dua-adoption-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText("멍푸치노 향");
  await expect(page.getByTestId("dua-puppuccino-owned")).toHaveText(
    "멍푸치노 보유 1개",
  );
  await page.getByTestId("give-puppuccino-to-dua").click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator(GAME)).toHaveAttribute("data-pet-active", "true");
  await expect(page.locator(GAME)).toHaveAttribute("data-mini-map-npc-count", "4");
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "dua-registered",
  );
  expect(JSON.parse(await dataText(page, "player-inventory"))).toMatchObject({
    puppuccino: 0,
  });

  const adoptionX = await dataNumber(page, "pet-x");
  await moveToX(page, 960);
  await expect
    .poll(async () => ({
      moved: (await dataNumber(page, "pet-x")) > adoptionX + 180,
      distance: Math.abs(
        (await dataNumber(page, "player-x")) -
          (await dataNumber(page, "pet-x")),
      ),
    }))
    .toMatchObject({ moved: true, distance: expect.any(Number) });
  expect(
    Math.abs(
      (await dataNumber(page, "player-x")) - (await dataNumber(page, "pet-x")),
    ),
  ).toBeLessThan(190);
  const stored = await page.evaluate((key) =>
    JSON.parse(window.localStorage.getItem(key) ?? "null"), PROFILE_KEY);
  expect(stored).toMatchObject({
    schemaVersion: 15,
    pets: { dua: { registered: true } },
    inventory: { puppuccino: 0 },
  });

  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute("data-pet-active", "true");
  await expect(page.locator(GAME)).toHaveAttribute("data-mini-map-npc-count", "4");
  expect(failures).toEqual([]);
});

test("Dua keeps pace and jumps onto the player's upper platform", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, { duaRegistered: true });
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute("data-active-map", "kerningCity");

  await moveToX(page, 520, 35);
  await expect
    .poll(
      async () =>
        Math.abs(
          (await dataNumber(page, "player-x")) -
            (await dataNumber(page, "pet-x")),
        ),
      { timeout: 5_000 },
    )
    .toBeLessThan(130);

  const groundY = await dataNumber(page, "player-y");
  await focusGame(page);
  await page.keyboard.press("Alt", { delay: 60 });
  await expect
    .poll(() => dataNumber(page, "player-y"), { timeout: 2_000 })
    .toBeLessThan(groundY - 100);
  await expect
    .poll(() => dataNumber(page, "pet-y"), { timeout: 5_000 })
    .toBeLessThan(groundY - 100);
  await expect
    .poll(
      async () =>
        Math.abs(
          (await dataNumber(page, "player-y")) -
            (await dataNumber(page, "pet-y")),
        ),
      { timeout: 5_000 },
    )
    .toBeLessThan(55);
  expect(failures).toEqual([]);
});

test("Dua collects grounded monster loot without a manual loot key", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedProfile(page, {
    location: "greenMushroomCave",
    duaRegistered: true,
    powerful: true,
  });
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "greenMushroomCave",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-pet-active", "true");

  const initialMonsters = await dataNumber(page, "monsters-alive");
  for (const x of [420, 560, 700, 560, 420]) {
    if ((await dataNumber(page, "monsters-alive")) < initialMonsters) break;
    await moveToX(page, x, 35);
    await focusGame(page);
    await page.keyboard.press("Control");
    await page.waitForTimeout(650);
  }
  await expect
    .poll(() => dataNumber(page, "monsters-alive"), { timeout: 20_000 })
    .toBeLessThan(initialMonsters);
  await expect
    .poll(() => dataText(page, "last-combat-event"), { timeout: 20_000 })
    .toMatch(/^pet-loot-collected:/);
  await expect
    .poll(async () => {
      const inventory = JSON.parse(
        (await dataText(page, "player-inventory")) || "{}",
      ) as Record<string, number>;
      return {
        mesos: await dataNumber(page, "player-mesos"),
        mushroomCaps: inventory.mushroomCap ?? 0,
        loot: await dataNumber(page, "runtime-loot"),
      };
    }, { timeout: 20_000 })
    .toMatchObject({
      mesos: expect.any(Number),
      mushroomCaps: 1,
      loot: 0,
    });
  expect(await dataNumber(page, "player-mesos")).toBeGreaterThan(0);
  expect(failures).toEqual([]);
});
