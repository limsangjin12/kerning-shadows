import manifestJson from "../../../assets/sprites/sprite-manifest.json";
import combatEffectsUrl from "../../../assets/sprites/core/combat-effects-v1.webp?url";
import greenMushroomUrl from "../../../assets/sprites/core/green-mushroom-v1.webp?url";
import playerUrl from "../../../assets/sprites/core/player-v4.webp?url";
import playerRogueUrl from "../../../assets/sprites/core/player-rogue-v4.webp?url";
import playerAssassinUrl from "../../../assets/sprites/core/player-assassin-v4.webp?url";
import playerHermitUrl from "../../../assets/sprites/core/player-hermit-v4.webp?url";
import playerHokageUrl from "../../../assets/sprites/core/player-hokage-v5.webp?url";
import hokageEffectsUrl from "../../../assets/sprites/core/hokage-effects-v1.webp?url";
import hokageAlliesUrl from "../../../assets/sprites/core/hokage-allies-v2.webp?url";
import throwingStarsUrl from "../../../assets/sprites/core/equipped-throwing-stars-v1.webp?url";
import shadowSentinelUrl from "../../../assets/sprites/core/shadow-sentinel-v1.webp?url";
import abyssGolemUrl from "../../../assets/sprites/core/abyss-golem-v3.webp?url";
import plagueZombieUrl from "../../../assets/sprites/core/plague-zombie-v2.webp?url";
import moonWolfUrl from "../../../assets/sprites/core/moon-wolf-v1.webp?url";
import ancientTreantUrl from "../../../assets/sprites/core/ancient-treant-v1.webp?url";
import emberWardenUrl from "../../../assets/sprites/core/ember-warden-v2.webp?url";
import eclipseArchivistUrl from "../../../assets/sprites/core/eclipse-archivist-v2.webp?url";
import onePunchManUrl from "../../../assets/sprites/core/one-punch-man-v1.webp?url";
import dungeonScoutUrl from "../../../assets/sprites/core/dungeon-scout-v1.webp?url";
import shadowMentorUrl from "../../../assets/sprites/core/shadow-mentor-v1.webp?url";
import streetHealerUrl from "../../../assets/sprites/core/street-healer-v1.webp?url";
import gameDeveloperUrl from "../../../assets/sprites/core/game-developer-v1.webp?url";
import duaPetUrl from "../../../assets/sprites/core/dua-pet-v3.webp?url";
import worldEffectsLootUrl from "../../../assets/sprites/core/world-effects-loot-v2.webp?url";
import type { RuntimeSpriteSheet } from "./manifest-types";
import { validateSpriteManifest } from "./manifest-validation";

const spriteUrls: Record<string, string> = {
  "combat-effects-v1.webp": combatEffectsUrl,
  "green-mushroom-v1.webp": greenMushroomUrl,
  "player-v4.webp": playerUrl,
  "player-rogue-v4.webp": playerRogueUrl,
  "player-assassin-v4.webp": playerAssassinUrl,
  "player-hermit-v4.webp": playerHermitUrl,
  "player-hokage-v5.webp": playerHokageUrl,
  "hokage-effects-v1.webp": hokageEffectsUrl,
  "hokage-allies-v2.webp": hokageAlliesUrl,
  "equipped-throwing-stars-v1.webp": throwingStarsUrl,
  "shadow-sentinel-v1.webp": shadowSentinelUrl,
  "abyss-golem-v3.webp": abyssGolemUrl,
  "plague-zombie-v2.webp": plagueZombieUrl,
  "moon-wolf-v1.webp": moonWolfUrl,
  "ancient-treant-v1.webp": ancientTreantUrl,
  "ember-warden-v2.webp": emberWardenUrl,
  "eclipse-archivist-v2.webp": eclipseArchivistUrl,
  "one-punch-man-v1.webp": onePunchManUrl,
  "dungeon-scout-v1.webp": dungeonScoutUrl,
  "shadow-mentor-v1.webp": shadowMentorUrl,
  "street-healer-v1.webp": streetHealerUrl,
  "game-developer-v1.webp": gameDeveloperUrl,
  "dua-pet-v3.webp": duaPetUrl,
  "world-effects-loot-v2.webp": worldEffectsLootUrl,
};

export const spriteManifest = validateSpriteManifest(manifestJson);

function resolveSpriteUrl(imagePath: string): string {
  const filename = imagePath.replace(/^core\//, "");
  const url = spriteUrls[filename];

  if (!url) {
    throw new Error(`No bundled image found for sprite sheet: ${imagePath}`);
  }

  return url;
}

export const runtimeSpriteSheets: RuntimeSpriteSheet[] = Object.entries(
  spriteManifest.sheets,
).map(([key, definition]) => ({
  key,
  url: resolveSpriteUrl(definition.image),
  definition,
}));
