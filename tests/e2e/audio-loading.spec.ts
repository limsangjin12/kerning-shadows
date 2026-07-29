import { expect, test, type Page } from "@playwright/test";

const GAME = "#game";

async function loginAndStart(page: Page): Promise<void> {
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("audio-loading-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").click();
  await expect
    .poll(() => page.locator(GAME).getAttribute("data-active-scene"))
    .toMatch(/character-(create|select)/);
  if (
    (await page.locator(GAME).getAttribute("data-active-scene")) ===
    "character-create"
  ) {
    await page.getByTestId("character-name").fill("오디오검증");
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

test("loads the boss theme only after entering a living-boss map", async ({
  page,
}) => {
  let bossThemeRequests = 0;
  let blockBossTheme = false;
  let releaseBossTheme!: () => void;
  const bossThemeBlocked = new Promise<void>((resolve) => {
    releaseBossTheme = resolve;
  });
  await page.route("**/boss-theme-v1*.mp3", async (route) => {
    bossThemeRequests += 1;
    if (blockBossTheme) {
      await bossThemeBlocked;
    }
    await route.continue();
  });

  await page.goto("/");
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "kerningCity",
  );
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-bgm",
    "audio-bgm-game-theme",
  );
  expect(bossThemeRequests).toBe(0);

  blockBossTheme = true;
  await page.evaluate(() => {
    const key = "kerning-shadows.local-profile.v1";
    const profile = JSON.parse(window.localStorage.getItem(key) ?? "{}");
    profile.location = "emberMine";
    profile.dungeonBossQuest = { id: "moonlitSeal", stage: "midboss" };
    window.localStorage.setItem(key, JSON.stringify(profile));
  });
  await page.reload();
  await loginAndStart(page);
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-map",
    "emberMine",
  );

  try {
    await expect.poll(() => bossThemeRequests).toBe(1);
    await expect(page.locator(GAME)).toHaveAttribute(
      "data-active-bgm",
      "audio-bgm-game-theme",
    );
  } finally {
    releaseBossTheme();
  }

  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-bgm",
    "audio-bgm-boss-theme",
  );
  expect(bossThemeRequests).toBe(1);
});
