import { describe, expect, it } from "vitest";
import { DEFAULT_PLAYER_PROFILE, PlayerStat } from "../data/catalog";
import {
  GREEN_MUSHROOM_EXP,
  MAX_CHARACTER_LEVEL,
  RECOVERY_RULES,
  SKILL_POINTS_PER_LEVEL,
  STAT_POINTS_PER_LEVEL,
  allocateStatPoint,
  autoAllocateStatPoints,
  awardExperience,
  canApplyRecoveryTick,
  expRequiredForLevel,
  recoverCharacter,
  recoveryIntervalMs,
} from "./progression-rules";

describe("progression rules", () => {
  it("awards green mushroom EXP and carries overflow through a level-up", () => {
    const result = awardExperience(
      { ...DEFAULT_PLAYER_PROFILE, level: 10, hp: 1, mp: 1 },
      expRequiredForLevel(10) - 10,
      GREEN_MUSHROOM_EXP,
    );

    expect(result.levelsGained).toBe(1);
    expect(result.character.level).toBe(11);
    expect(result.exp).toBe(GREEN_MUSHROOM_EXP - 10);
    expect(result.character.hp).toBe(result.character.maxHp);
    expect(result.character.mp).toBe(result.character.maxMp);
    expect(result.statPointsGained).toBe(STAT_POINTS_PER_LEVEL);
    expect(result.character.statPoints).toBe(STAT_POINTS_PER_LEVEL);
    expect(result.skillPointsGained).toBe(SKILL_POINTS_PER_LEVEL);
    expect(result.character.skillPoints).toBe(SKILL_POINTS_PER_LEVEL);
  });

  it("never reduces EXP when a negative reward is supplied", () => {
    const result = awardExperience({ ...DEFAULT_PLAYER_PROFILE }, 25, -100);
    expect(result.exp).toBe(25);
    expect(result.levelsGained).toBe(0);
  });

  it("reports the final level after multiple level-ups without mutating the source", () => {
    const character = { ...DEFAULT_PLAYER_PROFILE, level: 10, hp: 1, mp: 2 };
    const result = awardExperience(character, 0, 250);

    expect(result.levelsGained).toBe(2);
    expect(result.character.level).toBe(12);
    expect(result.exp).toBe(10);
    expect(result.character.maxHp).toBe(character.maxHp + 28);
    expect(result.character.maxMp).toBe(character.maxMp + 14);
    expect(result.character.hp).toBe(result.character.maxHp);
    expect(result.character.mp).toBe(result.character.maxMp);
    expect(result.character.statPoints).toBe(10);
    expect(result.character.skillPoints).toBe(6);
    expect(character).toMatchObject({ level: 10, hp: 1, mp: 2 });
  });

  it("does not award levels or overflow stats beyond level 200", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      level: MAX_CHARACTER_LEVEL,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    const result = awardExperience(character, 19, 20_000);

    expect(result.character.level).toBe(MAX_CHARACTER_LEVEL);
    expect(result.exp).toBe(19);
    expect(result.levelsGained).toBe(0);
    expect(result.statPointsGained).toBe(0);
    expect(result.skillPointsGained).toBe(0);
    expect(result.character.maxHp).toBe(character.maxHp);
    expect(result.character.maxMp).toBe(character.maxMp);
  });

  it("clamps excess EXP when an award reaches level 200", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      level: MAX_CHARACTER_LEVEL - 1,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    const result = awardExperience(character, 0, 20_000);

    expect(result.character.level).toBe(MAX_CHARACTER_LEVEL);
    expect(result.levelsGained).toBe(1);
    expect(result.exp).toBe(expRequiredForLevel(MAX_CHARACTER_LEVEL) - 1);
  });

  it("allocates AP manually without mutating the source", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
      statPoints: 2,
    };
    const allocated = allocateStatPoint(character, PlayerStat.Luk);

    expect(allocated.stats.luk).toBe(character.stats.luk + 1);
    expect(allocated.statPoints).toBe(1);
    expect(character.stats.luk).toBe(DEFAULT_PLAYER_PROFILE.stats.luk);
    expect(
      allocateStatPoint({ ...character, statPoints: 0 }, PlayerStat.Dex),
    ).toMatchObject({ statPoints: 0, stats: character.stats });
  });

  it("auto-allocates every five AP as LUK +4 and DEX +1", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
      statPoints: 12,
    };
    const allocated = autoAllocateStatPoints(character);

    expect(allocated.statPoints).toBe(0);
    expect(allocated.stats.dex).toBe(character.stats.dex + 2);
    expect(allocated.stats.luk).toBe(character.stats.luk + 10);
    expect(allocated.stats.str).toBe(character.stats.str);
    expect(allocated.stats.int).toBe(character.stats.int);
  });

  it("automatically distributes newly earned AP when the option is enabled", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      stats: { ...DEFAULT_PLAYER_PROFILE.stats },
      autoAllocateStats: true,
    };
    const result = awardExperience(
      character,
      expRequiredForLevel(character.level) - 1,
      1,
    );

    expect(result.statsAutoAllocated).toBe(true);
    expect(result.character.statPoints).toBe(0);
    expect(result.character.stats.dex).toBe(character.stats.dex + 1);
    expect(result.character.stats.luk).toBe(character.stats.luk + 4);
  });

  it("bounds pathological EXP input to a finite amount of work", () => {
    const result = awardExperience(
      { ...DEFAULT_PLAYER_PROFILE },
      Number.MAX_VALUE,
      Number.MAX_VALUE,
    );

    expect(result.levelsGained).toBeGreaterThan(0);
    expect(result.levelsGained).toBeLessThan(1_000);
    expect(result.exp).toBeLessThan(expRequiredForLevel(result.character.level));
  });

  it("delays natural recovery after damage", () => {
    const now = 10_000;
    expect(
      canApplyRecoveryTick(
        now,
        now - RECOVERY_RULES.intervalMs,
        now - RECOVERY_RULES.damageDelayMs + 1,
      ),
    ).toBe(false);
    expect(
      canApplyRecoveryTick(
        now,
        now - RECOVERY_RULES.intervalMs,
        now - RECOVERY_RULES.damageDelayMs,
      ),
    ).toBe(true);
  });

  it(
    "shortens the recovery interval with Shadow Breathing without bypassing damage delay",
    () => {
      const now = 10_000;
      const masteredShadowBreathing = {
        ...DEFAULT_PLAYER_PROFILE.skillLevels,
        shadowBreathing: 20,
      };
      const intervalMs = recoveryIntervalMs(masteredShadowBreathing);

      expect(recoveryIntervalMs(DEFAULT_PLAYER_PROFILE.skillLevels)).toBe(
        RECOVERY_RULES.intervalMs,
      );
      expect(intervalMs).toBe(960);
      expect(
        canApplyRecoveryTick(
          now,
          now - intervalMs + 1,
          now - RECOVERY_RULES.damageDelayMs,
          intervalMs,
        ),
      ).toBe(false);
      expect(
        canApplyRecoveryTick(
          now,
          now - intervalMs,
          now - RECOVERY_RULES.damageDelayMs,
          intervalMs,
        ),
      ).toBe(true);
      expect(
        canApplyRecoveryTick(
          now,
          now - intervalMs,
          now - RECOVERY_RULES.damageDelayMs + 1,
          intervalMs,
        ),
      ).toBe(false);
    },
  );

  it("greatly accelerates natural recovery with Sage Mode", () => {
    const masteredSageMode = {
      ...DEFAULT_PLAYER_PROFILE.skillLevels,
      sageMode: 20,
    };
    const bothMastered = {
      ...masteredSageMode,
      shadowBreathing: 20,
    };

    expect(recoveryIntervalMs(masteredSageMode)).toBe(320);
    expect(recoveryIntervalMs(bothMastered)).toBe(192);
  });

  it("recovers HP and MP without exceeding their maximums", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      hp: DEFAULT_PLAYER_PROFILE.maxHp - 2,
      mp: DEFAULT_PLAYER_PROFILE.maxMp - 1,
    };
    const result = recoverCharacter(character);

    expect(result.character.hp).toBe(character.maxHp);
    expect(result.character.mp).toBe(character.maxMp);
    expect(result.hpRecovered).toBe(2);
    expect(result.mpRecovered).toBe(1);
  });

  it("can keep MP recovery paused while still recovering HP", () => {
    const character = {
      ...DEFAULT_PLAYER_PROFILE,
      hp: DEFAULT_PLAYER_PROFILE.maxHp - 5,
      mp: DEFAULT_PLAYER_PROFILE.maxMp - 5,
    };
    const result = recoverCharacter(character, false);

    expect(result.character.hp).toBeGreaterThan(character.hp);
    expect(result.character.mp).toBe(character.mp);
    expect(result.mpRecovered).toBe(0);
  });
});
