import type Phaser from "phaser";
import { UiAssetKey } from "../assets/ui-assets";

export const PIXEL_FONT_FAMILY = '"Galmuri11", "Courier New", monospace';
export const UI_DEPTH = 900;

export const HUD_PANEL_ALPHA = {
  floating: 0.76,
  boss: 0.88,
  bottom: 0.94,
} as const;

export const UI_PANEL_SLICE = {
  width: 96,
  height: 96,
  left: 16,
  right: 16,
  top: 16,
  bottom: 16,
} as const;

export const UI_PANEL_THEMES = {
  book: {
    assetKey: UiAssetKey.BookPanel,
    cssClass: "ui-panel--book",
    surfaceColor: "#ead9a8",
  },
  wood: {
    assetKey: UiAssetKey.WoodPanel,
    cssClass: "ui-panel--wood",
    surfaceColor: "#5c321d",
  },
  metal: {
    assetKey: UiAssetKey.MetalPanel,
    cssClass: "ui-panel--metal",
    surfaceColor: "#172127",
  },
  hud: {
    assetKey: UiAssetKey.HudMetalPanel,
    cssClass: "ui-panel--metal",
    surfaceColor: "#10191f",
  },
} as const;

export type UiPanelTheme = keyof typeof UI_PANEL_THEMES;

export function addNineSlicePanel(
  scene: Phaser.Scene,
  theme: UiPanelTheme,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = UI_DEPTH,
): Phaser.GameObjects.NineSlice {
  const slice = UI_PANEL_SLICE;
  return scene.add
    .nineslice(
      x,
      y,
      UI_PANEL_THEMES[theme].assetKey,
      undefined,
      width,
      height,
      slice.left,
      slice.right,
      slice.top,
      slice.bottom,
    )
    .setScrollFactor(0)
    .setDepth(depth);
}

export function addHudSurface(
  scene: Phaser.Scene,
  x: number,
  y: number,
  width: number,
  height: number,
  depth = UI_DEPTH,
): Phaser.GameObjects.Image {
  return scene.add
    .image(x, y, UiAssetKey.HudMetalSurface)
    .setDisplaySize(width, height)
    .setScrollFactor(0)
    .setDepth(depth);
}
