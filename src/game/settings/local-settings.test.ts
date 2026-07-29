import { describe, expect, it } from "vitest";
import {
  DEFAULT_AUDIO_SETTINGS,
  LOCAL_SETTINGS_KEY,
  LocalSettingsStore,
  type SettingsStorageLike,
} from "./local-settings";

class MemoryStorage implements SettingsStorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("local settings store", () => {
  it("creates independent BGM and SFX defaults", () => {
    const settings = new LocalSettingsStore(new MemoryStorage()).loadOrCreate();

    expect(settings.audio).toEqual(DEFAULT_AUDIO_SETTINGS);
    expect(settings.audio).toEqual({
      muted: false,
      bgmVolume: 0.45,
      sfxVolume: 0.38,
    });
    expect(settings.audio.sfxVolume).toBeLessThan(settings.audio.bgmVolume);
  });

  it("restores mute and category volumes", () => {
    const storage = new MemoryStorage();
    const firstSession = new LocalSettingsStore(storage);
    const settings = firstSession.loadOrCreate();
    settings.audio = { muted: true, bgmVolume: 0.2, sfxVolume: 0.85 };
    firstSession.save(settings);

    expect(new LocalSettingsStore(storage).loadOrCreate().audio).toEqual({
      muted: true,
      bgmVolume: 0.2,
      sfxVolume: 0.85,
    });
  });

  it("clamps saved volumes and repairs missing fields", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_SETTINGS_KEY,
      JSON.stringify({
        schemaVersion: 1,
        audio: { muted: "yes", bgmVolume: -4, sfxVolume: 3 },
      }),
    );

    expect(new LocalSettingsStore(storage).loadOrCreate().audio).toEqual({
      muted: false,
      bgmVolume: 0,
      sfxVolume: 1,
    });
  });

  it("repairs corrupt local data with safe defaults", () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_SETTINGS_KEY, "not-json");

    expect(new LocalSettingsStore(storage).loadOrCreate().audio).toEqual(
      DEFAULT_AUDIO_SETTINGS,
    );
  });
});
