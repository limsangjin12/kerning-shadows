export const SceneKey = {
  Boot: "boot",
  Login: "login",
  CharacterCreate: "character-create",
  CharacterSelect: "character-select",
  Gameplay: "gameplay",
} as const;

export type SceneKey = (typeof SceneKey)[keyof typeof SceneKey];

const ALLOWED_TRANSITIONS: Record<SceneKey, readonly SceneKey[]> = {
  [SceneKey.Boot]: [SceneKey.Login],
  [SceneKey.Login]: [SceneKey.CharacterCreate, SceneKey.CharacterSelect],
  [SceneKey.CharacterCreate]: [SceneKey.Login, SceneKey.CharacterSelect],
  [SceneKey.CharacterSelect]: [
    SceneKey.Login,
    SceneKey.CharacterCreate,
    SceneKey.Gameplay,
  ],
  [SceneKey.Gameplay]: [SceneKey.CharacterCreate, SceneKey.CharacterSelect],
};

export function canTransition(from: SceneKey, to: SceneKey): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}

export function assertTransition(from: SceneKey, to: SceneKey): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid scene transition: ${from} -> ${to}`);
  }
}
