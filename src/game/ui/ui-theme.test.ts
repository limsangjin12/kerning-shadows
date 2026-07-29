import bookPanelSource from "../../../assets/ui/panels/book-panel-v1.svg?raw";
import metalPanelSource from "../../../assets/ui/panels/metal-panel-v1.svg?raw";
import woodPanelSource from "../../../assets/ui/panels/wood-panel-v1.svg?raw";
import { describe, expect, it } from "vitest";
import { runtimeUiAssets } from "../assets/ui-assets";
import {
  HUD_PANEL_ALPHA,
  PIXEL_FONT_FAMILY,
  UI_PANEL_SLICE,
  UI_PANEL_THEMES,
} from "./ui-theme";

describe("shared pixel UI theme", () => {
  it("maps every panel theme to a bundled UI asset", () => {
    const runtimeKeys = new Set(runtimeUiAssets.map((asset) => asset.key));

    expect(Object.keys(UI_PANEL_THEMES)).toEqual(["book", "wood", "metal", "hud"]);
    for (const theme of Object.values(UI_PANEL_THEMES)) {
      expect(runtimeKeys.has(theme.assetKey)).toBe(true);
      expect(theme.cssClass).toMatch(/^ui-panel--/);
      expect(theme.surfaceColor).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it("keeps the nine-slice contract inside the source dimensions", () => {
    expect(UI_PANEL_SLICE.left + UI_PANEL_SLICE.right).toBeLessThan(
      UI_PANEL_SLICE.width,
    );
    expect(UI_PANEL_SLICE.top + UI_PANEL_SLICE.bottom).toBeLessThan(
      UI_PANEL_SLICE.height,
    );

    for (const source of [bookPanelSource, woodPanelSource, metalPanelSource]) {
      expect(source).toContain(
        `viewBox="0 0 ${UI_PANEL_SLICE.width} ${UI_PANEL_SLICE.height}"`,
      );
      expect(source).toContain('shape-rendering="crispEdges"');
      expect(source).not.toContain('width="64" height="3"');
    }
  });

  it("uses the bundled Korean pixel font before fallbacks", () => {
    expect(PIXEL_FONT_FAMILY.startsWith('"Galmuri11"')).toBe(true);
    expect(PIXEL_FONT_FAMILY).toContain("monospace");
  });

  it("keeps floating HUD chrome translucent and the bottom HUD readable", () => {
    expect(HUD_PANEL_ALPHA.floating).toBeLessThan(0.8);
    expect(HUD_PANEL_ALPHA.boss).toBeGreaterThan(HUD_PANEL_ALPHA.floating);
    expect(HUD_PANEL_ALPHA.bottom).toBeGreaterThan(HUD_PANEL_ALPHA.boss);
    expect(HUD_PANEL_ALPHA.bottom).toBeLessThan(1);
  });
});
