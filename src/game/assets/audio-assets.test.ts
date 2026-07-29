import type Phaser from "phaser";
import { describe, expect, it, vi } from "vitest";
import {
  AudioAssetKey,
  DeferredAudioAssetLoader,
  audioAsset,
  initialAudioAssets,
  runtimeAudioAssets,
} from "./audio-assets";

describe("runtime audio assets", () => {
  it("keeps unique keys and valid category volumes", () => {
    const keys = runtimeAudioAssets.map((asset) => asset.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect(runtimeAudioAssets.filter((asset) => asset.category === "bgm")).toHaveLength(2);
    expect(runtimeAudioAssets.filter((asset) => asset.category === "sfx")).toHaveLength(12);

    for (const asset of runtimeAudioAssets) {
      expect(asset.url).toBeTruthy();
      expect(asset.baseVolume).toBeGreaterThan(0);
      expect(asset.baseVolume).toBeLessThanOrEqual(1);
    }
  });

  it("classifies the menu loop and interaction cue", () => {
    expect(audioAsset(AudioAssetKey.GameTheme).category).toBe("bgm");
    expect(audioAsset(AudioAssetKey.BossTheme).category).toBe("bgm");
    expect(audioAsset(AudioAssetKey.UiConfirm).category).toBe("sfx");
  });

  it("defers the boss theme while keeping the game theme and SFX in the initial load", () => {
    expect(initialAudioAssets.map(({ key }) => key)).not.toContain(
      AudioAssetKey.BossTheme,
    );
    expect(initialAudioAssets.map(({ key }) => key)).toContain(
      AudioAssetKey.GameTheme,
    );
    expect(initialAudioAssets.filter(({ category }) => category === "sfx"))
      .toHaveLength(12);
  });

  it("skips leading and trailing silence in both BGM loops", () => {
    expect(audioAsset(AudioAssetKey.GameTheme).loopWindow).toEqual({
      startSeconds: 0.9,
      endSeconds: 68.06,
    });
    expect(audioAsset(AudioAssetKey.BossTheme).loopWindow).toEqual({
      startSeconds: 0,
      endSeconds: 51.99,
    });
  });
});

interface FakeLoader {
  audio: ReturnType<typeof vi.fn>;
  isLoading: ReturnType<typeof vi.fn>;
  start: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
}

function deferredAudioScene(audioExists = false): {
  scene: Phaser.Scene;
  load: FakeLoader;
  cacheExists: ReturnType<typeof vi.fn>;
} {
  const cacheExists = vi.fn(() => audioExists);
  const load: FakeLoader = {
    audio: vi.fn(),
    isLoading: vi.fn(() => false),
    start: vi.fn(),
    once: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  };
  return {
    scene: {
      cache: { audio: { exists: cacheExists } },
      load,
    } as unknown as Phaser.Scene,
    load,
    cacheExists,
  };
}

describe("deferred audio asset loader", () => {
  it("queues one network load and shares it across repeated requests", () => {
    const { scene, load } = deferredAudioScene();
    const loader = new DeferredAudioAssetLoader(scene);
    const onReady = vi.fn();

    loader.ensureLoaded(AudioAssetKey.BossTheme, onReady);
    loader.ensureLoaded(AudioAssetKey.BossTheme, onReady);

    expect(load.audio).toHaveBeenCalledTimes(1);
    expect(load.audio).toHaveBeenCalledWith(
      AudioAssetKey.BossTheme,
      audioAsset(AudioAssetKey.BossTheme).url,
    );
    expect(load.start).toHaveBeenCalledTimes(1);
    expect(onReady).not.toHaveBeenCalled();

    const completeEvent =
      `filecomplete-audio-${AudioAssetKey.BossTheme}`;
    const complete = load.once.mock.calls.find(
      ([event]) => event === completeEvent,
    )?.[1] as (() => void) | undefined;
    complete?.();

    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it("uses an existing cache entry without starting the loader", () => {
    const { scene, load } = deferredAudioScene(true);
    const loader = new DeferredAudioAssetLoader(scene);
    const onReady = vi.fn();

    loader.ensureLoaded(AudioAssetKey.BossTheme, onReady);

    expect(onReady).toHaveBeenCalledTimes(1);
    expect(load.audio).not.toHaveBeenCalled();
    expect(load.start).not.toHaveBeenCalled();
  });

  it("drops completion callbacks after destruction", () => {
    const { scene, load } = deferredAudioScene();
    const loader = new DeferredAudioAssetLoader(scene);
    const onReady = vi.fn();

    loader.ensureLoaded(AudioAssetKey.BossTheme, onReady);
    const complete = load.once.mock.calls[0]?.[1] as (() => void) | undefined;
    loader.destroy();
    complete?.();

    expect(onReady).not.toHaveBeenCalled();
    expect(load.off).toHaveBeenCalled();
  });

  it("does not restart an already active loader and retries after a load error", () => {
    const { scene, load } = deferredAudioScene();
    load.isLoading.mockReturnValue(true);
    const loader = new DeferredAudioAssetLoader(scene);
    const firstReady = vi.fn();

    loader.ensureLoaded(AudioAssetKey.BossTheme, firstReady);

    expect(load.start).not.toHaveBeenCalled();
    const onError = load.on.mock.calls.find(
      ([event]) => event === "loaderror",
    )?.[1] as ((file: { key: string; type: string }) => void) | undefined;
    onError?.({ key: AudioAssetKey.BossTheme, type: "audio" });
    expect(firstReady).not.toHaveBeenCalled();

    loader.ensureLoaded(AudioAssetKey.BossTheme, vi.fn());
    expect(load.audio).toHaveBeenCalledTimes(2);
  });
});
