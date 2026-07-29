import type { PlayerProfile } from "../data/catalog";

export function restoreVitals(character: PlayerProfile): PlayerProfile {
  return {
    ...character,
    hp: character.maxHp,
    mp: character.maxMp,
  };
}

export function hasFullVitals(
  character: Pick<PlayerProfile, "hp" | "maxHp" | "mp" | "maxMp">,
): boolean {
  return character.hp >= character.maxHp && character.mp >= character.maxMp;
}
