import { describe, expect, it } from "vitest";
import {
  BOOST_CHARACTER_LEVEL,
  CREATION_STAT_MAX,
  CREATION_STAT_MIN,
  CREATION_STAT_TOTAL,
  boostCharacterToHokage,
  isValidCreationStats,
  normalizeCharacterName,
  rollCreationStats,
  validateCharacterName,
} from "./character-creation-rules";
import { DEFAULT_PLAYER_PROFILE, PlayerJob } from "../data/catalog";
import { SKILL_DEFINITIONS, SKILL_ORDER } from "../skills/skill-rules";

describe("character creation rules", () => {
  it("accepts Korean, Latin, and numeric nicknames after trimming", () => {
    expect(validateCharacterName("  그림자07  ")).toEqual({
      valid: true,
      name: "그림자07",
      message: "사용할 수 있는 닉네임입니다.",
    });
  });

  it("accepts standalone and combining Korean jamo", () => {
    expect(validateCharacterName("ㄱㅏ")).toMatchObject({
      valid: true,
      name: "ㄱㅏ",
    });
    expect(validateCharacterName("가나")).toEqual({
      valid: true,
      name: "가나",
      message: "사용할 수 있는 닉네임입니다.",
    });
  });

  it("rejects names outside the length and character rules", () => {
    expect(validateCharacterName("A").valid).toBe(false);
    expect(validateCharacterName("너무_긴 닉네임입니다").valid).toBe(false);
    expect(validateCharacterName("그림자 도적").valid).toBe(false);
    expect(validateCharacterName("도적🥷").valid).toBe(false);
  });

  it("uses the fallback when a stored nickname is damaged", () => {
    expect(normalizeCharacterName("잘못 된 이름", "루키")).toBe("루키");
  });

  it("rolls exactly 25 points while keeping every stat between 4 and 13", () => {
    let seed = 7;
    const stats = rollCreationStats(() => {
      seed = (seed * 17 + 11) % 97;
      return seed / 97;
    });
    const values = Object.values(stats);
    expect(values.reduce((sum, value) => sum + value, 0)).toBe(CREATION_STAT_TOTAL);
    expect(Math.min(...values)).toBeGreaterThanOrEqual(CREATION_STAT_MIN);
    expect(Math.max(...values)).toBeLessThanOrEqual(CREATION_STAT_MAX);
    expect(isValidCreationStats(stats)).toBe(true);
  });

  it("rejects incomplete, fractional, out-of-range, and wrong-total stats", () => {
    expect(isValidCreationStats({ str: 6, dex: 6, int: 7, luk: 6 })).toBe(true);
    expect(isValidCreationStats({ str: 6, dex: 6, int: 7 })).toBe(false);
    expect(isValidCreationStats({ str: 6.5, dex: 6, int: 6, luk: 6.5 })).toBe(false);
    expect(isValidCreationStats({ str: 3, dex: 7, int: 7, luk: 8 })).toBe(false);
    expect(isValidCreationStats({ str: 6, dex: 6, int: 6, luk: 6 })).toBe(false);
  });

  it("clamps unusual random sources without producing invalid stats", () => {
    for (const randomValue of [-10, 99, Number.NaN]) {
      const stats = rollCreationStats(() => randomValue);
      expect(Object.values(stats).reduce((sum, value) => sum + value, 0)).toBe(25);
      expect(Math.max(...Object.values(stats))).toBeLessThanOrEqual(13);
    }
  });

  it("creates a fully progressed level 120 Hokage boost without mutating the base", () => {
    const base = {
      ...DEFAULT_PLAYER_PROFILE,
      name: "부스트도적",
      stats: { str: 6, dex: 6, int: 7, luk: 6 },
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    };
    const boosted = boostCharacterToHokage(base);

    expect(boosted).toMatchObject({
      name: "부스트도적",
      level: BOOST_CHARACTER_LEVEL,
      job: PlayerJob.Hokage,
      hp: 1_734,
      maxHp: 1_734,
      mp: 867,
      maxMp: 867,
      stats: { str: 6, dex: 117, int: 7, luk: 450 },
      statPoints: 0,
      autoAllocateStats: true,
      skillPoints: 33,
    });
    for (const skillId of SKILL_ORDER) {
      expect(boosted.skillLevels[skillId]).toBe(
        SKILL_DEFINITIONS[skillId].maxLevel,
      );
    }
    expect(base).toEqual({
      ...DEFAULT_PLAYER_PROFILE,
      name: "부스트도적",
      stats: { str: 6, dex: 6, int: 7, luk: 6 },
      skillLevels: { ...DEFAULT_PLAYER_PROFILE.skillLevels },
    });
  });
});
