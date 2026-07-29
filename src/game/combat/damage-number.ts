import Phaser from "phaser";
import { CombatAssetKey } from "../assets/combat-assets";

export const DamagePalette = {
  Normal: 0,
  Strong: 1,
  Player: 2,
  Critical: 3,
} as const;

export type DamagePalette = (typeof DamagePalette)[keyof typeof DamagePalette];
export type DamagePaletteLabel = "normal" | "strong" | "player" | "critical";

export interface DamageNumberPresentation {
  initialScale: number;
  settledScale: number;
  rise: number;
  durationMs: number;
}

export function damagePaletteForMonsterHit(
  critical: boolean,
  strongAttack: boolean,
): DamagePalette {
  if (critical) return DamagePalette.Critical;
  return strongAttack ? DamagePalette.Strong : DamagePalette.Normal;
}

export function damagePaletteLabel(
  palette: DamagePalette,
): DamagePaletteLabel {
  switch (palette) {
    case DamagePalette.Normal:
      return "normal";
    case DamagePalette.Strong:
      return "strong";
    case DamagePalette.Player:
      return "player";
    case DamagePalette.Critical:
      return "critical";
  }
}

export function damageNumberPresentation(
  palette: DamagePalette,
): DamageNumberPresentation {
  return palette === DamagePalette.Critical
    ? { initialScale: 1.65, settledScale: 1.35, rise: 86, durationMs: 860 }
    : { initialScale: 1.25, settledScale: 1.25, rise: 70, durationMs: 720 };
}

export function damageNumberFrame(digit: number, palette: DamagePalette): number {
  if (!Number.isInteger(digit) || digit < 0 || digit > 9) {
    throw new Error(`Damage digit must be an integer from 0 to 9, received ${digit}.`);
  }
  return palette * 10 + digit;
}

export function showDamageNumber(
  scene: Phaser.Scene,
  x: number,
  y: number,
  amount: number,
  palette: DamagePalette,
  onComplete?: (sprite: Phaser.GameObjects.Sprite) => void,
): Phaser.GameObjects.Sprite[] {
  const digits = Math.max(0, Math.floor(amount)).toString().split("");
  const presentation = damageNumberPresentation(palette);
  const spacing = 18;
  const startX = x - ((digits.length - 1) * spacing) / 2;
  const sprites: Phaser.GameObjects.Sprite[] = [];

  digits.forEach((digit, index) => {
    const frame = damageNumberFrame(Number(digit), palette);
    const sprite = scene.add
      .sprite(startX + index * spacing, y, CombatAssetKey.DamageNumbers, frame)
      .setDepth(850)
      .setScale(presentation.initialScale);
    sprites.push(sprite);
    scene.tweens.add({
      targets: sprite,
      y: y - presentation.rise,
      scaleX: presentation.settledScale,
      scaleY: presentation.settledScale,
      alpha: 0,
      duration: presentation.durationMs,
      ease: "Cubic.Out",
      onComplete: () => {
        sprite.destroy();
        onComplete?.(sprite);
      },
    });
  });

  return sprites;
}
