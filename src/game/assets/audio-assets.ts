import type Phaser from "phaser";
import jobAdvancementUrl from "../../../assets/audio/sfx/job-advancement-v1.wav?url";
import jumpUrl from "../../../assets/audio/sfx/jump-v1.wav?url";
import hitUrl from "../../../assets/audio/sfx/hit-v1.wav?url";
import levelUpUrl from "../../../assets/audio/sfx/level-up-v1.wav?url";
import lootLandUrl from "../../../assets/audio/sfx/loot-land-v1.wav?url";
import lootPickupUrl from "../../../assets/audio/sfx/loot-pickup-v1.wav?url";
import monsterDefeatUrl from "../../../assets/audio/sfx/monster-defeat-v1.wav?url";
import playerHurtUrl from "../../../assets/audio/sfx/player-hurt-v1.wav?url";
import portalUrl from "../../../assets/audio/sfx/portal-v1.wav?url";
import recoveryUrl from "../../../assets/audio/sfx/recovery-v1.wav?url";
import throwUrl from "../../../assets/audio/sfx/throw-v1.wav?url";
import uiConfirmUrl from "../../../assets/audio/sfx/ui-confirm-v1.wav?url";
import bossThemeUrl from "../../../assets/audio/bgm/boss-theme-v1.mp3?url";
import gameThemeUrl from "../../../assets/audio/bgm/game-theme-v1.mp3?url";

export const AudioAssetKey = {
  GameTheme: "audio-bgm-game-theme",
  BossTheme: "audio-bgm-boss-theme",
  UiConfirm: "audio-sfx-ui-confirm",
  Jump: "audio-sfx-jump",
  Throw: "audio-sfx-throw",
  Hit: "audio-sfx-hit",
  PlayerHurt: "audio-sfx-player-hurt",
  MonsterDefeat: "audio-sfx-monster-defeat",
  LootLand: "audio-sfx-loot-land",
  LootPickup: "audio-sfx-loot-pickup",
  Portal: "audio-sfx-portal",
  Recovery: "audio-sfx-recovery",
  JobAdvancement: "audio-sfx-job-advancement",
  LevelUp: "audio-sfx-level-up",
} as const;

export type AudioAssetKey = (typeof AudioAssetKey)[keyof typeof AudioAssetKey];
export type BgmAssetKey =
  | typeof AudioAssetKey.GameTheme
  | typeof AudioAssetKey.BossTheme;
export type SfxAssetKey = Exclude<AudioAssetKey, BgmAssetKey>;

export interface RuntimeAudioAsset {
  key: AudioAssetKey;
  url: string;
  category: "bgm" | "sfx";
  baseVolume: number;
  loopWindow?: {
    startSeconds: number;
    endSeconds: number;
  };
}

export const runtimeAudioAssets: readonly RuntimeAudioAsset[] = [
  {
    key: AudioAssetKey.GameTheme,
    url: gameThemeUrl,
    category: "bgm",
    baseVolume: 0.72,
    loopWindow: { startSeconds: 0.9, endSeconds: 68.06 },
  },
  {
    key: AudioAssetKey.BossTheme,
    url: bossThemeUrl,
    category: "bgm",
    baseVolume: 0.76,
    loopWindow: { startSeconds: 0, endSeconds: 51.99 },
  },
  { key: AudioAssetKey.UiConfirm, url: uiConfirmUrl, category: "sfx", baseVolume: 0.62 },
  { key: AudioAssetKey.Jump, url: jumpUrl, category: "sfx", baseVolume: 0.54 },
  { key: AudioAssetKey.Throw, url: throwUrl, category: "sfx", baseVolume: 0.52 },
  { key: AudioAssetKey.Hit, url: hitUrl, category: "sfx", baseVolume: 0.58 },
  { key: AudioAssetKey.PlayerHurt, url: playerHurtUrl, category: "sfx", baseVolume: 0.65 },
  { key: AudioAssetKey.MonsterDefeat, url: monsterDefeatUrl, category: "sfx", baseVolume: 0.62 },
  { key: AudioAssetKey.LootLand, url: lootLandUrl, category: "sfx", baseVolume: 0.36 },
  { key: AudioAssetKey.LootPickup, url: lootPickupUrl, category: "sfx", baseVolume: 0.62 },
  { key: AudioAssetKey.Portal, url: portalUrl, category: "sfx", baseVolume: 0.62 },
  { key: AudioAssetKey.Recovery, url: recoveryUrl, category: "sfx", baseVolume: 0.58 },
  { key: AudioAssetKey.JobAdvancement, url: jobAdvancementUrl, category: "sfx", baseVolume: 0.72 },
  { key: AudioAssetKey.LevelUp, url: levelUpUrl, category: "sfx", baseVolume: 0.7 },
];

export const initialAudioAssets: readonly RuntimeAudioAsset[] =
  runtimeAudioAssets.filter(
    (asset) => asset.key !== AudioAssetKey.BossTheme,
  );

export function audioAsset(key: AudioAssetKey): RuntimeAudioAsset {
  const asset = runtimeAudioAssets.find((candidate) => candidate.key === key);
  if (!asset) {
    throw new Error(`Unknown audio asset: ${key}`);
  }
  return asset;
}

export function preloadAudioAssets(scene: Phaser.Scene): void {
  for (const asset of initialAudioAssets) {
    scene.load.audio(asset.key, asset.url);
  }
}

interface PendingAudioAssetLoad {
  completeEvent: string;
  onComplete: () => void;
  onError: (file: Phaser.Loader.File) => void;
  readyCallbacks: Set<() => void>;
}

const FILE_KEY_COMPLETE_EVENT = "filecomplete-";
const FILE_LOAD_ERROR_EVENT = "loaderror";

export class DeferredAudioAssetLoader {
  private readonly pending = new Map<AudioAssetKey, PendingAudioAssetLoad>();

  constructor(private readonly scene: Phaser.Scene) {}

  ensureLoaded(key: AudioAssetKey, onReady: () => void): void {
    if (this.scene.cache.audio.exists(key)) {
      onReady();
      return;
    }

    const existing = this.pending.get(key);
    if (existing) {
      existing.readyCallbacks.add(onReady);
      return;
    }

    const completeEvent = `${FILE_KEY_COMPLETE_EVENT}audio-${key}`;
    const readyCallbacks = new Set([onReady]);
    const onComplete = (): void => {
      this.finish(key, true);
    };
    const onError = (file: Phaser.Loader.File): void => {
      if (file.key === key && file.type === "audio") {
        this.finish(key, false);
      }
    };

    this.pending.set(key, {
      completeEvent,
      onComplete,
      onError,
      readyCallbacks,
    });
    this.scene.load.once(completeEvent, onComplete);
    this.scene.load.on(FILE_LOAD_ERROR_EVENT, onError);
    this.scene.load.audio(key, audioAsset(key).url);
    if (!this.scene.load.isLoading()) {
      this.scene.load.start();
    }
  }

  destroy(): void {
    for (const request of this.pending.values()) {
      this.scene.load.off(request.completeEvent, request.onComplete);
      this.scene.load.off(
        FILE_LOAD_ERROR_EVENT,
        request.onError,
      );
    }
    this.pending.clear();
  }

  private finish(key: AudioAssetKey, succeeded: boolean): void {
    const request = this.pending.get(key);
    if (!request) return;

    this.scene.load.off(request.completeEvent, request.onComplete);
    this.scene.load.off(
      FILE_LOAD_ERROR_EVENT,
      request.onError,
    );
    this.pending.delete(key);
    if (!succeeded) return;

    for (const callback of request.readyCallbacks) {
      callback();
    }
  }
}
