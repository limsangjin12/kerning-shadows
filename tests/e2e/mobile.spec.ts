import { expect, test, type Page } from "@playwright/test";

const GAME = "#game";
const CANVAS = "#game canvas";

test.use({
  viewport: { width: 844, height: 390 },
  hasTouch: true,
});

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

async function expectPortraitSurface(
  page: Page,
  testId: string,
  stickyControlTestId?: string,
): Promise<void> {
  const surface = page.getByTestId(testId);
  await expect(surface).toBeVisible();
  const metrics = await surface.evaluate((element) => {
    const panel = element as HTMLElement;
    const rect = panel.getBoundingClientRect();
    const controls = Array.from(
      panel.querySelectorAll<HTMLElement>(
        'button, input:not([type="checkbox"]):not([type="radio"]), select, textarea, a[href]',
      ),
    )
      .filter((control) => getComputedStyle(control).display !== "none")
      .map((control) => {
        const controlRect = control.getBoundingClientRect();
        return {
          tag: control.tagName,
          testId: control.dataset.testid ?? "",
          x: controlRect.x,
          right: controlRect.right,
          height: controlRect.height,
          fontSize: Number.parseFloat(getComputedStyle(control).fontSize),
        };
      });
    return {
      x: rect.x,
      y: rect.y,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      clientWidth: panel.clientWidth,
      scrollWidth: panel.scrollWidth,
      scrollHeight: panel.scrollHeight,
      controls,
    };
  });

  expect(metrics.x, `${testId} left edge`).toBeGreaterThanOrEqual(0);
  expect(metrics.y, `${testId} top edge`).toBeGreaterThanOrEqual(0);
  expect(metrics.right, `${testId} right edge`).toBeLessThanOrEqual(390);
  expect(metrics.bottom, `${testId} bottom edge`).toBeLessThanOrEqual(844);
  expect(
    metrics.width,
    `${testId} should use the portrait width`,
  ).toBeGreaterThan(360);
  expect(
    metrics.height,
    `${testId} should use the portrait height`,
  ).toBeGreaterThan(800);
  expect(
    metrics.scrollWidth,
    `${testId} should not scroll horizontally`,
  ).toBeLessThanOrEqual(metrics.clientWidth + 1);

  for (const control of metrics.controls) {
    const label = control.testId || control.tag;
    expect(control.x, `${testId} ${label} left edge`).toBeGreaterThanOrEqual(
      metrics.x - 1,
    );
    expect(control.right, `${testId} ${label} right edge`).toBeLessThanOrEqual(
      metrics.right + 1,
    );
    if (control.tag === "BUTTON" || control.tag === "A") {
      expect(
        control.height,
        `${testId} ${label} touch target`,
      ).toBeGreaterThanOrEqual(44);
    }
    if (
      control.tag === "INPUT" ||
      control.tag === "SELECT" ||
      control.tag === "TEXTAREA"
    ) {
      expect(
        control.fontSize,
        `${testId} ${label} mobile font size`,
      ).toBeGreaterThanOrEqual(16);
    }
  }

  if (!stickyControlTestId) return;
  await surface.evaluate((element) => {
    element.scrollTo({ top: element.scrollHeight });
  });
  const stickyControl = page.getByTestId(stickyControlTestId);
  await expect(stickyControl).toBeVisible();
  const stickyBounds = await stickyControl.boundingBox();
  expect(
    stickyBounds,
    `${stickyControlTestId} should have bounds`,
  ).not.toBeNull();
  expect(stickyBounds!.x).toBeGreaterThanOrEqual(0);
  expect(stickyBounds!.y).toBeGreaterThanOrEqual(0);
  expect(stickyBounds!.x + stickyBounds!.width).toBeLessThanOrEqual(390);
  expect(stickyBounds!.y + stickyBounds!.height).toBeLessThanOrEqual(844);
}

async function openPortraitMenu(page: Page): Promise<void> {
  await page.getByTestId("mobile-menu").tap();
  await expect(page.getByTestId("game-menu-dialog")).toBeVisible();
}

async function expectControlLeftOf(
  page: Page,
  leftTestId: string,
  rightTestId: string,
): Promise<void> {
  const leftBounds = await page.getByTestId(leftTestId).boundingBox();
  const rightBounds = await page.getByTestId(rightTestId).boundingBox();
  expect(leftBounds, `${leftTestId} should have bounds`).not.toBeNull();
  expect(rightBounds, `${rightTestId} should have bounds`).not.toBeNull();
  expect(
    leftBounds!.x + leftBounds!.width,
    `${leftTestId} should be left of ${rightTestId}`,
  ).toBeLessThan(rightBounds!.x);
}

test("focuses the nickname field from an empty slot tap and accepts Korean jamo", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("mobile-name-focus-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-create",
  );
  await page.getByTestId("character-name").fill("첫캐릭터");
  await page.getByTestId("create-character").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-select",
  );

  await page.getByTestId("character-slot-2").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-create",
  );
  const nameInput = page.getByTestId("character-name");
  await expect(nameInput).toBeFocused();
  await nameInput.fill("ㄱㅏ");
  await expect(page.getByTestId("character-name-status")).toHaveText(
    "사용할 수 있는 닉네임입니다.",
  );
  await expect(page.getByTestId("create-character")).toBeEnabled();
  await page.getByTestId("create-character").tap();
  await expect(page.getByTestId("character-slot-2")).toHaveAttribute(
    "aria-label",
    /ㄱㅏ/,
  );
  expect(failures).toEqual([]);
});

async function movePlayerToX(
  page: Page,
  targetX: number,
  tolerance = 35,
): Promise<void> {
  for (let correction = 0; correction < 16; correction += 1) {
    const currentX = Number(
      await page.locator(GAME).getAttribute("data-player-x"),
    );
    const distance = Math.abs(currentX - targetX);
    if (distance <= tolerance) return;
    await page.locator(CANVAS).focus();
    const key = currentX < targetX ? "ArrowRight" : "ArrowLeft";
    await page.keyboard.down(key);
    await page.waitForTimeout(
      Math.min(450, Math.max(70, Math.round(distance * 1.6))),
    );
    await page.keyboard.up(key);
    await page.waitForTimeout(180);
  }
  throw new Error(`Could not position the mobile player at x=${targetX}.`);
}

test("supports a boosted Hokage with landscape mobile touch controls", async ({
  page,
  browserName,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.goto("/");
  const audioNotice = page.getByTestId("initial-audio-notice");
  await expect(audioNotice).toBeVisible();
  await expect(audioNotice).toHaveText(
    "이 게임은 PC 환경에 최적화되어 있습니다. BGM과 함께 플레이하려면 매너모드를 해제해주세요",
  );
  await expect(audioNotice).toHaveCSS("animation-duration", "3s");
  await expect(audioNotice).toBeHidden({ timeout: 5_000 });
  await expect(page.locator("html")).toHaveAttribute(
    "data-input-mode",
    "touch",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");
  await page.getByTestId("account-id").fill("mobile-boost-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "character-create",
  );

  await page.getByTestId("character-name").fill("모바일호카게");
  const boost = page.getByTestId("boost-character-toggle");
  await expect(boost).toHaveAttribute("aria-pressed", "false");
  await boost.tap();
  await expect(boost).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByTestId("create-character")).toContainText(
    "부스트 캐릭터 생성",
  );
  await page.getByTestId("create-character").tap();

  const stored = await page.evaluate(() =>
    JSON.parse(
      window.localStorage.getItem("kerning-shadows.local-profile.v1") ?? "null",
    ),
  );
  expect(stored).toMatchObject({
    schemaVersion: 16,
    character: {
      name: "모바일호카게",
      level: 120,
      job: "hokage",
      hp: 1_734,
      maxHp: 1_734,
      mp: 867,
      maxMp: 867,
      autoAllocateStats: true,
    },
  });
  expect(Object.values(stored.character.skillLevels)).toEqual(
    Array(15).fill(20),
  );

  await page.getByTestId("start-game").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "gameplay",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-player-level", "120");
  await expect(page.locator(GAME)).toHaveAttribute("data-player-job", "hokage");

  const appBounds = await page.locator("#app").boundingBox();
  expect(appBounds?.x).toBeCloseTo(0, 1);
  expect(appBounds?.y).toBeCloseTo(0, 1);
  expect(appBounds?.width).toBeCloseTo(844, 0);
  expect(appBounds?.height).toBeCloseTo(390, 0);
  const controls = page.getByTestId("mobile-game-controls");
  await expect(controls).toBeVisible();
  await expect(page.getByTestId("mobile-movement-joystick")).toBeVisible();
  await expect(page.getByTestId("mobile-jump")).toBeVisible();
  await expect(page.getByTestId("mobile-move")).toBeVisible();
  await expect(page.getByTestId("mobile-dialog")).toBeHidden();
  await expect(page.getByTestId("mobile-basic-attack")).toBeVisible();
  await expect(page.getByTestId("mobile-loot")).toBeVisible();
  await expectControlLeftOf(page, "mobile-move", "mobile-loot");
  await expect(page.locator(".mobile-skill-button")).toHaveCount(4);
  await expect(page.getByTestId("mobile-skill-1")).toHaveAttribute(
    "data-skill-id",
    "rasengan",
  );
  await expect(page.getByTestId("mobile-skill-2")).toHaveAttribute(
    "data-skill-id",
    "tailedBeastBomb",
  );
  await expect(page.getByTestId("mobile-skill-3")).toHaveAttribute(
    "data-skill-id",
    "teamAssault",
  );
  await expect(page.getByTestId("mobile-skill-4")).toHaveAttribute(
    "data-skill-id",
    "thunderOrb",
  );

  await page.setViewportSize({ width: 390, height: 844 });
  const portraitAppBounds = await page.locator("#app").boundingBox();
  expect(portraitAppBounds?.x).toBeCloseTo(0, 1);
  expect(portraitAppBounds?.y).toBeCloseTo(0, 1);
  expect(portraitAppBounds?.width).toBeCloseTo(390, 0);
  expect(portraitAppBounds?.height).toBeCloseTo(844, 0);
  for (const testId of [
    "mobile-movement-joystick",
    "mobile-jump",
    "mobile-move",
    "mobile-basic-attack",
    "mobile-loot",
    "mobile-skill-1",
    "mobile-skill-2",
    "mobile-skill-3",
    "mobile-skill-4",
    "mobile-menu",
  ]) {
    const bounds = await page.getByTestId(testId).boundingBox();
    expect(
      bounds,
      `${testId} should have bounds in portrait mode`,
    ).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  }
  await expectControlLeftOf(page, "mobile-move", "mobile-loot");
  await page.setViewportSize({ width: 844, height: 390 });

  const joystick = page.getByTestId("mobile-movement-joystick");
  const joystickBounds = await joystick.boundingBox();
  if (!joystickBounds)
    throw new Error("Mobile joystick bounds are unavailable.");
  const startX = Number(await page.locator(GAME).getAttribute("data-player-x"));
  await page.mouse.move(
    joystickBounds.x + joystickBounds.width / 2,
    joystickBounds.y + joystickBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    joystickBounds.x + joystickBounds.width * 0.9,
    joystickBounds.y + joystickBounds.height / 2,
  );
  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-player-x")),
    )
    .toBeGreaterThan(startX + 100);
  await page.mouse.up();
  await movePlayerToX(page, 430, 25);

  const jump = page.getByTestId("mobile-jump");
  const dialog = page.getByTestId("mobile-dialog");
  const move = page.getByTestId("mobile-move");
  await expect(jump).toBeVisible();
  await expect(dialog).toBeVisible();
  await expect(move).toBeHidden();
  await expectControlLeftOf(page, "mobile-dialog", "mobile-loot");
  await dialog.tap();
  await expect(page.getByTestId("dua-adoption-dialog")).toBeVisible();
  await page.getByTestId("dua-dialog-close").tap();
  await expect(controls).toBeVisible();

  await movePlayerToX(page, 560);
  await expect(jump).toBeVisible();
  const startY = Number(await page.locator(GAME).getAttribute("data-player-y"));
  await jump.tap();
  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-player-y")),
    )
    .toBeLessThan(startY - 8);
  await expect
    .poll(() => page.locator(GAME).getAttribute("data-player-animation"), {
      timeout: 2_000,
    })
    .toBe("idle");
  const platformY = Number(
    await page.locator(GAME).getAttribute("data-player-y"),
  );
  expect(platformY).toBeLessThan(startY - 100);
  await page.mouse.move(
    joystickBounds.x + joystickBounds.width / 2,
    joystickBounds.y + joystickBounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    joystickBounds.x + joystickBounds.width / 2,
    joystickBounds.y + joystickBounds.height * 0.9,
  );
  const jumpBounds = await jump.boundingBox();
  if (!jumpBounds) throw new Error("Mobile jump bounds are unavailable.");
  if (browserName === "chromium") {
    await page.touchscreen.tap(
      jumpBounds.x + jumpBounds.width / 2,
      jumpBounds.y + jumpBounds.height / 2,
    );
  } else {
    await page.keyboard.press("Alt");
  }
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "platform-drop-through",
  );
  await expect
    .poll(async () =>
      Number(await page.locator(GAME).getAttribute("data-player-y")),
    )
    .toBeGreaterThan(platformY + 40);
  await page.mouse.up();

  await page.getByTestId("mobile-basic-attack").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "basicAttack-attack",
  );
  await page.waitForTimeout(900);
  await page.getByTestId("mobile-skill-1").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-last-combat-event",
    "rasengan-attack",
  );

  await page.waitForTimeout(1_400);
  await page.getByTestId("mobile-menu").tap();
  await expect(page.getByTestId("game-menu-dialog")).toBeVisible();
  await expect(controls).toBeHidden();
  await page.getByTestId("game-menu-close").tap();
  await expect(page.locator(CANVAS)).toBeFocused();
  await expect(controls).toBeVisible();
  expect(failures).toEqual([]);
});

test("keeps every primary screen and HUD control reachable in portrait mode", async ({
  page,
}) => {
  const failures = monitorBrowserFailures(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute(
    "data-input-mode",
    "touch",
  );
  await expect(page.locator(GAME)).toHaveAttribute("data-assets-ready", "true");

  await expectPortraitSurface(page, "login-screen");
  await page.getByTestId("account-id").fill("portrait-full-screen-qa");
  await page.getByTestId("password").fill("local-only");
  await page.getByTestId("login-submit").tap();

  await expectPortraitSurface(
    page,
    "character-create-screen",
    "create-character",
  );
  await page.getByTestId("character-name").fill("세로화면호카게");
  await page.getByTestId("boost-character-toggle").tap();
  await page.getByTestId("create-character").tap();

  await expectPortraitSurface(page, "character-select-screen", "start-game");
  await page.getByTestId("start-game").tap();
  await expect(page.locator(GAME)).toHaveAttribute(
    "data-active-scene",
    "gameplay",
  );

  const controls = page.getByTestId("mobile-game-controls");
  await expect(controls).toBeVisible();
  for (const testId of [
    "mobile-movement-joystick",
    "mobile-jump",
    "mobile-move",
    "mobile-basic-attack",
    "mobile-loot",
    "mobile-skill-1",
    "mobile-skill-2",
    "mobile-skill-3",
    "mobile-skill-4",
    "mobile-menu",
  ]) {
    const bounds = await page.getByTestId(testId).boundingBox();
    expect(bounds, `${testId} should have portrait bounds`).not.toBeNull();
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  }
  await expectControlLeftOf(page, "mobile-move", "mobile-loot");

  const hudButtons = page.locator("#hud-window-controls button");
  await expect(hudButtons).toHaveCount(3);
  for (let index = 0; index < 3; index += 1) {
    const bounds = await hudButtons.nth(index).boundingBox();
    expect(bounds, `HUD button ${index + 1} should have bounds`).not.toBeNull();
    expect(bounds!.width).toBe(28);
    expect(bounds!.height).toBe(28);
    expect(bounds!.x).toBeGreaterThanOrEqual(0);
    expect(bounds!.y).toBeGreaterThanOrEqual(0);
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844);
  }

  await openPortraitMenu(page);
  await expectPortraitSurface(page, "game-menu-dialog", "game-menu-close");
  await page.getByTestId("menu-settings").tap();
  await expectPortraitSurface(page, "settings-dialog", "settings-close");
  await page.getByTestId("settings-close").tap();
  await expect(controls).toBeVisible();

  await openPortraitMenu(page);
  await page.getByTestId("menu-inventory").tap();
  await expectPortraitSurface(page, "inventory-dialog", "inventory-close");
  await page.getByTestId("inventory-close").tap();

  await openPortraitMenu(page);
  await page.getByTestId("menu-stats").tap();
  await expectPortraitSurface(page, "stats-dialog", "stats-close");
  await page.getByTestId("stats-close").tap();

  await openPortraitMenu(page);
  await page.getByTestId("menu-skills").tap();
  await expectPortraitSurface(page, "skill-dialog", "skill-close");
  await page.getByTestId("skill-close").tap();

  await openPortraitMenu(page);
  await page.getByTestId("menu-skill-hotkeys").tap();
  await expectPortraitSurface(
    page,
    "skill-hotkey-dialog",
    "skill-hotkey-close",
  );
  await expect(
    page.locator('.skill-hotbar-slot[data-hotkey-kind="number"]:visible'),
  ).toHaveCount(4);
  await expect(page.locator(".skill-extra-hotbar-editor")).toBeHidden();
  await expect(page.locator(".skill-hotkey-choice:visible")).toHaveCount(4);
  const slotMetrics = await page
    .locator(".skill-hotbar-slots")
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
  expect(slotMetrics.scrollWidth).toBeLessThanOrEqual(
    slotMetrics.clientWidth + 1,
  );
  await page.getByTestId("skill-hotbar-slot-1").tap();
  await page.getByTestId("skill-hotkey-choice-thunderOrb").tap();
  await page.getByTestId("skill-hotkey-close").tap();
  await expect(controls).toBeVisible();
  await expect(page.getByTestId("mobile-skill-1")).toHaveAttribute(
    "data-skill-id",
    "thunderOrb",
  );
  await expect(page.getByTestId("mobile-skill-2")).toHaveAttribute(
    "data-skill-id",
    "tailedBeastBomb",
  );
  await expect(page.getByTestId("mobile-skill-3")).toHaveAttribute(
    "data-skill-id",
    "teamAssault",
  );
  await expect(page.getByTestId("mobile-skill-4")).toHaveAttribute(
    "data-skill-id",
    "rasengan",
  );
  expect(failures).toEqual([]);
});
