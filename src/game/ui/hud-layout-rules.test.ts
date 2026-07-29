import { describe, expect, it } from "vitest";
import {
  GAMEPLAY_WORLD_LIFT,
  HUD_COLLAPSED_SAFE_PADDING,
  HUD_CONTENT_BOUNDS,
  HUD_INNER_CELL_PADDING,
  HUD_METER_CELL_PADDING,
  HUD_PANEL_BOUNDS,
  HUD_SAFE_PADDING,
  countHudPaddingViolations,
  formatHudCompactInteger,
  formatHudMeterValue,
  gameplayCameraBoundsHeight,
  hudFloatingPanelBounds,
  hudFloatingPanelLayout,
  hudPanelCenter,
  hudRectangleFitsPanel,
  hudRectanglesConflict,
  hudTextBoundsConflict,
  hudTextFitsPanel,
  miniMapProjection,
  projectMiniMapPoint,
  sumHudIntegerValues,
} from "./hud-layout-rules";

describe("gameplay HUD safe padding", () => {
  it("keeps the fixed HUD panels on the 1280 by 720 canvas", () => {
    for (const panel of Object.values(HUD_PANEL_BOUNDS)) {
      expect(panel.x).toBeGreaterThanOrEqual(0);
      expect(panel.y).toBeGreaterThanOrEqual(0);
      expect(panel.x + panel.width).toBeLessThanOrEqual(1280);
      expect(panel.y + panel.height).toBeLessThanOrEqual(720);
    }
    expect(hudPanelCenter(HUD_PANEL_BOUNDS.controls)).toEqual({ x: 1038, y: 85 });
  });

  it("keeps every HUD chrome region inside its owning panel", () => {
    const panelByContent = {
      miniMapHeader: HUD_PANEL_BOUNDS.miniMap,
      miniMapInfo: HUD_PANEL_BOUNDS.miniMap,
      miniMapBody: HUD_PANEL_BOUNDS.miniMap,
      controlsHeader: HUD_PANEL_BOUNDS.controls,
      controlsBody: HUD_PANEL_BOUNDS.controls,
      controlsFooter: HUD_PANEL_BOUNDS.controls,
      questHeader: HUD_PANEL_BOUNDS.quest,
      questBody: HUD_PANEL_BOUNDS.quest,
      bossBar: HUD_PANEL_BOUNDS.boss,
    } as const;

    for (const [name, rectangle] of Object.entries(HUD_CONTENT_BOUNDS)) {
      expect(
        hudRectangleFitsPanel(
          rectangle,
          panelByContent[name as keyof typeof panelByContent],
        ),
      ).toBe(true);
    }
  });

  it("centers collapsed title bars and shifts their header content upward", () => {
    expect(hudFloatingPanelLayout(HUD_PANEL_BOUNDS.miniMap, false)).toEqual({
      height: 218,
      centerY: 115,
      headerShiftY: 0,
    });
    expect(hudFloatingPanelLayout(HUD_PANEL_BOUNDS.miniMap, true)).toEqual({
      height: 36,
      centerY: 24,
      headerShiftY: -8,
    });
    expect(hudFloatingPanelLayout(HUD_PANEL_BOUNDS.quest, true)).toEqual({
      height: 36,
      centerY: 250,
      headerShiftY: -8,
    });
    expect(hudFloatingPanelBounds(HUD_PANEL_BOUNDS.quest, true)).toEqual({
      ...HUD_PANEL_BOUNDS.quest,
      height: 36,
    });
    expect(HUD_COLLAPSED_SAFE_PADDING).toEqual({ x: 18, y: 8 });
  });

  it("projects world points into the centered minimap viewport", () => {
    const projection = miniMapProjection(
      1920,
      720,
      HUD_CONTENT_BOUNDS.miniMapBody,
    );
    const center = projectMiniMapPoint({ x: 960, y: 360 }, projection);
    const topLeft = projectMiniMapPoint({ x: 0, y: 0 }, projection);
    const bottomRight = projectMiniMapPoint({ x: 1920, y: 720 }, projection);

    expect(center.x).toBeCloseTo(172);
    expect(center.y).toBeCloseTo(148);
    expect(topLeft.x).toBeGreaterThanOrEqual(HUD_CONTENT_BOUNDS.miniMapBody.x + 8);
    expect(topLeft.y).toBeGreaterThanOrEqual(HUD_CONTENT_BOUNDS.miniMapBody.y + 8);
    expect(bottomRight.x).toBeLessThanOrEqual(
      HUD_CONTENT_BOUNDS.miniMapBody.x + HUD_CONTENT_BOUNDS.miniMapBody.width - 8,
    );
    expect(bottomRight.y).toBeLessThanOrEqual(
      HUD_CONTENT_BOUNDS.miniMapBody.y + HUD_CONTENT_BOUNDS.miniMapBody.height - 8,
    );
    expect(
      hudRectanglesConflict(HUD_PANEL_BOUNDS.miniMap, HUD_PANEL_BOUNDS.quest, 4),
    ).toBe(false);
  });

  it("keeps bottom HUD cells and the skill bar separated", () => {
    const bottomCells = [
      HUD_PANEL_BOUNDS.identity,
      HUD_PANEL_BOUNDS.hp,
      HUD_PANEL_BOUNDS.mp,
      HUD_PANEL_BOUNDS.exp,
      HUD_PANEL_BOUNDS.currency,
      HUD_PANEL_BOUNDS.growth,
      HUD_PANEL_BOUNDS.actionBar,
    ];

    for (const cell of bottomCells) {
      expect(hudRectangleFitsPanel(cell, HUD_PANEL_BOUNDS.bottom)).toBe(true);
    }
    for (const [index, cell] of bottomCells.entries()) {
      for (const other of bottomCells.slice(index + 1)) {
        expect(hudRectanglesConflict(cell, other, 4)).toBe(false);
      }
    }
    expect(
      hudRectangleFitsPanel(
        HUD_PANEL_BOUNDS.level,
        HUD_PANEL_BOUNDS.identity,
      ),
    ).toBe(true);
    expect(HUD_INNER_CELL_PADDING).toEqual({ x: 12, y: 8 });
    expect(HUD_METER_CELL_PADDING).toEqual({ x: 12, y: 6 });
  });

  it("accepts text inside the safe content area and rejects border overlap", () => {
    const panel = HUD_PANEL_BOUNDS.miniMap;
    expect(
      hudTextFitsPanel(
        { left: 30, top: 22, right: 180, bottom: 86 },
        panel,
      ),
    ).toBe(true);
    expect(
      hudTextFitsPanel(
        { left: 18, top: 8, right: 180, bottom: 30 },
        panel,
      ),
    ).toBe(false);
  });

  it("lifts ground-level gameplay above the fixed bottom HUD", () => {
    expect(gameplayCameraBoundsHeight(720)).toBe(768);
    expect(GAMEPLAY_WORLD_LIFT).toBeLessThan(HUD_PANEL_BOUNDS.bottom.height);
    expect(620 - GAMEPLAY_WORLD_LIFT).toBeLessThan(
      HUD_PANEL_BOUNDS.bottom.y,
    );
  });

  it("compacts large HUD integers while preserving an exact bigint total", () => {
    expect(formatHudCompactInteger(9_999)).toBe("9,999");
    expect(formatHudCompactInteger(12_345)).toBe("1.2만");
    expect(formatHudCompactInteger(100_000_000)).toBe("1억");
    expect(formatHudCompactInteger(Number.MAX_SAFE_INTEGER)).toBe("9,007.1조");

    const total = sumHudIntegerValues(
      Array.from({ length: 6 }, () => Number.MAX_SAFE_INTEGER),
    );
    expect(total).toBe(54_043_195_528_445_946n);
    expect(formatHudCompactInteger(total)).toBe("5.4경");
    expect(
      formatHudMeterValue(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER),
    ).toBe("9,007.1조 / 9,007.1조");
  });

  it("counts every text bound that crosses the configured padding", () => {
    const panel = { x: 0, y: 0, width: 200, height: 100 };
    expect(
      countHudPaddingViolations([
        {
          panel,
          text: { left: 18, top: 16, right: 182, bottom: 84 },
        },
        {
          panel,
          text: { left: 17, top: 16, right: 182, bottom: 84 },
        },
      ]),
    ).toBe(1);
    expect(HUD_SAFE_PADDING).toEqual({ x: 18, y: 16 });
  });

  it("detects labels that collide or leave less than the requested gap", () => {
    const title = { left: 455, top: 100, right: 648, bottom: 115 };

    expect(
      hudTextBoundsConflict(title, {
        left: 640,
        top: 100,
        right: 787,
        bottom: 113,
      }),
    ).toBe(true);
    expect(
      hudTextBoundsConflict(
        title,
        { left: 560, top: 132, right: 680, bottom: 146 },
        8,
      ),
    ).toBe(false);
    expect(
      hudTextBoundsConflict(
        title,
        { left: 655, top: 100, right: 787, bottom: 113 },
        8,
      ),
    ).toBe(true);
  });
});
