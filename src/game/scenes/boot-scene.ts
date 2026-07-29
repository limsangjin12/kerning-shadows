import Phaser from "phaser";
import { initializeGameAudio } from "../audio/game-audio";
import {
  AudioAssetKey,
  initialAudioAssets,
  preloadAudioAssets,
} from "../assets/audio-assets";
import {
  preloadCoreSpriteSheets,
  registerCoreAnimations,
} from "../assets/animation-registry";
import { preloadCombatAssets, runtimeCombatAssets } from "../assets/combat-assets";
import { runtimeSpriteSheets } from "../assets/runtime-assets";
import { preloadUiAssets, runtimeUiAssets } from "../assets/ui-assets";
import {
  preloadMapAssets,
  registerMapObjectFrames,
  runtimeMapAssets,
} from "../assets/map-assets";
import { assertTransition, SceneKey } from "../flow/game-flow";
import { localSettingsStore } from "../settings/local-settings";
import { markActiveScene, markAssetsReady } from "../ui/screen-state";
import { PIXEL_FONT_FAMILY } from "../ui/ui-theme";

export class BootScene extends Phaser.Scene {
  constructor() {
    super(SceneKey.Boot);
  }

  preload(): void {
    markActiveScene(SceneKey.Boot);
    markAssetsReady(false);
    preloadCoreSpriteSheets(this);
    preloadCombatAssets(this);
    preloadUiAssets(this);
    preloadMapAssets(this);
    preloadAudioAssets(this);

    const loading = this.add
      .text(640, 350, "핵심 스프라이트 불러오는 중…", {
        color: "#f6efcf",
        fontFamily: PIXEL_FONT_FAMILY,
        fontSize: "24px",
      })
      .setOrigin(0.5);

    this.load.on(Phaser.Loader.Events.PROGRESS, (progress: number) => {
      loading.setText(`핵심 스프라이트 ${Math.round(progress * 100)}%`);
    });
  }

  create(): void {
    registerCoreAnimations(this);
    registerMapObjectFrames(this);

    for (const sheet of runtimeSpriteSheets) {
      if (!this.textures.exists(sheet.key)) {
        throw new Error(`Core sprite sheet failed to load: ${sheet.key}`);
      }
    }

    for (const asset of runtimeUiAssets) {
      if (!this.textures.exists(asset.key)) {
        throw new Error(`UI asset failed to load: ${asset.key}`);
      }
    }

    for (const asset of runtimeMapAssets) {
      if (!this.textures.exists(asset.key)) {
        throw new Error(`Map asset failed to load: ${asset.key}`);
      }
    }

    for (const asset of runtimeCombatAssets) {
      if (!this.textures.exists(asset.key)) {
        throw new Error(`Combat UI asset failed to load: ${asset.key}`);
      }
    }

    for (const asset of initialAudioAssets) {
      if (!this.cache.audio.exists(asset.key)) {
        throw new Error(`Audio asset failed to load: ${asset.key}`);
      }
    }

    const audio = initializeGameAudio(
      this.game,
      localSettingsStore().loadOrCreate().audio,
    );
    audio.playBgm(AudioAssetKey.GameTheme);

    markAssetsReady(true);
    assertTransition(SceneKey.Boot, SceneKey.Login);
    this.scene.start(SceneKey.Login);
  }
}
