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
  return Number(await page.locator(GAME).getAttribute(`data-${name}`));
}

async function inventory(page: Page): Promise<Record<string, number>> {
  return JSON.parse(
    (await page.locator(GAME).getAttribute("data-player-inventory")) ?? "{}",
  ) as Record<string, number>;
}

async function loginAndStart(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("inventory-item-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
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

async function seedConsumables(page: Page): Promise<void> {
  await page.evaluate((profileKey) => {
    window.localStorage.setItem(
      profileKey,
      JSON.stringify({
        schemaVersion: 14,
        character: {
          id: "local-player",
          name: "소모품도적",
          level: 10,
          job: "beginner",
          hp: 100,
          maxHp: 400,
          mp: 50,
          maxMp: 300,
          mesos: 0,
          stats: { str: 4, dex: 13, int: 4, luk: 4 },
          statPoints: 0,
          autoAllocateStats: false,
          skillPoints: 0,
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
            nineTailsTransformation: 0,
            tailedBeastBomb: 0,
            teamAssault: 0,
            thunderOrb: 0,
            sageMode: 0,
          },
        },
        location: "kerningCity",
        exp: 17,
        inventory: {
          recoveryBottle: 2,
          mushroomCap: 1,
          experienceBook: 1,
        },
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
      }),
    );
  }, PROFILE_KEY);
}

test("uses recovery and growth consumables from the inventory and persists them", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await seedConsumables(page);
  await page.reload();
  await loginAndStart(page);

  await page.locator(CANVAS).focus();
  await expect(page.locator(CANVAS)).toBeFocused();
  await page.keyboard.press("i");
  const dialog = page.getByTestId("inventory-dialog");
  await expect(dialog).toBeVisible();

  await page.getByTestId("inventory-slot-mushroomCap").click();
  await expect(dialog.locator(".inventory-use-action")).toHaveCount(0);

  const hpBefore = await dataNumber(page, "player-hp");
  const mpBefore = await dataNumber(page, "player-mp");
  await page.getByTestId("inventory-slot-recoveryBottle").click();
  const recoveryUse = page.getByTestId("inventory-use-recoveryBottle");
  await expect(recoveryUse).toBeFocused();
  await recoveryUse.press("Enter");
  await expect
    .poll(async () => (await inventory(page)).recoveryBottle)
    .toBe(1);
  expect(await dataNumber(page, "player-hp")).toBeGreaterThan(hpBefore);
  expect(await dataNumber(page, "player-hp")).toBeLessThanOrEqual(400);
  expect(await dataNumber(page, "player-mp")).toBeGreaterThan(mpBefore);
  expect(await dataNumber(page, "player-mp")).toBeLessThanOrEqual(300);
  await expect(recoveryUse).toHaveAttribute("aria-label", /보유 1개/);

  await page.getByTestId("inventory-slot-experienceBook").click();
  const bookUse = page.getByTestId("inventory-use-experienceBook");
  await expect(bookUse).toBeFocused();
  await bookUse.press("Space");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "20");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-exp", "17");
  await expect(page.getByTestId("inventory-slot-experienceBook")).toHaveCount(0);
  await expect(page.getByTestId("inventory-capacity")).toContainText(
    "3 / 24칸",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "experience-book-used:10",
  );

  await page.getByTestId("inventory-close").click();
  await expect(page.locator(CANVAS)).toBeFocused();

  const stored = (await page.evaluate(
    (profileKey) =>
      JSON.parse(window.localStorage.getItem(profileKey) ?? "null"),
    PROFILE_KEY,
  )) as {
    character: { level: number };
    exp: number;
    inventory: Record<string, number>;
  };
  expect(stored).toMatchObject({
    character: { level: 20 },
    exp: 17,
    inventory: {
      recoveryBottle: 1,
      mushroomCap: 1,
      experienceBook: 0,
    },
  });

  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "20");
  await expect.poll(() => inventory(page)).toMatchObject({
    recoveryBottle: 1,
    mushroomCap: 1,
    experienceBook: 0,
  });
  expect(failures).toEqual([]);
});
