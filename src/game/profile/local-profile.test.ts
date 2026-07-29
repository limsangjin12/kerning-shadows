import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE, PlayerJob } from "../data/catalog";
import {
  ACTIVE_CHARACTER_SLOT_KEY,
  LOCAL_PROFILE_KEY,
  LocalProfileStore,
  createDefaultProfile,
  profileKeyForSlot,
  type StorageLike,
} from "./local-profile";
import { DungeonBossQuestStage } from "../quests/dungeon-boss-quest";
import {
  ACTIVE_SKILL_ORDER,
  DEFAULT_SKILL_HOTKEY_ALIASES,
  SkillId,
} from "../skills/skill-rules";
import { CharacterCreationMode } from "./character-creation-rules";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

function saveDefaultProfile(store: LocalProfileStore) {
  const profile = createDefaultProfile();
  store.save(profile);
  return profile;
}

describe("local profile store", () => {
  it("does not create a profile when loading a fresh account", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    expect(store.load()).toBeNull();
    expect(store.loadSlots()).toEqual([null, null, null]);
    expect(storage.getItem(LOCAL_PROFILE_KEY)).toBeNull();
    expect(storage.getItem(ACTIVE_CHARACTER_SLOT_KEY)).toBeNull();
  });

  it("creates and restores a chosen nickname and rolled base stats", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    store.create({
      name: "그림자07",
      stats: { str: 6, dex: 6, int: 7, luk: 6 },
    });
    expect(new LocalProfileStore(storage).load()).toMatchObject({
      schemaVersion: 16,
      character: {
        name: "그림자07",
        stats: { str: 6, dex: 6, int: 7, luk: 6 },
      },
    });
  });

  it("creates a level 120 Hokage boost only in the selected empty slot", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = store.create(
      {
        name: "부스트호카게",
        stats: { str: 6, dex: 6, int: 7, luk: 6 },
      },
      2,
      CharacterCreationMode.Boost,
    );

    expect(profile.character).toMatchObject({
      name: "부스트호카게",
      level: 120,
      job: PlayerJob.Hokage,
      autoAllocateStats: true,
    });
    expect(store.loadSlot(1)).toBeNull();
    expect(store.loadSlot(2)?.character.level).toBe(120);
    expect(storage.getItem(ACTIVE_CHARACTER_SLOT_KEY)).toBe("2");
  });

  it("creates, selects, and saves three independent character slots", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const stats = { str: 6, dex: 6, int: 7, luk: 6 };

    store.create({ name: "첫그림자", stats }, 1);
    store.create({ name: "둘그림자", stats }, 2);
    store.create({ name: "셋그림자", stats }, 3);

    expect(store.loadSlots().map((profile) => profile?.character.name)).toEqual([
      "첫그림자",
      "둘그림자",
      "셋그림자",
    ]);
    expect(store.getActiveSlot()).toBe(3);
    expect(store.firstAvailableSlot()).toBeNull();
    expect(() => store.create({ name: "넷그림자", stats })).toThrow(
      "All character slots are occupied",
    );

    const second = store.selectSlot(2);
    second.character.mesos = 2_222;
    second.pets.dua.registered = true;
    store.save(second);
    expect(store.load()?.character.name).toBe("둘그림자");
    expect(store.loadSlot(2)?.character.mesos).toBe(2_222);
    expect(store.loadSlot(1)?.character.mesos).toBe(0);
    expect(store.loadSlot(2)?.pets.dua.registered).toBe(true);
    expect(store.loadSlot(1)?.pets.dua.registered).toBe(false);
    expect(storage.getItem(ACTIVE_CHARACTER_SLOT_KEY)).toBe("2");
  });

  it("keeps a legacy fixed-key profile in slot 1 and rejects occupied slots", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...createDefaultProfile(),
        character: { ...DEFAULT_PLAYER_PROFILE, name: "기존그림자" },
      }),
    );
    storage.setItem(ACTIVE_CHARACTER_SLOT_KEY, "3");
    const store = new LocalProfileStore(storage);

    expect(store.getActiveSlot()).toBe(1);
    expect(store.load()?.character.name).toBe("기존그림자");
    expect(() =>
      store.create(
        {
          name: "덮어쓰기",
          stats: { str: 6, dex: 6, int: 7, luk: 6 },
        },
        1,
      ),
    ).toThrow("already occupied");
    expect(store.loadSlot(1)?.character.name).toBe("기존그림자");
  });

  it("clears every character slot and the active selection", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const stats = { str: 6, dex: 6, int: 7, luk: 6 };
    store.create({ name: "첫슬롯", stats }, 1);
    store.create({ name: "둘슬롯", stats }, 2);
    store.clear();

    expect(store.loadSlots()).toEqual([null, null, null]);
    expect(storage.getItem(profileKeyForSlot(1))).toBeNull();
    expect(storage.getItem(profileKeyForSlot(2))).toBeNull();
    expect(storage.getItem(ACTIVE_CHARACTER_SLOT_KEY)).toBeNull();
  });

  it("rejects invalid creation data without occupying the character slot", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    expect(() =>
      store.create({
        name: "잘못 된 이름",
        stats: { str: 6, dex: 6, int: 7, luk: 6 },
      }),
    ).toThrow("Invalid character creation data");
    expect(() =>
      store.create({
        name: "정상닉네임",
        stats: { str: 4, dex: 4, int: 4, luk: 4 },
      }),
    ).toThrow("Invalid character creation data");
    expect(store.load()).toBeNull();
  });

  it("preserves a valid nickname and defaults pets while migrating a schema v14 profile", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...createDefaultProfile(),
        schemaVersion: 14,
        character: { ...DEFAULT_PLAYER_PROFILE, name: "옛그림자" },
        pets: undefined,
      }),
    );
    expect(new LocalProfileStore(storage).load()).toMatchObject({
      schemaVersion: 16,
      character: { name: "옛그림자" },
      pets: { dua: { registered: false } },
    });
  });

  it("builds a level 9 beginner in Kerning City only when requested", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = createDefaultProfile();

    expect(profile.character).toMatchObject({
      id: "local-player",
      level: 9,
      job: "beginner",
      stats: DEFAULT_PLAYER_PROFILE.stats,
      statPoints: 0,
      autoAllocateStats: false,
      skillPoints: 0,
      skillLevels: DEFAULT_PLAYER_PROFILE.skillLevels,
    });
    expect(profile.schemaVersion).toBe(16);
    expect(profile.pets).toEqual({ dua: { registered: false } });
    expect(profile.skillHotbar).toEqual(ACTIVE_SKILL_ORDER);
    expect(profile.skillHotkeyAliases).toEqual(DEFAULT_SKILL_HOTKEY_ALIASES);
    expect(profile.throwingStars).toEqual({
      owned: ["tier1"],
      equipped: "tier1",
    });
    expect(profile.location).toBe("kerningCity");
    expect(profile.activeJobAdvancementQuest).toBeNull();
    expect(profile.dungeonBossQuest).toEqual({
      id: "moonlitSeal",
      stage: DungeonBossQuestStage.Offer,
    });
    expect(store.load()).toBeNull();
    expect(storage.getItem(LOCAL_PROFILE_KEY)).toBeNull();
  });

  it("restores job and mesos from the same fixed profile", () => {
    const storage = new MemoryStorage();
    const firstSession = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(firstSession);
    profile.character.job = PlayerJob.Assassin;
    profile.character.mesos = 1234;
    firstSession.save(profile);

    const nextSession = new LocalProfileStore(storage);
    expect(nextSession.load()?.character).toMatchObject({
      job: PlayerJob.Assassin,
      mesos: 1234,
    });
  });

  it("persists Dua registration in the active character profile", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.pets.dua.registered = true;
    store.save(profile);

    expect(new LocalProfileStore(storage).load()?.pets).toEqual({
      dua: { registered: true },
    });
  });

  it("persists the exact final-boss map in schema v16", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.location = "infiniteDuelGround";
    store.save(profile);

    const restored = new LocalProfileStore(storage).load();
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Expected a stored profile.");
    expect(restored.schemaVersion).toBe(16);
    expect(restored.location).toBe("infiniteDuelGround");
  });

  it("persists Patience Forest as an exact schema v16 location", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.location = "patienceForest";
    store.save(profile);

    const restored = new LocalProfileStore(storage).load();
    expect(restored).not.toBeNull();
    if (!restored) throw new Error("Expected a stored profile.");
    expect(restored.schemaVersion).toBe(16);
    expect(restored.location).toBe("patienceForest");
  });

  it("persists the reward-only Giant Icicle as an owned and equipped weapon", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.throwingStars = {
      owned: ["tier1", "tier6"],
      equipped: "tier6",
    };
    store.save(profile);

    expect(new LocalProfileStore(storage).load()?.throwingStars).toEqual({
      owned: ["tier1", "tier6"],
      equipped: "tier6",
    });
  });

  it("migrates v9 profiles and persists dungeon boss quest progress in schema v16", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 9,
        character: DEFAULT_PLAYER_PROFILE,
        location: "emberMine",
        exp: 0,
        inventory: {},
        throwingStars: { owned: ["tier1"], equipped: "tier1" },
        activeJobAdvancementQuest: null,
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated).toMatchObject({
      schemaVersion: 16,
      dungeonBossQuest: { id: "moonlitSeal", stage: DungeonBossQuestStage.Offer },
    });
    migrated.dungeonBossQuest.stage = DungeonBossQuestStage.FinalBoss;
    new LocalProfileStore(storage).save(migrated);
    expect(new LocalProfileStore(storage).load()!.dungeonBossQuest.stage).toBe(
      DungeonBossQuestStage.FinalBoss,
    );
  });

  it("migrates the v10 final-boss target to the new upper-boss stage", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...createDefaultProfile(),
        schemaVersion: 10,
        location: "moonlitArcaneLibrary",
        dungeonBossQuest: {
          id: "moonlitSeal",
          stage: DungeonBossQuestStage.FinalBoss,
        },
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.location).toBe("moonlitArcaneLibrary");
    expect(migrated.dungeonBossQuest.stage).toBe(DungeonBossQuestStage.UpperBoss);
  });

  it("repairs damaged dungeon boss quest progress", () => {
    const storage = new MemoryStorage();
    const profile = createDefaultProfile();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...profile,
        dungeonBossQuest: { id: "wrong", stage: "skipped" },
      }),
    );

    expect(new LocalProfileStore(storage).load()!.dungeonBossQuest.stage).toBe(
      DungeonBossQuestStage.Offer,
    );
  });

  it("repairs malformed schema v16 pet registration", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...createDefaultProfile(),
        pets: { dua: { registered: "yes" } },
      }),
    );

    expect(new LocalProfileStore(storage).load()!.pets).toEqual({
      dua: { registered: false },
    });
  });

  it("restores stats, remaining AP, and the auto-allocation option", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.character.stats.luk += 3;
    profile.character.statPoints = 2;
    profile.character.autoAllocateStats = true;
    store.save(profile);

    expect(new LocalProfileStore(storage).load()!.character).toMatchObject({
      stats: { ...DEFAULT_PLAYER_PROFILE.stats, luk: DEFAULT_PLAYER_PROFILE.stats.luk + 3 },
      statPoints: 2,
      autoAllocateStats: true,
    });
  });

  it("restores remaining SP and allocated skill levels", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.character.job = PlayerJob.Assassin;
    profile.character.skillPoints = 4;
    profile.character.skillLevels.luckySeven = 12;
    profile.character.skillLevels.keenSight = 8;
    profile.character.skillLevels.drain = 3;
    profile.character.skillLevels.criticalThrow = 2;
    store.save(profile);

    expect(new LocalProfileStore(storage).load()!.character).toMatchObject({
      skillPoints: 4,
      skillLevels: {
        luckySeven: 12,
        keenSight: 8,
        drain: 3,
        criticalThrow: 2,
        avenger: 0,
        shadowBreathing: 0,
      },
    });
  });

  it("migrates v4 SP and active levels while backfilling passive levels", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 4,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: PlayerJob.Hermit,
          level: 60,
          skillPoints: 17,
          skillLevels: { luckySeven: 12, drain: 7, avenger: 3 },
        },
        location: "kerningCity",
        exp: 0,
        inventory: {},
        activeJobAdvancementQuest: null,
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character.skillPoints).toBe(17);
    expect(migrated.character.skillLevels).toEqual({
      luckySeven: 12,
      shadowVolley: 0,
      keenSight: 0,
      drain: 7,
      phantomStars: 0,
      criticalThrow: 0,
      avenger: 3,
      abyssRain: 0,
      shadowBreathing: 0,
      rasengan: 0,
      nineTailsTransformation: 0,
      tailedBeastBomb: 0,
      teamAssault: 0,
      thunderOrb: 0,
      sageMode: 0,
    });
  });

  it("migrates v5 profiles by preserving old skills and backfilling Hokage skills", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 5,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: PlayerJob.Hermit,
          level: 120,
          skillPoints: 9,
          skillLevels: {
            luckySeven: 20,
            keenSight: 20,
            drain: 20,
            criticalThrow: 20,
            avenger: 20,
            shadowBreathing: 20,
          },
        },
        location: "kerningCity",
        exp: 0,
        inventory: {},
        activeJobAdvancementQuest: null,
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character.skillPoints).toBe(9);
    expect(migrated.character.skillLevels).toMatchObject({
      luckySeven: 20,
      shadowVolley: 0,
      shadowBreathing: 20,
      rasengan: 0,
      nineTailsTransformation: 0,
      tailedBeastBomb: 0,
      teamAssault: 0,
      thunderOrb: 0,
      sageMode: 0,
    });
  });

  it("migrates a v1 thief and backfills level-earned recommended stats", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 1,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: "thief",
          level: 30,
        },
        location: "kerningCity",
        exp: 0,
        inventory: {},
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character).toMatchObject({
      job: PlayerJob.Rogue,
      stats: {
        str: DEFAULT_PLAYER_PROFILE.stats.str,
        dex: DEFAULT_PLAYER_PROFILE.stats.dex + 20,
        int: DEFAULT_PLAYER_PROFILE.stats.int,
        luk: DEFAULT_PLAYER_PROFILE.stats.luk + 80,
      },
      statPoints: 0,
      skillPoints: 60,
      skillLevels: DEFAULT_PLAYER_PROFILE.skillLevels,
    });
  });

  it("creates independent nested stat objects", () => {
    const first = createDefaultProfile();
    const second = createDefaultProfile();
    first.character.stats.luk += 1;
    first.character.skillLevels.luckySeven += 1;
    first.pets.dua.registered = true;
    expect(second.character.stats.luk).toBe(DEFAULT_PLAYER_PROFILE.stats.luk);
    expect(second.character.skillLevels.luckySeven).toBe(0);
    expect(second.pets.dua.registered).toBe(false);
  });

  it("restores EXP and collected item amounts", () => {
    const storage = new MemoryStorage();
    const firstSession = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(firstSession);
    profile.exp = 72;
    profile.inventory.mushroomCap = 3;
    profile.inventory.puppuccino = 1;
    firstSession.save(profile);

    const restored = new LocalProfileStore(storage).load()!;
    expect(restored.exp).toBe(72);
    expect(restored.inventory).toEqual({ mushroomCap: 3, puppuccino: 1 });
  });

  it("treats corrupt local data as an empty character slot", () => {
    const storage = new MemoryStorage();
    storage.setItem(LOCAL_PROFILE_KEY, "not-json");

    const store = new LocalProfileStore(storage);
    expect(store.load()).toBeNull();
    expect(store.getActiveSlot()).toBeNull();
  });

  it("normalizes invalid and pathological progression values", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 2,
        character: {
          job: "hermit",
          level: Number.MAX_SAFE_INTEGER,
          hp: 999,
          maxHp: 200,
          mp: -1,
          maxMp: 0,
          mesos: 1.5,
          stats: {
            str: -1,
            dex: 1.5,
            int: Number.MAX_SAFE_INTEGER,
            luk: 99,
          },
          statPoints: Number.MAX_SAFE_INTEGER,
          autoAllocateStats: "yes",
        },
        location: "greenMushroomCave",
        exp: Number.MAX_SAFE_INTEGER,
        inventory: {
          mushroomCap: 2,
          revivalCharm: 99,
          unknownItem: 99,
          recoveryBottle: -1,
        },
      }),
    );

    const profile = new LocalProfileStore(storage).load()!;
    expect(profile.character).toMatchObject({
      job: PlayerJob.Hermit,
      level: 9,
      hp: 200,
      maxHp: 200,
      mp: 90,
      maxMp: 90,
      mesos: 0,
      stats: {
        str: DEFAULT_PLAYER_PROFILE.stats.str,
        dex: DEFAULT_PLAYER_PROFILE.stats.dex,
        int: DEFAULT_PLAYER_PROFILE.stats.int,
        luk: 99,
      },
      statPoints: 0,
      autoAllocateStats: false,
    });
    expect(profile.exp).toBe(99);
    expect(profile.inventory).toEqual({ mushroomCap: 2, revivalCharm: 1 });
    expect(profile.activeJobAdvancementQuest).toBeNull();
    expect(profile.character.skillPoints).toBe(0);
    expect(profile.character.skillLevels).toEqual(DEFAULT_PLAYER_PROFILE.skillLevels);
  });

  it("restores and clamps a valid v3 advancement trial", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: PlayerJob.Rogue,
          level: 30,
        },
        location: "kerningCity",
        exp: 0,
        inventory: {},
        activeJobAdvancementQuest: { id: "assassinTrial", defeated: 99 },
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.activeJobAdvancementQuest).toEqual({
      id: "assassinTrial",
      defeated: 6,
    });
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character.skillPoints).toBe(60);
  });

  it("drops a trial that does not match the current job", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 3,
        character: DEFAULT_PLAYER_PROFILE,
        location: "kerningCity",
        exp: 0,
        inventory: {},
        activeJobAdvancementQuest: { id: "hermitTrial", defeated: 1 },
      }),
    );

    expect(new LocalProfileStore(storage).load()!.activeJobAdvancementQuest).toBeNull();
  });

  it("migrates v6 profiles and normalizes persisted throwing-star equipment", () => {
    const storage = new MemoryStorage();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 6,
        character: DEFAULT_PLAYER_PROFILE,
        location: "kerningCity",
        exp: 0,
        inventory: {},
        activeJobAdvancementQuest: null,
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.throwingStars).toEqual({
      owned: ["tier1"],
      equipped: "tier1",
    });

    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...migrated,
        throwingStars: {
          owned: ["tier3", "tier3", "unknown"],
          equipped: "tier5",
        },
      }),
    );
    expect(new LocalProfileStore(storage).load()!.throwingStars).toEqual({
      owned: ["tier1", "tier3"],
      equipped: "tier1",
    });
  });

  it("migrates v7 equipment profiles while backfilling Team Assault", () => {
    const storage = new MemoryStorage();
    const legacySkillLevels = { ...DEFAULT_PLAYER_PROFILE.skillLevels } as Record<
      string,
      number
    >;
    delete legacySkillLevels.teamAssault;
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        schemaVersion: 7,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: PlayerJob.Hokage,
          skillLevels: legacySkillLevels,
        },
        location: "kerningCity",
        exp: 0,
        inventory: {},
        throwingStars: { owned: ["tier1", "tier4"], equipped: "tier4" },
        activeJobAdvancementQuest: null,
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character.skillLevels.teamAssault).toBe(0);
    expect(migrated.throwingStars).toEqual({
      owned: ["tier1", "tier4"],
      equipped: "tier4",
    });
  });

  it("migrates v11 profiles while preserving old skills and backfilling four actives", () => {
    const storage = new MemoryStorage();
    const legacySkillLevels = { ...DEFAULT_PLAYER_PROFILE.skillLevels } as Record<
      string,
      number
    >;
    legacySkillLevels.luckySeven = 9;
    delete legacySkillLevels.shadowVolley;
    delete legacySkillLevels.phantomStars;
    delete legacySkillLevels.abyssRain;
    delete legacySkillLevels.thunderOrb;
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...createDefaultProfile(),
        schemaVersion: 11,
        character: {
          ...DEFAULT_PLAYER_PROFILE,
          job: PlayerJob.Hokage,
          skillLevels: legacySkillLevels,
        },
      }),
    );

    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.character.skillLevels).toMatchObject({
      luckySeven: 9,
      shadowVolley: 0,
      phantomStars: 0,
      abyssRain: 0,
      thunderOrb: 0,
    });
  });

  it("persists a custom skill hotbar and repairs duplicates or missing skills", () => {
    const storage = new MemoryStorage();
    const store = new LocalProfileStore(storage);
    const profile = saveDefaultProfile(store);
    profile.skillHotbar = [
      SkillId.PhantomStars,
      SkillId.ShadowVolley,
      SkillId.Drain,
      SkillId.LuckySeven,
      ...ACTIVE_SKILL_ORDER.slice(4),
    ];
    store.save(profile);

    expect(new LocalProfileStore(storage).load()!.skillHotbar).toEqual(
      profile.skillHotbar,
    );

    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...profile,
        skillHotbar: [SkillId.Drain, SkillId.Drain, "broken"],
      }),
    );
    expect(new LocalProfileStore(storage).load()!.skillHotbar).toEqual([
      SkillId.Drain,
      ...ACTIVE_SKILL_ORDER.filter((skillId) => skillId !== SkillId.Drain),
    ]);
  });

  it("migrates v15 extra hotkeys and preserves configured or cleared v16 aliases", () => {
    const storage = new MemoryStorage();
    const legacy = createDefaultProfile();
    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...legacy,
        schemaVersion: 15,
        skillHotkeyAliases: undefined,
      }),
    );
    const migrated = new LocalProfileStore(storage).load()!;
    expect(migrated.schemaVersion).toBe(16);
    expect(migrated.skillHotkeyAliases).toEqual(DEFAULT_SKILL_HOTKEY_ALIASES);

    migrated.skillHotkeyAliases = {
      Shift: SkillId.ThunderOrb,
      A: SkillId.Drain,
      S: SkillId.PhantomStars,
    };
    new LocalProfileStore(storage).save(migrated);
    expect(new LocalProfileStore(storage).load()!.skillHotkeyAliases).toEqual(
      migrated.skillHotkeyAliases,
    );

    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({ ...migrated, skillHotkeyAliases: {} }),
    );
    expect(new LocalProfileStore(storage).load()!.skillHotkeyAliases).toEqual({});

    storage.setItem(
      LOCAL_PROFILE_KEY,
      JSON.stringify({
        ...migrated,
        skillHotkeyAliases: {
          A: SkillId.Drain,
          Q: "broken",
          Z: SkillId.ThunderOrb,
          Unknown: SkillId.Avenger,
        },
      }),
    );
    expect(new LocalProfileStore(storage).load()!.skillHotkeyAliases).toEqual({
      A: SkillId.Drain,
    });
  });
});
