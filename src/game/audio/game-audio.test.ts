import { describe, expect, it, vi } from "vitest";
import { AudioAssetKey } from "../assets/audio-assets";
import { GameAudio } from "./game-audio";

vi.mock("phaser", () => ({
  default: {
    Sound: { Events: { UNLOCKED: "unlocked" } },
    Core: { Events: { DESTROY: "destroy" } },
  },
}));

vi.mock("../ui/screen-state", () => ({
  markAudioEvent: vi.fn(),
  markAudioState: vi.fn(),
}));

function fakeSound(key: string) {
  return {
    key,
    isPlaying: false,
    addMarker: vi.fn(() => true),
    play: vi.fn(function (this: { isPlaying: boolean }) {
      this.isPlaying = true;
      return true;
    }),
    setVolume: vi.fn().mockReturnThis(),
    stop: vi.fn(function (this: { isPlaying: boolean }) {
      this.isPlaying = false;
      return true;
    }),
    destroy: vi.fn(),
  };
}

describe("GameAudio BGM continuity", () => {
  it("keeps playing the same BGM across repeated scene requests", () => {
    const sounds = new Map<string, ReturnType<typeof fakeSound>>();
    const manager = {
      locked: false,
      mute: false,
      on: vi.fn(),
      off: vi.fn(),
      add: vi.fn((key: string) => {
        const sound = fakeSound(key);
        sounds.set(key, sound);
        return sound;
      }),
      play: vi.fn(),
    };
    const audio = new GameAudio(manager as never, {
      muted: false,
      bgmVolume: 0.45,
      sfxVolume: 0.7,
    });

    audio.playBgm(AudioAssetKey.GameTheme);
    audio.playBgm(AudioAssetKey.GameTheme);

    const gameTheme = sounds.get(AudioAssetKey.GameTheme);
    expect(manager.add).toHaveBeenCalledTimes(1);
    expect(gameTheme?.addMarker).toHaveBeenCalledWith({
      name: "bgm-loop",
      start: 0.9,
      duration: 68.06 - 0.9,
      config: { loop: true, volume: 0.45 * 0.72 },
    });
    expect(gameTheme?.play).toHaveBeenCalledTimes(1);
    expect(gameTheme?.play).toHaveBeenCalledWith(
      "bgm-loop",
      { loop: true, volume: 0.45 * 0.72 },
    );
  });

  it("changes tracks only when a different BGM is requested", () => {
    const sounds = new Map<string, ReturnType<typeof fakeSound>>();
    const manager = {
      locked: false,
      mute: false,
      on: vi.fn(),
      off: vi.fn(),
      add: vi.fn((key: string) => {
        const sound = fakeSound(key);
        sounds.set(key, sound);
        return sound;
      }),
      play: vi.fn(),
    };
    const audio = new GameAudio(manager as never, {
      muted: false,
      bgmVolume: 0.45,
      sfxVolume: 0.7,
    });

    audio.playBgm(AudioAssetKey.GameTheme);
    audio.playBgm(AudioAssetKey.BossTheme);

    expect(sounds.get(AudioAssetKey.GameTheme)?.stop).toHaveBeenCalledTimes(1);
    expect(sounds.get(AudioAssetKey.GameTheme)?.destroy).toHaveBeenCalledTimes(1);
    expect(sounds.get(AudioAssetKey.BossTheme)?.addMarker).toHaveBeenCalledWith({
      name: "bgm-loop",
      start: 0,
      duration: 51.99,
      config: { loop: true, volume: 0.45 * 0.76 },
    });
    expect(sounds.get(AudioAssetKey.BossTheme)?.play).toHaveBeenCalledWith(
      "bgm-loop",
      { loop: true, volume: 0.45 * 0.76 },
    );
  });
});
