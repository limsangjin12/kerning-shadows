import Phaser from "phaser";
import { gameAudio } from "../audio/game-audio";
import { AudioAssetKey } from "../assets/audio-assets";
import { animationKey } from "../assets/animation-registry";
import { spriteManifest } from "../assets/runtime-assets";
import { UiAssetKey } from "../assets/ui-assets";
import { playerNameplateOffsetY } from "../entities/player-layout";
import { PLAYER_SHEET_BY_JOB } from "../entities/player-appearance";
import { assertTransition, SceneKey } from "../flow/game-flow";
import {
  CharacterCreationMode,
  rollCreationStats,
} from "../profile/character-creation-rules";
import { PlayerJob } from "../data/catalog";
import {
  localProfileStore,
  type CharacterSlot,
} from "../profile/local-profile";
import {
  showCharacterCreateOverlay,
  type OverlayHandle,
} from "../ui/screen-overlay";
import { markActiveScene } from "../ui/screen-state";
import { PIXEL_FONT_FAMILY } from "../ui/ui-theme";

const PREVIEW_PLAYER_Y = 563;
const PREVIEW_PLAYER_SCALE = 1.5;

export class CharacterCreateScene extends Phaser.Scene {
  private overlay?: OverlayHandle;
  private previewName?: Phaser.GameObjects.Text;
  private targetSlot: CharacterSlot = 1;

  constructor() {
    super(SceneKey.CharacterCreate);
  }

  init(data?: { slot?: CharacterSlot }): void {
    const store = localProfileStore();
    const requestedSlot = data?.slot;
    this.targetSlot =
      requestedSlot && !store.loadSlot(requestedSlot)
        ? requestedSlot
        : (store.firstAvailableSlot() ?? 1);
  }

  create(): void {
    markActiveScene(SceneKey.CharacterCreate);
    gameAudio().playBgm(AudioAssetKey.GameTheme);
    this.add.image(640, 360, UiAssetKey.CharacterSelectBackground);
    const isFirstCharacter = localProfileStore()
      .loadSlots()
      .every((profile) => profile === null);

    const origin = spriteManifest.sheets.player?.origin;
    const previewPlayer = this.add
      .sprite(570, PREVIEW_PLAYER_Y, "player", 0)
      .setOrigin(origin?.x ?? 0.5, origin?.y ?? 1)
      .setScale(PREVIEW_PLAYER_SCALE)
      .play(animationKey("player", "idle"));
    this.previewName = this.add
      .text(
        570,
        PREVIEW_PLAYER_Y + playerNameplateOffsetY(PREVIEW_PLAYER_SCALE),
        "새 모험가",
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

    this.overlay = showCharacterCreateOverlay(
      this.targetSlot,
      rollCreationStats(),
      () => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        return rollCreationStats();
      },
      (name) => this.previewName?.setText(name || "새 모험가"),
      (mode) => {
        const job =
          mode === CharacterCreationMode.Boost
            ? PlayerJob.Hokage
            : PlayerJob.Beginner;
        const sheet = PLAYER_SHEET_BY_JOB[job];
        const sheetOrigin = spriteManifest.sheets[sheet]?.origin;
        previewPlayer
          .setTexture(sheet, 0)
          .setOrigin(sheetOrigin?.x ?? 0.5, sheetOrigin?.y ?? 1)
          .play(animationKey(sheet, "idle"));
      },
      (name, stats, mode) => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        localProfileStore().create({ name, stats }, this.targetSlot, mode);
        assertTransition(SceneKey.CharacterCreate, SceneKey.CharacterSelect);
        this.scene.start(SceneKey.CharacterSelect);
      },
      () => {
        gameAudio().playSfx(AudioAssetKey.UiConfirm);
        const destination = localProfileStore().getActiveSlot()
          ? SceneKey.CharacterSelect
          : SceneKey.Login;
        assertTransition(SceneKey.CharacterCreate, destination);
        this.scene.start(destination);
      },
      isFirstCharacter,
    );

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.overlay?.destroy());
  }
}
