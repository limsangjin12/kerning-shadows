import { AudioAssetKey } from "../assets/audio-assets";
import { gameAudio } from "../audio/game-audio";
import {
  localSettingsStore,
  type AudioSettings,
} from "../settings/local-settings";

export function createAudioSettingsControls(): HTMLElement {
  const store = localSettingsStore();
  let audio = { ...store.loadOrCreate().audio };
  const template = document.querySelector<HTMLTemplateElement>(
    "#audio-settings-template",
  );
  const container = template?.content.firstElementChild?.cloneNode(true) as
    | HTMLElement
    | undefined;
  if (!container) throw new Error("Missing audio settings template.");
  const mute = container.querySelector<HTMLButtonElement>(
    '[data-testid="audio-mute-toggle"]',
  )!;

  const updateLabels = (): void => {
    mute.textContent = audio.muted ? "음소거 해제" : "전체 음소거";
    mute.setAttribute("aria-pressed", String(audio.muted));
  };
  const persist = (next: AudioSettings, preview = false): void => {
    audio = next;
    const settings = store.loadOrCreate();
    settings.audio = { ...audio };
    store.save(settings);
    gameAudio().applySettings(audio);
    updateLabels();
    if (preview && !audio.muted) {
      gameAudio().playSfx(AudioAssetKey.UiConfirm);
    }
  };

  mute.addEventListener("click", () => {
    persist({ ...audio, muted: !audio.muted }, true);
  });
  for (const [testId, key] of [
    ["audio-bgm-volume", "bgmVolume"],
    ["audio-sfx-volume", "sfxVolume"],
  ] as const) {
    const input = container.querySelector<HTMLInputElement>(
      `[data-testid="${testId}"]`,
    )!;
    const output = input.nextElementSibling as HTMLOutputElement;
    input.value = String(Math.round(audio[key] * 100));
    output.value = `${input.value}%`;
    input.addEventListener("input", () => {
      output.value = `${input.value}%`;
      persist({ ...audio, [key]: Number(input.value) / 100 });
    });
  }

  updateLabels();
  return container;
}
