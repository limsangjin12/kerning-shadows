import Phaser from "phaser";
import { gameAudio } from "../audio/game-audio";
import { AudioAssetKey } from "../assets/audio-assets";
import { animationKey } from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import { UiAssetKey } from "../assets/ui-assets";
import { PLAYER_SHEET_BY_JOB } from "../entities/player-appearance";
import { playerNameplateOffsetY } from "../entities/player-layout";
import { assertTransition, SceneKey } from "../flow/game-flow";
import {
  localProfileStore,
  type LocalProfile,
} from "../profile/local-profile";
import {
  showCharacterSelectOverlay,
  type OverlayHandle,
} from "../ui/screen-overlay";
import { markActiveScene, markPlayerAppearance } from "../ui/screen-state";
import { PIXEL_FONT_FAMILY } from "../ui/ui-theme";

const SELECT_PLAYER_Y = 563;
const SELECT_PLAYER_SCALE = 1.5;

export class CharacterSelectScene extends Phaser.Scene {
  private overlay?: OverlayHandle;
  private playerPreview?: Phaser.GameObjects.Sprite;
  private previewName?: Phaser.GameObjects.Text;

  constructor() {
    super(SceneKey.CharacterSelect);
  }

  create(): void {
    markActiveScene(SceneKey.CharacterSelect);
    gameAudio().playBgm(AudioAssetKey.GameTheme);
    this.add.image(640, 360, UiAssetKey.CharacterSelectBackground);
    const store = localProfileStore();
    const profiles = store.loadSlots();
    const activeSlot = store.getActiveSlot();
    if (!activeSlot) {
      assertTransition(SceneKey.CharacterSelect, SceneKey.Login);
      this.scene.start(SceneKey.Login);
      return;
    }
    const profile = profiles[activeSlot - 1];
    if (!profile) return;

    this.playerPreview = this.add.sprite(860, SELECT_PLAYER_Y, "player", 0);
    this.previewName = this.add
      .text(
        860,
        SELECT_PLAYER_Y + playerNameplateOffsetY(SELECT_PLAYER_SCALE),
        profile.character.name,
        {
          color: "#ffffff",
          fontFamily: PIXEL_FONT_FAMILY,
          fontSize: "15px",
          backgroundColor: "#071115cc",
          padding: { x: 6, y: 3 },
          stroke: "#111111",
          strokeThickness: 2,
        },
      )
      .setOrigin(0.5, 0)
      .setDepth(12);
    this.updatePreview(profile);

    this.overlay = showCharacterSelectOverlay(
      profiles.map((candidate) => candidate?.character ?? null),
      activeSlot,
      (slot) => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        this.updatePreview(store.selectSlot(slot));
      },
      (slot) => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        assertTransition(SceneKey.CharacterSelect, SceneKey.CharacterCreate);
        this.scene.start(SceneKey.CharacterCreate, { slot });
      },
      (slot) => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        store.selectSlot(slot);
        assertTransition(SceneKey.CharacterSelect, SceneKey.Gameplay);
        this.scene.start(SceneKey.Gameplay);
      },
      () => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        assertTransition(SceneKey.CharacterSelect, SceneKey.Login);
        this.scene.start(SceneKey.Login);
      },
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.overlay?.destroy());
  }

  private updatePreview(profile: LocalProfile): void {
    const playerSheetKey = PLAYER_SHEET_BY_JOB[profile.character.job];
    const origin = spriteManifest.sheets[playerSheetKey]?.origin;
    markPlayerAppearance(playerSheetKey);
    this.playerPreview
      ?.stop()
      .setTexture(playerSheetKey, 0)
      .setOrigin(origin?.x ?? 0.5, origin?.y ?? 1)
      .setScale(SELECT_PLAYER_SCALE)
      .play(animationKey(playerSheetKey, "idle"));
    this.previewName?.setText(profile.character.name);
  }
}
