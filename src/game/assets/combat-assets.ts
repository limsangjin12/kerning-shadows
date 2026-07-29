import damageNumbersUrl from "../../../assets/ui/combat/damage-numbers-v1.svg?url";
import onePunchShockwaveUrl from "../../../assets/ui/combat/one-punch-shockwave-v1.svg?url";

export const CombatAssetKey = {
  DamageNumbers: "damageNumbers",
  OnePunchShockwave: "onePunchShockwave",
} as const;

export function preloadCombatAssets(scene: Phaser.Scene): void {
  scene.load.spritesheet(CombatAssetKey.DamageNumbers, damageNumbersUrl, {
    frameWidth: 32,
    frameHeight: 32,
  });
  scene.load.image(CombatAssetKey.OnePunchShockwave, onePunchShockwaveUrl);
}

export const runtimeCombatAssets = [
  { key: CombatAssetKey.DamageNumbers, url: damageNumbersUrl },
  { key: CombatAssetKey.OnePunchShockwave, url: onePunchShockwaveUrl },
] as const;
