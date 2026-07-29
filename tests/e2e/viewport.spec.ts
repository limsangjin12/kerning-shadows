import { expect, test, type Page } from "@playwright/test";

const VIEWPORTS = [
  { width: 1280, height: 720 },
  { width: 1600, height: 900 },
  { width: 1024, height: 768 },
  { width: 800, height: 600 },
] as const;

interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function expectDialogInsideApp(
  page: Page,
  testId: string,
  appBounds: Bounds,
  stickyControlTestId?: string,
): Promise<void> {
  const dialog = page.getByTestId(testId);
  const dialogBounds = await dialog.boundingBox();
  expect(dialogBounds).not.toBeNull();
  if (!dialogBounds) return;

  expect(dialogBounds.x).toBeGreaterThanOrEqual(appBounds.x - 0.5);
  expect(dialogBounds.y).toBeGreaterThanOrEqual(appBounds.y - 0.5);
  expect(dialogBounds.x + dialogBounds.width).toBeLessThanOrEqual(
    appBounds.x + appBounds.width + 0.5,
  );
  expect(dialogBounds.y + dialogBounds.height).toBeLessThanOrEqual(
    appBounds.y + appBounds.height + 0.5,
  );

  const scrollState = await dialog.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      clientHeight: element.clientHeight,
      clientWidth: element.clientWidth,
      overflowY: style.overflowY,
      scrollHeight: element.scrollHeight,
      scrollWidth: element.scrollWidth,
    };
  });
  expect(["auto", "scroll"]).toContain(scrollState.overflowY);
  expect(scrollState.scrollWidth).toBeLessThanOrEqual(scrollState.clientWidth + 1);
  if (scrollState.scrollHeight > scrollState.clientHeight) {
    await dialog.hover();
    await page.mouse.wheel(0, 1_200);
    await expect
      .poll(() => dialog.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    if (stickyControlTestId) {
      const stickyControl = page.getByTestId(stickyControlTestId);
      const stickyTitle = dialog.locator("h2");
      await expect(stickyControl).toBeVisible();
      await expect(stickyTitle).toBeVisible();
      const stickyBounds = await stickyControl.boundingBox();
      const titleBounds = await stickyTitle.boundingBox();
      expect(stickyBounds).not.toBeNull();
      expect(titleBounds).not.toBeNull();
      if (stickyBounds) {
        expect(stickyBounds.y).toBeGreaterThanOrEqual(dialogBounds.y);
        expect(stickyBounds.y + stickyBounds.height).toBeLessThanOrEqual(
          dialogBounds.y + dialogBounds.height + 0.5,
        );
      }
      if (titleBounds) {
        expect(titleBounds.y).toBeGreaterThanOrEqual(dialogBounds.y);
        expect(titleBounds.y + titleBounds.height).toBeLessThanOrEqual(
          dialogBounds.y + dialogBounds.height + 0.5,
        );
      }
    }
  }
}

test("keeps the game and accessible overlay centered inside supported PC windows", async ({
  page,
}) => {
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    await page.goto("/");
    await page.evaluate(() =>
      window.localStorage.removeItem("kerning-shadows.local-profile.v1"),
    );
    await page.reload();
    await expect(page.locator("#game")).toHaveAttribute("data-assets-ready", "true");

    const bounds = await page.locator("#app").boundingBox();
    const panelBounds = await page.getByTestId("login-screen").boundingBox();
    expect(bounds).not.toBeNull();
    expect(panelBounds).not.toBeNull();
    if (!bounds || !panelBounds) continue;

    expect(bounds.x).toBeGreaterThanOrEqual(-0.5);
    expect(bounds.y).toBeGreaterThanOrEqual(-0.5);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(viewport.width + 0.5);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(viewport.height + 0.5);
    expect(Math.abs(bounds.width / bounds.height - 16 / 9)).toBeLessThan(0.01);
    expect(Math.abs(bounds.x - (viewport.width - bounds.width) / 2)).toBeLessThan(1.1);
    expect(Math.abs(bounds.y - (viewport.height - bounds.height) / 2)).toBeLessThan(1.1);

    expect(panelBounds.x).toBeGreaterThanOrEqual(bounds.x);
    expect(panelBounds.y).toBeGreaterThanOrEqual(bounds.y);
    expect(panelBounds.x + panelBounds.width).toBeLessThanOrEqual(
      bounds.x + bounds.width,
    );
    expect(panelBounds.y + panelBounds.height).toBeLessThanOrEqual(
      bounds.y + bounds.height,
    );

    await page.getByTestId("account-id").fill("viewport-qa");
    await page.getByTestId("password").fill("local-only");
    await page.getByTestId("login-submit").click();
    await expect
      .poll(() => page.locator("#game").getAttribute("data-active-scene"))
      .toMatch(/character-(create|select)/);
    if ((await page.locator("#game").getAttribute("data-active-scene")) === "character-create") {
      await expectDialogInsideApp(page, "character-create-screen", bounds);
      await page.getByTestId("character-name").fill("화면검증");
      await page.getByTestId("create-character").click();
    }
    await expectDialogInsideApp(page, "character-select-screen", bounds);
    await page.getByTestId("start-game").click();
    await expect(page.locator("#game")).toHaveAttribute("data-active-scene", "gameplay");
    await page.locator("#game canvas").focus();
    await expect(page.locator("#game canvas")).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByTestId("game-menu-dialog")).toBeVisible();
    await expectDialogInsideApp(page, "game-menu-dialog", bounds);
    await page.getByTestId("menu-settings").click();
    await expect(page.getByTestId("settings-dialog")).toBeVisible();
    await expectDialogInsideApp(page, "settings-dialog", bounds, "settings-close");
    await page.getByTestId("settings-close").click();

    await page.locator("#game canvas").focus();
    await page.keyboard.press("Escape");
    await page.getByTestId("menu-skill-hotkeys").click();
    await expect(page.getByTestId("skill-hotkey-dialog")).toBeVisible();
    await expect(page.getByTestId("skill-hotbar-slot-extra-Shift")).toBeVisible();
    await expect(page.getByTestId("skill-hotbar-slot-extra-V")).toBeVisible();
    await expect(page.getByTestId("skill-hotbar-slot-extra-Z")).toHaveCount(0);
    expect(
      await page.locator(".skill-extra-hotbar-editor").evaluate(
        (element) => element.scrollWidth <= element.clientWidth,
      ),
    ).toBe(true);
    await expectDialogInsideApp(
      page,
      "skill-hotkey-dialog",
      bounds,
      "skill-hotkey-close",
    );
    await page.getByTestId("skill-hotkey-close").click();

    await page.locator("#game canvas").focus();
    await page.keyboard.press("s");
    await expect(page.getByTestId("stats-dialog")).toBeVisible();
    await expect(page.getByTestId("equipment-dialog")).toBeVisible();
    await expectDialogInsideApp(page, "stats-dialog", bounds, "stats-close");
    await page.getByTestId("stats-close").click();

    await page.locator("#game canvas").focus();
    await page.keyboard.press("i");
    await expect(page.getByTestId("inventory-dialog")).toBeVisible();
    await expectDialogInsideApp(
      page,
      "inventory-dialog",
      bounds,
      "inventory-close",
    );
    await page.getByTestId("inventory-close").click();

    await page.locator("#game canvas").focus();
    await page.keyboard.press("k");
    await expect(page.getByTestId("skill-dialog")).toBeVisible();
    await expectDialogInsideApp(page, "skill-dialog", bounds, "skill-close");
    await page.getByTestId("skill-close").click();
  }
});
