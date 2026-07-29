import { describe, expect, it } from "vitest";
import {
  ENDING_CREDITS,
  ENDING_CREDITS_DEVELOPER,
  ENDING_CREDITS_DURATION_MS,
  shouldShowEndingCredits,
} from "./ending-credits-rules";

describe("ending credits", () => {
  it("credits every requested development discipline to 임상진 with Codex", () => {
    expect(ENDING_CREDITS.roles).toEqual([
      "시스템",
      "던전 디자인",
      "몬스터 디자인",
      "캐릭터 디자인",
      "스킬 디자인",
      "FX",
      "테스트",
    ]);
    expect(ENDING_CREDITS_DEVELOPER).toBe("임상진 with Codex");
  });

  it("names MapleStory only as the game reference", () => {
    expect(ENDING_CREDITS.reference).toEqual({
      role: "게임 레퍼런스",
      credit: "메이플스토리",
    });
  });

  it("runs only after One Punch Man and returns from a finite sequence", () => {
    expect(shouldShowEndingCredits("onePunchMan")).toBe(true);
    expect(shouldShowEndingCredits("eclipseArchivist")).toBe(false);
    expect(ENDING_CREDITS_DURATION_MS).toBeGreaterThan(0);
    expect(ENDING_CREDITS_DURATION_MS).toBeLessThanOrEqual(20_000);
  });
});
