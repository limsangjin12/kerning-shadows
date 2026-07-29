import Phaser from "phaser";
import { gameConfig } from "./game/config";
import { setupHudWindowControls } from "./game/ui/hud-window-controls";
import "./styles.css";

const touchInputAvailable =
  navigator.maxTouchPoints > 0 ||
  window.matchMedia("(pointer: coarse)").matches ||
  "ontouchstart" in window;
document.documentElement.dataset.inputMode = touchInputAvailable
  ? "touch"
  : "keyboard";

await Promise.all([
  document.fonts.load('400 16px "Galmuri11"', "한글 ABC 123"),
  document.fonts.load('700 16px "Galmuri11"', "한글 ABC 123"),
]);

setupHudWindowControls();

const game = new Phaser.Game(gameConfig);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    game.destroy(true);
  });
}
