import Phaser from "phaser";
import { runtimeSpriteSheets, spriteManifest } from "./runtime-assets";

export function preloadCoreSpriteSheets(scene: Phaser.Scene): void {
  const { frameWidth, frameHeight } = spriteManifest.sheetDefaults;

  for (const sheet of runtimeSpriteSheets) {
    scene.load.spritesheet(sheet.key, sheet.url, {
      frameWidth,
      frameHeight,
    });
  }
}

export function registerCoreAnimations(scene: Phaser.Scene): void {
  for (const sheet of runtimeSpriteSheets) {
    registerFrameOrigins(scene, sheet.key, sheet.definition.frameOrigins);

    for (const [animationName, animation] of Object.entries(
      sheet.definition.animations,
    )) {
      const key = animationKey(sheet.key, animationName);
      if (scene.anims.exists(key)) {
        continue;
      }

      scene.anims.create({
        key,
        frames: animation.frames.map((frame) => ({ key: sheet.key, frame })),
        frameRate: 1000 / animation.frameDurationMs,
        repeat: animation.repeat,
      });
    }
  }
}

function registerFrameOrigins(
  scene: Phaser.Scene,
  sheetKey: string,
  frameOrigins: Record<string, { x: number; y: number }>,
): void {
  for (const [frameKey, origin] of Object.entries(frameOrigins)) {
    const frame = scene.textures.getFrame(sheetKey, Number(frameKey));
    if (!frame) {
      throw new Error(
        `Missing sprite frame for custom origin: ${sheetKey}:${frameKey}`,
      );
    }
    frame.customPivot = true;
    frame.pivotX = origin.x;
    frame.pivotY = origin.y;
  }
}

export function animationKey(sheetKey: string, animationName: string): string {
  return `${sheetKey}:${animationName}`;
}
