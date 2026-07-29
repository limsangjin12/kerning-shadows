import { describe, expect, it } from "vitest";
import { assertTransition, canTransition, SceneKey } from "./game-flow";

describe("game flow", () => {
  it("allows the required P1 entry flow", () => {
    expect(canTransition(SceneKey.Boot, SceneKey.Login)).toBe(true);
    expect(canTransition(SceneKey.Login, SceneKey.CharacterSelect)).toBe(true);
    expect(canTransition(SceneKey.Login, SceneKey.CharacterCreate)).toBe(true);
    expect(canTransition(SceneKey.CharacterCreate, SceneKey.CharacterSelect)).toBe(true);
    expect(canTransition(SceneKey.CharacterSelect, SceneKey.CharacterCreate)).toBe(true);
    expect(canTransition(SceneKey.CharacterSelect, SceneKey.Gameplay)).toBe(true);
    expect(canTransition(SceneKey.Gameplay, SceneKey.CharacterCreate)).toBe(true);
  });

  it("rejects invalid scene jumps", () => {
    expect(() => assertTransition(SceneKey.Login, SceneKey.Gameplay)).toThrow(
      "Invalid scene transition",
    );
  });
});
