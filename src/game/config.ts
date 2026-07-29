import Phaser from "phaser";
import { BootScene } from "./scenes/boot-scene";
import { CharacterCreateScene } from "./scenes/character-create-scene";
import { CharacterSelectScene } from "./scenes/character-select-scene";
import { LoginScene } from "./scenes/login-scene";
import { PlayScene } from "./scenes/play-scene";

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 1280,
  height: 720,
  backgroundColor: "#111b28",
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1250 },
      fixedStep: true,
      debug: false,
    },
  },
  scene: [BootScene, LoginScene, CharacterCreateScene, CharacterSelectScene, PlayScene],
};
