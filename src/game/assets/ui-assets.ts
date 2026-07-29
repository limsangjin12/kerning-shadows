import Phaser from "phaser";
import bookPanelUrl from "../../../assets/ui/panels/book-panel-v1.svg?url";
import hudMetalPanelUrl from "../../../assets/ui/panels/hud-metal-panel-v1.webp?url";
import hudMetalSurfaceUrl from "../../../assets/ui/panels/hud-metal-surface-v1.webp?url";
import metalPanelUrl from "../../../assets/ui/panels/metal-panel-v1.svg?url";
import woodPanelUrl from "../../../assets/ui/panels/wood-panel-v1.svg?url";
import characterSelectBackgroundUrl from "../../../assets/ui/screens/character-select-background-v1.webp?url";
import endingCreditsBackgroundUrl from "../../../assets/ui/screens/ending-credits-v1.webp?url";
import loginBackgroundUrl from "../../../assets/ui/screens/login-background-v1.webp?url";
import hokageCinematicsUrl from "../../../assets/ui/cinematics/hokage-cinematics-v1.webp?url";
import { ACTIVE_SKILL_ICON_ASSETS } from "./skill-icon-assets";

export const UiAssetKey = {
  LoginBackground: "ui:login-background",
  CharacterSelectBackground: "ui:character-select-background",
  EndingCreditsBackground: "ui:ending-credits-background",
  BookPanel: "ui:panel-book",
  WoodPanel: "ui:panel-wood",
  MetalPanel: "ui:panel-metal",
  HudMetalPanel: "ui:hud-panel-metal",
  HudMetalSurface: "ui:hud-surface-metal",
  HokageCinematics: "ui:cinematic-hokage",
  TeamAssaultSkillIcon: "ui:skill-team-assault",
} as const;

export const runtimeUiAssets = [
  { key: UiAssetKey.LoginBackground, url: loginBackgroundUrl, kind: "screen" },
  {
    key: UiAssetKey.CharacterSelectBackground,
    url: characterSelectBackgroundUrl,
    kind: "screen",
  },
  {
    key: UiAssetKey.EndingCreditsBackground,
    url: endingCreditsBackgroundUrl,
    kind: "screen",
  },
  { key: UiAssetKey.BookPanel, url: bookPanelUrl, kind: "panel" },
  { key: UiAssetKey.WoodPanel, url: woodPanelUrl, kind: "panel" },
  { key: UiAssetKey.MetalPanel, url: metalPanelUrl, kind: "panel" },
  { key: UiAssetKey.HudMetalPanel, url: hudMetalPanelUrl, kind: "panel" },
  { key: UiAssetKey.HudMetalSurface, url: hudMetalSurfaceUrl, kind: "panel" },
  {
    key: UiAssetKey.HokageCinematics,
    url: hokageCinematicsUrl,
    kind: "cinematic",
    frameWidth: 640,
    frameHeight: 360,
  },
  ...ACTIVE_SKILL_ICON_ASSETS,
] as const;

export { endingCreditsBackgroundUrl };

export function preloadUiAssets(scene: Phaser.Scene): void {
  for (const asset of runtimeUiAssets) {
    if (asset.kind === "cinematic") {
      scene.load.spritesheet(asset.key, asset.url, {
        frameWidth: asset.frameWidth,
        frameHeight: asset.frameHeight,
      });
    } else {
      scene.load.image(asset.key, asset.url);
    }
  }
}
