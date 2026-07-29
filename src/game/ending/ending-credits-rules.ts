import type { MonsterKind } from "../data/catalog";

export const ENDING_CREDITS_DURATION_MS = 18_000;
export const ENDING_CREDITS_DEVELOPER = "임상진 with Codex";

export const ENDING_CREDITS = {
  eyebrow: "FINAL BOSS CLEAR",
  title: "게임 크레딧",
  subtitle: "무한의 결투장에 평화가 찾아왔습니다.",
  roles: [
    "시스템",
    "던전 디자인",
    "몬스터 디자인",
    "캐릭터 디자인",
    "스킬 디자인",
    "FX",
    "테스트",
  ],
  reference: {
    role: "게임 레퍼런스",
    credit: "메이플스토리",
  },
  thanks: "플레이해 주셔서 감사합니다.",
} as const;

export function shouldShowEndingCredits(monsterKind: MonsterKind): boolean {
  return monsterKind === "onePunchMan";
}
