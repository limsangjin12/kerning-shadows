import {
  AudioAssetKey,
  type BgmAssetKey,
} from "../assets/audio-assets";

export function bgmForBossPresence(
  mapBgm: BgmAssetKey,
  hasLivingBoss: boolean,
): BgmAssetKey {
  return hasLivingBoss ? AudioAssetKey.BossTheme : mapBgm;
}
