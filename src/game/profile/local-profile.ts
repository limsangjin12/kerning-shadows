import {
  DEFAULT_PLAYER_PROFILE,
  ITEM_CATALOG,
  PlayerJob,
  type PlayerJob as PlayerJobType,
  type PlayerProfile,
  type PlayerStats,
} from "../data/catalog";
import {
  expRequiredForLevel,
  statsForMigratedLevel,
} from "../progression/progression-rules";
import {
  normalizeActiveJobAdvancementQuest,
  type ActiveJobAdvancementQuest,
} from "../quests/job-advancement-quests";
import {
  ACTIVE_SKILL_ORDER,
  DEFAULT_SKILL_HOTKEY_ALIASES,
  earnedSkillPointsForLevel,
  normalizeSkillHotbar,
  normalizeSkillHotkeyAliases,
  normalizeSkillLevels,
  type ActiveSkillId,
  type SkillHotkeyAliases,
} from "../skills/skill-rules";
import {
  DEFAULT_THROWING_STAR_LOADOUT,
  normalizeThrowingStarLoadout,
  type ThrowingStarLoadout,
} from "../equipment/throwing-star-rules";
import type { MapId as MapIdType } from "../maps/map-definitions";
import {
  defaultDungeonBossQuestProgress,
  normalizeDungeonBossQuestProgress,
  type DungeonBossQuestProgress,
} from "../quests/dungeon-boss-quest";
import {
  CharacterCreationMode,
  boostCharacterToHokage,
  isValidCreationStats,
  normalizeCharacterName,
  validateCharacterName,
  type CharacterCreationMode as CharacterCreationModeType,
} from "./character-creation-rules";
import {
  defaultPetCollection,
  normalizePetCollection,
  type PetCollection,
} from "../pets/pet-rules";
import { inventoryItemMaximum } from "../inventory/revival-charm-rules";

export const LOCAL_PROFILE_KEY = "kerning-shadows.local-profile.v1";
export const ACTIVE_CHARACTER_SLOT_KEY = `${LOCAL_PROFILE_KEY}.active-slot`;
export const CHARACTER_SLOTS = [1, 2, 3] as const;
export const CHARACTER_SLOT_COUNT = CHARACTER_SLOTS.length;

export type CharacterSlot = (typeof CHARACTER_SLOTS)[number];
export type CharacterProfiles = [
  LocalProfile | null,
  LocalProfile | null,
  LocalProfile | null,
];

export interface LocalProfile {
  schemaVersion: 16;
  character: PlayerProfile;
  location: MapIdType;
  exp: number;
  inventory: Record<string, number>;
  pets: PetCollection;
  throwingStars: ThrowingStarLoadout;
  skillHotbar: ActiveSkillId[];
  skillHotkeyAliases: SkillHotkeyAliases;
  activeJobAdvancementQuest: ActiveJobAdvancementQuest | null;
  dungeonBossQuest: DungeonBossQuestProgress;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function createDefaultProfile(
  character?: Pick<PlayerProfile, "name" | "stats">,
  mode: CharacterCreationModeType = CharacterCreationMode.Standard,
): LocalProfile {
  const baseCharacter: PlayerProfile = {
    ...DEFAULT_PLAYER_PROFILE,
    name: character?.name ?? DEFAULT_PLAYER_PROFILE.name,
    stats: { ...(character?.stats ?? DEFAULT_PLAYER_PROFILE.stats) },
    skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
  };
  return {
    schemaVersion: 16,
    character:
      mode === CharacterCreationMode.Boost
        ? boostCharacterToHokage(baseCharacter)
        : baseCharacter,
    location: "kerningCity",
    exp: 0,
    inventory: {},
    pets: defaultPetCollection(),
    throwingStars: {
      owned: [...DEFAULT_THROWING_STAR_LOADOUT.owned],
      equipped: DEFAULT_THROWING_STAR_LOADOUT.equipped,
    },
    skillHotbar: [...ACTIVE_SKILL_ORDER],
    skillHotkeyAliases: { ...DEFAULT_SKILL_HOTKEY_ALIASES },
    activeJobAdvancementQuest: null,
    dungeonBossQuest: defaultDungeonBossQuestProgress(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseProfile(raw: string): LocalProfile | null {
  try {
    const value: unknown = JSON.parse(raw);
    if (
      !isRecord(value) ||
      (value.schemaVersion !== 1 &&
        value.schemaVersion !== 2 &&
        value.schemaVersion !== 3 &&
        value.schemaVersion !== 4 &&
        value.schemaVersion !== 5 &&
        value.schemaVersion !== 6 &&
        value.schemaVersion !== 7 &&
        value.schemaVersion !== 8 &&
        value.schemaVersion !== 9 &&
        value.schemaVersion !== 10 &&
        value.schemaVersion !== 11 &&
        value.schemaVersion !== 12 &&
        value.schemaVersion !== 13 &&
        value.schemaVersion !== 14 &&
        value.schemaVersion !== 15 &&
        value.schemaVersion !== 16) ||
      !isRecord(value.character)
    ) {
      return null;
    }

    const defaults = createDefaultProfile();
    const character = value.character;
    const job = parseJob(character.job);
    const location = parseLocation(value.location);

    const level = boundedPositiveInteger(
      character.level,
      defaults.character.level,
      200,
    );
    const maxHp = positiveInteger(character.maxHp, defaults.character.maxHp);
    const maxMp = positiveInteger(character.maxMp, defaults.character.maxMp);

    let parsedCharacter: PlayerProfile = {
      ...defaults.character,
      name: normalizeCharacterName(character.name, defaults.character.name),
      job,
      level,
      hp: Math.min(nonNegativeInteger(character.hp, defaults.character.hp), maxHp),
      maxHp,
      mp: Math.min(nonNegativeInteger(character.mp, defaults.character.mp), maxMp),
      maxMp,
      mesos: nonNegativeInteger(character.mesos, defaults.character.mesos),
      stats: parseStats(character.stats, defaults.character.stats),
      statPoints: boundedNonNegativeInteger(
        character.statPoints,
        defaults.character.statPoints,
        1_000,
      ),
      autoAllocateStats:
        typeof character.autoAllocateStats === "boolean"
          ? character.autoAllocateStats
          : defaults.character.autoAllocateStats,
      skillPoints:
        value.schemaVersion >= 4
          ? boundedNonNegativeInteger(
              character.skillPoints,
              defaults.character.skillPoints,
              1_000,
            )
          : Math.min(1_000, earnedSkillPointsForLevel(level)),
      skillLevels:
        value.schemaVersion >= 4
          ? normalizeSkillLevels(character.skillLevels)
          : { ...defaults.character.skillLevels },
    };
    if (value.schemaVersion === 1 || !isRecord(character.stats)) {
      parsedCharacter = statsForMigratedLevel({
        ...parsedCharacter,
        stats: { ...defaults.character.stats },
        statPoints: 0,
      });
    }

    return {
      ...defaults,
      character: parsedCharacter,
      location,
      exp: Math.min(
        nonNegativeInteger(value.exp, defaults.exp),
        expRequiredForLevel(level) - 1,
      ),
      inventory: parseInventory(value.inventory),
      pets:
        value.schemaVersion >= 15
          ? normalizePetCollection(value.pets)
          : defaultPetCollection(),
      throwingStars:
        value.schemaVersion >= 7
          ? normalizeThrowingStarLoadout(value.throwingStars)
          : normalizeThrowingStarLoadout(DEFAULT_THROWING_STAR_LOADOUT),
      skillHotbar:
        value.schemaVersion >= 13
          ? normalizeSkillHotbar(value.skillHotbar)
          : [...ACTIVE_SKILL_ORDER],
      skillHotkeyAliases:
        value.schemaVersion >= 16
          ? isRecord(value.skillHotkeyAliases)
            ? normalizeSkillHotkeyAliases(value.skillHotkeyAliases)
            : { ...DEFAULT_SKILL_HOTKEY_ALIASES }
          : { ...DEFAULT_SKILL_HOTKEY_ALIASES },
      activeJobAdvancementQuest:
        value.schemaVersion >= 3
          ? normalizeActiveJobAdvancementQuest(
              value.activeJobAdvancementQuest,
              parsedCharacter,
            )
          : null,
      dungeonBossQuest:
        value.schemaVersion >= 10
          ? normalizeDungeonBossQuestProgress(
              value.dungeonBossQuest,
              value.schemaVersion === 10,
            )
          : defaultDungeonBossQuestProgress(),
    };
  } catch {
    return null;
  }
}

function parseJob(value: unknown): PlayerJobType {
  if (value === PlayerJob.Rogue || value === "thief") {
    return PlayerJob.Rogue;
  }
  if (value === PlayerJob.Assassin) {
    return PlayerJob.Assassin;
  }
  if (value === PlayerJob.Hermit) {
    return PlayerJob.Hermit;
  }
  if (value === PlayerJob.Hokage) {
    return PlayerJob.Hokage;
  }
  return PlayerJob.Beginner;
}

const PROFILE_MAP_IDS = new Set<string>([
  "kerningCity",
  "shadowHideout",
  "greenMushroomCave",
  "shadowTrialDungeon",
  "crystalAntNest",
  "clockworkTower",
  "sunkenCoralTemple",
  "emberMine",
  "moonlitArcaneLibrary",
  "infiniteDuelGround",
  "patienceForest",
]);

function parseLocation(value: unknown): MapIdType {
  return typeof value === "string" && PROFILE_MAP_IDS.has(value)
    ? (value as MapIdType)
    : "kerningCity";
}

function nonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
    ? value
    : fallback;
}

function positiveInteger(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0
    ? value
    : fallback;
}

function boundedPositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const parsed = positiveInteger(value, fallback);
  return parsed <= maximum ? parsed : fallback;
}

function boundedNonNegativeInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number {
  const parsed = nonNegativeInteger(value, fallback);
  return parsed <= maximum ? parsed : fallback;
}

function parseStats(value: unknown, defaults: PlayerStats): PlayerStats {
  if (!isRecord(value)) {
    return { ...defaults };
  }
  return {
    str: boundedPositiveInteger(value.str, defaults.str, 10_000),
    dex: boundedPositiveInteger(value.dex, defaults.dex, 10_000),
    int: boundedPositiveInteger(value.int, defaults.int, 10_000),
    luk: boundedPositiveInteger(value.luk, defaults.luk, 10_000),
  };
}

function parseInventory(value: unknown): Record<string, number> {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce<Record<string, number>>((inventory, [itemId, amount]) => {
    if (
      Object.hasOwn(ITEM_CATALOG, itemId) &&
      typeof amount === "number" &&
      Number.isSafeInteger(amount) &&
      amount >= 0
    ) {
      const maximum = inventoryItemMaximum(itemId);
      inventory[itemId] = maximum === undefined
        ? amount
        : Math.min(amount, maximum);
    }
    return inventory;
  }, {});
}

export class LocalProfileStore {
  constructor(private readonly storage: StorageLike) {}

  load(): LocalProfile | null {
    const slot = this.getActiveSlot();
    return slot ? this.loadSlot(slot) : null;
  }

  loadSlot(slot: CharacterSlot): LocalProfile | null {
    const key = profileKeyForSlot(slot);
    const raw = this.storage.getItem(key);
    const profile = raw ? parseProfile(raw) : null;
    if (profile) this.storage.setItem(key, JSON.stringify(profile));
    return profile;
  }

  loadSlots(): CharacterProfiles {
    return [this.loadSlot(1), this.loadSlot(2), this.loadSlot(3)];
  }

  getActiveSlot(): CharacterSlot | null {
    const profiles = this.loadSlots();
    const storedSlot = parseCharacterSlot(
      this.storage.getItem(ACTIVE_CHARACTER_SLOT_KEY),
    );
    if (storedSlot && profiles[storedSlot - 1]) {
      return storedSlot;
    }

    const firstOccupiedIndex = profiles.findIndex((profile) => profile !== null);
    if (firstOccupiedIndex < 0) {
      return null;
    }

    const fallbackSlot = (firstOccupiedIndex + 1) as CharacterSlot;
    this.storage.setItem(ACTIVE_CHARACTER_SLOT_KEY, String(fallbackSlot));
    return fallbackSlot;
  }

  selectSlot(slot: CharacterSlot): LocalProfile {
    const profile = this.loadSlot(slot);
    if (!profile) {
      throw new Error(`Character slot ${slot} is empty.`);
    }
    this.storage.setItem(ACTIVE_CHARACTER_SLOT_KEY, String(slot));
    return profile;
  }

  firstAvailableSlot(): CharacterSlot | null {
    const emptyIndex = this.loadSlots().findIndex((profile) => profile === null);
    return emptyIndex < 0 ? null : ((emptyIndex + 1) as CharacterSlot);
  }

  create(
    character: Pick<PlayerProfile, "name" | "stats">,
    slot: CharacterSlot | null = this.firstAvailableSlot(),
    mode: CharacterCreationModeType = CharacterCreationMode.Standard,
  ): LocalProfile {
    const name = validateCharacterName(character.name);
    if (!name.valid || !isValidCreationStats(character.stats)) {
      throw new Error("Invalid character creation data.");
    }
    if (!slot) {
      throw new Error("All character slots are occupied.");
    }
    if (this.loadSlot(slot)) {
      throw new Error(`Character slot ${slot} is already occupied.`);
    }
    const profile = createDefaultProfile(
      { name: name.name, stats: character.stats },
      mode,
    );
    this.storage.setItem(profileKeyForSlot(slot), JSON.stringify(profile));
    this.storage.setItem(ACTIVE_CHARACTER_SLOT_KEY, String(slot));
    return profile;
  }

  save(profile: LocalProfile): void {
    const slot = this.getActiveSlot() ?? 1;
    this.storage.setItem(profileKeyForSlot(slot), JSON.stringify(profile));
    this.storage.setItem(ACTIVE_CHARACTER_SLOT_KEY, String(slot));
  }

  clear(): void {
    for (const slot of CHARACTER_SLOTS) {
      this.storage.removeItem(profileKeyForSlot(slot));
    }
    this.storage.removeItem(ACTIVE_CHARACTER_SLOT_KEY);
  }
}

export function profileKeyForSlot(slot: CharacterSlot): string {
  return slot === 1 ? LOCAL_PROFILE_KEY : `${LOCAL_PROFILE_KEY}.slot-${slot}`;
}

function parseCharacterSlot(value: string | null): CharacterSlot | null {
  return value === "1" || value === "2" || value === "3"
    ? (Number(value) as CharacterSlot)
    : null;
}

let browserStore: LocalProfileStore | undefined;

export function localProfileStore(): LocalProfileStore {
  browserStore ??= new LocalProfileStore(window.localStorage);
  return browserStore;
}
