import Phaser from "phaser";
import { gameAudio } from "../audio/game-audio";
import { AudioAssetKey } from "../assets/audio-assets";
import { UiAssetKey } from "../assets/ui-assets";
import { assertTransition, SceneKey } from "../flow/game-flow";
import { localProfileStore } from "../profile/local-profile";
import { showLoginOverlay, type OverlayHandle } from "../ui/screen-overlay";
import { markActiveScene } from "../ui/screen-state";

export class LoginScene extends Phaser.Scene {
  private overlay?: OverlayHandle;

  constructor() {
    super(SceneKey.Login);
  }

  create(): void {
    markActiveScene(SceneKey.Login);
    gameAudio().playBgm(AudioAssetKey.GameTheme);
    this.add.image(640, 360, UiAssetKey.LoginBackground);

    this.overlay = showLoginOverlay(() => {
      gameAudio().playSfx(AudioAssetKey.UiConfirm);
      const destination = localProfileStore().load()
        ? SceneKey.CharacterSelect
        : SceneKey.CharacterCreate;
      assertTransition(SceneKey.Login, destination);
      this.scene.start(destination);
    });

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.overlay?.destroy());
  }
}
