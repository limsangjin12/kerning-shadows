export const LOCAL_SETTINGS_KEY = "kerning-shadows.local-settings.v1";

export interface AudioSettings {
  muted: boolean;
  bgmVolume: number;
  sfxVolume: number;
}

export interface LocalSettings {
  schemaVersion: 1;
  audio: AudioSettings;
}

export interface SettingsStorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_AUDIO_SETTINGS: Readonly<AudioSettings> = {
  muted: false,
  bgmVolume: 0.45,
  sfxVolume: 0.38,
};

export function createDefaultSettings(): LocalSettings {
  return {
    schemaVersion: 1,
    audio: { ...DEFAULT_AUDIO_SETTINGS },
  };
}

export function normalizeVolume(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.min(1, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseSettings(raw: string): LocalSettings | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.schemaVersion !== 1 || !isRecord(value.audio)) {
      return null;
    }
    return {
      schemaVersion: 1,
      audio: {
        muted:
          typeof value.audio.muted === "boolean"
            ? value.audio.muted
            : DEFAULT_AUDIO_SETTINGS.muted,
        bgmVolume: normalizeVolume(
          value.audio.bgmVolume,
          DEFAULT_AUDIO_SETTINGS.bgmVolume,
        ),
        sfxVolume: normalizeVolume(
          value.audio.sfxVolume,
          DEFAULT_AUDIO_SETTINGS.sfxVolume,
        ),
      },
    };
  } catch {
    return null;
  }
}

export class LocalSettingsStore {
  constructor(private readonly storage: SettingsStorageLike) {}

  loadOrCreate(): LocalSettings {
    const raw = this.storage.getItem(LOCAL_SETTINGS_KEY);
    const settings = raw ? parseSettings(raw) : null;
    if (settings) {
      return settings;
    }

    const created = createDefaultSettings();
    this.save(created);
    return created;
  }

  save(settings: LocalSettings): void {
    this.storage.setItem(LOCAL_SETTINGS_KEY, JSON.stringify(settings));
  }

  clear(): void {
    this.storage.removeItem(LOCAL_SETTINGS_KEY);
  }
}

let browserStore: LocalSettingsStore | undefined;

export function localSettingsStore(): LocalSettingsStore {
  browserStore ??= new LocalSettingsStore(window.localStorage);
  return browserStore;
}
