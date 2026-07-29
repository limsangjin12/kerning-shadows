import {
  ACTIVE_SKILL_ORDER,
  DEFAULT_SKILL_HOTKEY_ALIASES,
  EXTRA_SKILL_HOTKEYS,
  SkillId,
  skillHotkeyAssignments,
  type ActiveSkillId,
  type ExtraSkillHotkey,
  type SkillHotkey,
  type SkillHotkeyAliases,
} from "../skills/skill-rules";

export const GameAction = {
  MoveLeft: "moveLeft",
  MoveRight: "moveRight",
  MoveDown: "moveDown",
  Interact: "interact",
  BasicAttack: "basicAttack",
  Jump: "jump",
  LuckySeven: "luckySeven",
  ShadowVolley: "shadowVolley",
  Drain: "drain",
  PhantomStars: "phantomStars",
  Avenger: "avenger",
  AbyssRain: "abyssRain",
  Rasengan: "rasengan",
  NineTailsTransformation: "nineTailsTransformation",
  TailedBeastBomb: "tailedBeastBomb",
  TeamAssault: "teamAssault",
  ThunderOrb: "thunderOrb",
  Loot: "loot",
  OpenStats: "openStats",
  OpenSkills: "openSkills",
  OpenInventory: "openInventory",
  OpenMenu: "openMenu",
} as const;

export type GameAction = (typeof GameAction)[keyof typeof GameAction];
export type InputBindings = Readonly<Record<string, GameAction>>;

const SKILL_ACTION_BY_ID: Record<ActiveSkillId, GameAction> = {
  [SkillId.LuckySeven]: GameAction.LuckySeven,
  [SkillId.ShadowVolley]: GameAction.ShadowVolley,
  [SkillId.Drain]: GameAction.Drain,
  [SkillId.PhantomStars]: GameAction.PhantomStars,
  [SkillId.Avenger]: GameAction.Avenger,
  [SkillId.AbyssRain]: GameAction.AbyssRain,
  [SkillId.Rasengan]: GameAction.Rasengan,
  [SkillId.NineTailsTransformation]: GameAction.NineTailsTransformation,
  [SkillId.TailedBeastBomb]: GameAction.TailedBeastBomb,
  [SkillId.TeamAssault]: GameAction.TeamAssault,
  [SkillId.ThunderOrb]: GameAction.ThunderOrb,
};

export function gameActionForSkill(skillId: ActiveSkillId): GameAction {
  return SKILL_ACTION_BY_ID[skillId];
}

function keyCodesForSkillHotkey(hotkey: SkillHotkey): readonly string[] {
  return hotkey === "-"
    ? ["Minus", "NumpadSubtract"]
    : [`Digit${hotkey}`, `Numpad${hotkey}`];
}

function keyCodesForExtraSkillHotkey(
  hotkey: ExtraSkillHotkey,
): readonly string[] {
  return hotkey === "Shift"
    ? ["ShiftLeft", "ShiftRight"]
    : [`Key${hotkey}`];
}

const FIXED_INPUT_BINDINGS: InputBindings = {
  ArrowLeft: GameAction.MoveLeft,
  ArrowRight: GameAction.MoveRight,
  ArrowDown: GameAction.MoveDown,
  ArrowUp: GameAction.Interact,
  ControlLeft: GameAction.BasicAttack,
  ControlRight: GameAction.BasicAttack,
  AltLeft: GameAction.Jump,
  AltRight: GameAction.Jump,
  KeyB: GameAction.NineTailsTransformation,
  KeyN: GameAction.TeamAssault,
  KeyZ: GameAction.Loot,
  KeyS: GameAction.OpenStats,
  KeyK: GameAction.OpenSkills,
  KeyI: GameAction.OpenInventory,
  Escape: GameAction.OpenMenu,
};

export function inputBindingsForSkillHotbar(
  hotbar: readonly ActiveSkillId[],
  aliases: SkillHotkeyAliases = DEFAULT_SKILL_HOTKEY_ALIASES,
): InputBindings {
  const numberSkillBindings = Object.fromEntries(
    skillHotkeyAssignments(hotbar).flatMap(({ hotkey, skillId }) =>
      keyCodesForSkillHotkey(hotkey).map((code) => [
        code,
        SKILL_ACTION_BY_ID[skillId],
      ]),
    ),
  ) as InputBindings;
  const aliasBindings = Object.fromEntries(
    EXTRA_SKILL_HOTKEYS.flatMap((hotkey) => {
      const skillId = aliases[hotkey];
      return skillId
        ? keyCodesForExtraSkillHotkey(hotkey).map((code) => [
            code,
            SKILL_ACTION_BY_ID[skillId],
          ])
        : [];
    }),
  ) as InputBindings;
  return { ...FIXED_INPUT_BINDINGS, ...numberSkillBindings, ...aliasBindings };
}

export const DEFAULT_INPUT_BINDINGS = inputBindingsForSkillHotbar(
  ACTIVE_SKILL_ORDER,
);

export function actionForCode(
  code: string,
  bindings: InputBindings = DEFAULT_INPUT_BINDINGS,
): GameAction | undefined {
  return bindings[code];
}
