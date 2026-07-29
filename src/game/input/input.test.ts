import { describe, expect, it } from "vitest";
import {
  DEFAULT_INPUT_BINDINGS,
  GameAction,
  actionForCode,
  inputBindingsForSkillHotbar,
  type InputBindings,
} from "./actions";
import {
  ACTIVE_SKILL_ORDER,
  SkillId,
  normalizeSkillHotkeyAliases,
} from "../skills/skill-rules";
import { shouldCaptureGameKey } from "./input-controller";
import { InputState } from "./input-state";

describe("default input bindings", () => {
  it.each([
    ["ControlLeft", GameAction.BasicAttack],
    ["ControlRight", GameAction.BasicAttack],
    ["AltLeft", GameAction.Jump],
    ["AltRight", GameAction.Jump],
    ["ShiftLeft", GameAction.LuckySeven],
    ["ShiftRight", GameAction.LuckySeven],
    ["KeyQ", GameAction.ShadowVolley],
    ["KeyX", GameAction.Drain],
    ["KeyW", GameAction.PhantomStars],
    ["KeyC", GameAction.Avenger],
    ["KeyE", GameAction.AbyssRain],
    ["KeyR", GameAction.ThunderOrb],
    ["KeyS", GameAction.OpenStats],
    ["KeyK", GameAction.OpenSkills],
    ["KeyI", GameAction.OpenInventory],
    ["Escape", GameAction.OpenMenu],
    ["Digit1", GameAction.LuckySeven],
    ["Numpad1", GameAction.LuckySeven],
    ["Digit2", GameAction.ShadowVolley],
    ["Numpad2", GameAction.ShadowVolley],
    ["Digit3", GameAction.Drain],
    ["Numpad3", GameAction.Drain],
    ["Digit4", GameAction.PhantomStars],
    ["Numpad4", GameAction.PhantomStars],
    ["Digit5", GameAction.Avenger],
    ["Numpad5", GameAction.Avenger],
    ["Digit6", GameAction.AbyssRain],
    ["Numpad6", GameAction.AbyssRain],
    ["Digit7", GameAction.Rasengan],
    ["Numpad7", GameAction.Rasengan],
    ["Digit8", GameAction.NineTailsTransformation],
    ["Numpad8", GameAction.NineTailsTransformation],
    ["Digit9", GameAction.TailedBeastBomb],
    ["Numpad9", GameAction.TailedBeastBomb],
    ["Digit0", GameAction.TeamAssault],
    ["Numpad0", GameAction.TeamAssault],
    ["Minus", GameAction.ThunderOrb],
    ["NumpadSubtract", GameAction.ThunderOrb],
    ["KeyV", GameAction.Rasengan],
    ["KeyB", GameAction.NineTailsTransformation],
    ["KeyN", GameAction.TeamAssault],
    ["ArrowLeft", GameAction.MoveLeft],
    ["ArrowRight", GameAction.MoveRight],
    ["ArrowDown", GameAction.MoveDown],
    ["ArrowUp", GameAction.Interact],
    ["KeyZ", GameAction.Loot],
  ])("maps %s to %s", (code, action) => {
    expect(actionForCode(code, DEFAULT_INPUT_BINDINGS)).toBe(action);
  });

  it("supports remapping without changing gameplay actions", () => {
    const remapped: InputBindings = { KeyA: GameAction.MoveLeft };
    expect(actionForCode("KeyA", remapped)).toBe(GameAction.MoveLeft);
    expect(actionForCode("ArrowLeft", remapped)).toBeUndefined();
  });

  it("uses every action-bar slot only for active skills", () => {
    expect(actionForCode("Digit2", DEFAULT_INPUT_BINDINGS)).toBe(
      GameAction.ShadowVolley,
    );
    expect(actionForCode("NumpadSubtract", DEFAULT_INPUT_BINDINGS)).toBe(
      GameAction.ThunderOrb,
    );
  });

  it("uses QWER in tier order without keeping the former equipment and T keys", () => {
    expect(
      ["KeyQ", "KeyW", "KeyE", "KeyR"].map((code) =>
        actionForCode(code, DEFAULT_INPUT_BINDINGS),
      ),
    ).toEqual([
      GameAction.ShadowVolley,
      GameAction.PhantomStars,
      GameAction.AbyssRain,
      GameAction.ThunderOrb,
    ]);
    expect(actionForCode("KeyT", DEFAULT_INPUT_BINDINGS)).toBeUndefined();
  });

  it("remaps number keys from the saved hotbar without changing QWER", () => {
    const swapped = [...ACTIVE_SKILL_ORDER];
    [swapped[0], swapped[3]] = [swapped[3]!, swapped[0]!];
    const bindings = inputBindingsForSkillHotbar(swapped);
    expect(actionForCode("Digit1", bindings)).toBe(GameAction.PhantomStars);
    expect(actionForCode("Digit4", bindings)).toBe(GameAction.LuckySeven);
    expect(actionForCode("KeyQ", bindings)).toBe(GameAction.ShadowVolley);
    expect(actionForCode("KeyW", bindings)).toBe(GameAction.PhantomStars);
    expect(swapped[0]).toBe(SkillId.PhantomStars);
  });

  it("maps configurable extra keys while keeping Z fixed to loot pickup", () => {
    const aliases = normalizeSkillHotkeyAliases({
      Shift: SkillId.ThunderOrb,
      A: SkillId.PhantomStars,
      S: SkillId.Drain,
      Z: SkillId.AbyssRain,
    });
    const bindings = inputBindingsForSkillHotbar(ACTIVE_SKILL_ORDER, {
      ...aliases,
    });
    expect(actionForCode("ShiftLeft", bindings)).toBe(GameAction.ThunderOrb);
    expect(actionForCode("ShiftRight", bindings)).toBe(GameAction.ThunderOrb);
    expect(actionForCode("KeyA", bindings)).toBe(GameAction.PhantomStars);
    expect(actionForCode("KeyS", bindings)).toBe(GameAction.Drain);
    expect(actionForCode("KeyZ", bindings)).toBe(GameAction.Loot);
    expect(actionForCode("KeyQ", bindings)).toBeUndefined();

    const cleared = inputBindingsForSkillHotbar(ACTIVE_SKILL_ORDER, {});
    expect(actionForCode("KeyS", cleared)).toBe(GameAction.OpenStats);
    expect(actionForCode("KeyZ", cleared)).toBe(GameAction.Loot);
    expect(actionForCode("ShiftLeft", cleared)).toBeUndefined();
  });
});

describe("input focus rules", () => {
  it("captures bound keys only while the canvas is focused", () => {
    expect(shouldCaptureGameKey("AltLeft", null, true)).toBe(true);
    expect(shouldCaptureGameKey("AltLeft", null, false)).toBe(false);
    expect(shouldCaptureGameKey("KeyA", null, true)).toBe(false);
    expect(
      shouldCaptureGameKey(
        "KeyA",
        null,
        true,
        inputBindingsForSkillHotbar(ACTIVE_SKILL_ORDER, {
          A: SkillId.LuckySeven,
        }),
      ),
    ).toBe(true);
  });

  it.each(["INPUT", "TEXTAREA", "SELECT"])(
    "does not capture keys from %s",
    (tagName) => {
      const target = { tagName } as unknown as EventTarget;
      expect(shouldCaptureGameKey("ControlLeft", target, true)).toBe(false);
    },
  );
});

describe("input state", () => {
  it("separates held and just-pressed actions", () => {
    const state = new InputState();
    state.press(GameAction.Jump);

    expect(state.isDown(GameAction.Jump)).toBe(true);
    expect(state.consumePressed(GameAction.Jump)).toBe(true);
    expect(state.consumePressed(GameAction.Jump)).toBe(false);

    state.release(GameAction.Jump);
    expect(state.isDown(GameAction.Jump)).toBe(false);
  });

  it("clears held keys when focus is lost", () => {
    const state = new InputState();
    state.press(GameAction.MoveRight);
    state.reset();
    expect(state.isDown(GameAction.MoveRight)).toBe(false);
    expect(state.consumePressed(GameAction.MoveRight)).toBe(false);
  });

  it("does not retrigger a just-pressed action for key repeat events", () => {
    const state = new InputState();
    state.press(GameAction.Loot, false, "KeyZ");
    expect(state.consumePressed(GameAction.Loot)).toBe(true);

    state.press(GameAction.Loot, true, "KeyZ");
    expect(state.isDown(GameAction.Loot)).toBe(true);
    expect(state.consumePressed(GameAction.Loot)).toBe(false);
  });

  it("keeps an aliased action down until every physical key is released", () => {
    const state = new InputState();
    state.press(GameAction.BasicAttack, false, "ControlLeft");
    state.press(GameAction.BasicAttack, false, "ControlRight");

    state.release(GameAction.BasicAttack, "ControlLeft");
    expect(state.isDown(GameAction.BasicAttack)).toBe(true);

    state.release(GameAction.BasicAttack, "ControlRight");
    expect(state.isDown(GameAction.BasicAttack)).toBe(false);
  });
});
