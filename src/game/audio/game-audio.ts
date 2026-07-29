import Phaser from "phaser";
import {
  audioAsset,
  type AudioAssetKey,
  type BgmAssetKey,
  type SfxAssetKey,
} from "../assets/audio-assets";
import type { AudioSettings } from "../settings/local-settings";
import { markAudioEvent, markAudioState } from "../ui/screen-state";

interface AdjustableSound extends Phaser.Sound.BaseSound {
  setVolume(value: number): this;
}

const BGM_LOOP_MARKER = "bgm-loop";

export class GameAudio {
  private settings: AudioSettings;
  private desiredBgm?: BgmAssetKey;
  private currentBgm?: AdjustableSound;

  constructor(
    private readonly manager: Phaser.Sound.BaseSoundManager,
    settings: AudioSettings,
  ) {
    this.settings = { ...settings };
    this.manager.mute = settings.muted;
    this.manager.on(Phaser.Sound.Events.UNLOCKED, this.handleUnlocked);
    this.syncStatus();
  }

  applySettings(settings: AudioSettings): void {
    this.settings = { ...settings };
    this.manager.mute = settings.muted;
    this.currentBgm?.setVolume(this.volumeFor(this.currentBgm.key as AudioAssetKey));
    this.syncStatus();
  }

  playBgm(key: BgmAssetKey): void {
    if (this.desiredBgm === key && this.currentBgm) {
      this.currentBgm.setVolume(this.volumeFor(key));
      if (!this.currentBgm.isPlaying && !this.manager.locked) {
        this.playLoop(this.currentBgm, key);
      }
      this.syncStatus();
      return;
    }

    this.currentBgm?.stop();
    this.currentBgm?.destroy();
    this.currentBgm = undefined;
    this.desiredBgm = key;
    this.startDesiredBgm();
    this.syncStatus();
  }

  playSfx(key: SfxAssetKey): boolean {
    if (this.manager.locked || this.settings.muted || this.settings.sfxVolume <= 0) {
      return false;
    }
    const played = this.manager.play(key, { volume: this.volumeFor(key) });
    if (played) {
      markAudioEvent(key);
    }
    return played;
  }

  destroy(): void {
    this.manager.off(Phaser.Sound.Events.UNLOCKED, this.handleUnlocked);
    this.currentBgm?.stop();
    this.currentBgm?.destroy();
    this.currentBgm = undefined;
    this.desiredBgm = undefined;
  }

  private readonly handleUnlocked = (): void => {
    this.startDesiredBgm();
    this.syncStatus();
  };

  private startDesiredBgm(): void {
    if (!this.desiredBgm || this.manager.locked) {
      return;
    }
    const key = this.desiredBgm;
    const sound = this.manager.add(key, {
      loop: true,
      volume: this.volumeFor(key),
    }) as AdjustableSound;
    const window = audioAsset(key).loopWindow;
    if (window) {
      sound.addMarker({
        name: BGM_LOOP_MARKER,
        start: window.startSeconds,
        duration: window.endSeconds - window.startSeconds,
        config: { loop: true, volume: this.volumeFor(key) },
      });
    }
    this.currentBgm = sound;
    this.playLoop(sound, key);
    this.syncStatus();
  }

  private playLoop(sound: AdjustableSound, key: BgmAssetKey): void {
    const config = { loop: true, volume: this.volumeFor(key) };
    if (audioAsset(key).loopWindow) {
      sound.play(BGM_LOOP_MARKER, config);
    } else {
      sound.play(config);
    }
  }

  private volumeFor(key: AudioAssetKey): number {
    const asset = audioAsset(key);
    const categoryVolume = asset.category === "bgm"
      ? this.settings.bgmVolume
      : this.settings.sfxVolume;
    return categoryVolume * asset.baseVolume;
  }

  private syncStatus(): void {
    markAudioState(
      this.settings,
      this.desiredBgm ?? "",
      this.manager.locked,
      this.currentBgm?.isPlaying ?? false,
    );
  }
}

let activeAudio: GameAudio | undefined;

export function initializeGameAudio(
  game: Phaser.Game,
  settings: AudioSettings,
): GameAudio {
  activeAudio?.destroy();
  const audio = new GameAudio(game.sound, settings);
  activeAudio = audio;
  game.events.once(Phaser.Core.Events.DESTROY, () => {
    audio.destroy();
    if (activeAudio === audio) {
      activeAudio = undefined;
    }
  });
  return audio;
}

export function gameAudio(): GameAudio {
  if (!activeAudio) {
    throw new Error("Game audio has not been initialized.");
  }
  return activeAudio;
}
