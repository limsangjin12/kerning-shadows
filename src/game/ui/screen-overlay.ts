import {
  ATTACK_DEFINITIONS,
  type AttackKind as AttackKindType,
} from "../combat/combat-rules";
import equippedThrowingStarsUrl from "../../../assets/sprites/core/equipped-throwing-stars-v1.webp?url";
import { SKILL_ICON_URLS } from "../assets/skill-icon-assets";
import {
  ITEM_CATALOG,
  NPC_CATALOG,
  PlayerStat,
  playerJobLabel,
  type PlayerProfile,
  type PlayerStat as PlayerStatType,
} from "../data/catalog";
import {
  CHARACTER_SLOT_COUNT,
  CHARACTER_SLOTS,
  type CharacterSlot,
  type LocalProfile,
} from "../profile/local-profile";
import {
  CharacterCreationMode,
  CHARACTER_NAME_MAX_LENGTH,
  validateCharacterName,
  type CharacterCreationMode as CharacterCreationModeType,
} from "../profile/character-creation-rules";
import type { PlayerStats } from "../data/catalog";
import {
  THROWING_STAR_CATALOG,
  THROWING_STAR_SHOP_TIERS,
  THROWING_STAR_TIERS,
  type PurchasableThrowingStarTier,
  type ThrowingStarTier,
} from "../equipment/throwing-star-rules";
import {
  isUsableInventoryItemId,
  type UsableInventoryItemId,
} from "../inventory/inventory-item-rules";
import { RECOVERY_RULES, STAT_LABELS } from "../progression/progression-rules";
import {
  EXPERIENCE_BOOK_LEVEL_GAIN,
  MAX_CHARACTER_LEVEL,
  SHOP_ITEM_CATALOG,
  ShopItemId,
} from "../shop/shop-rules";
import type { JobAdvancementQuestState } from "../quests/job-advancement-quests";
import {
  DUNGEON_BOSS_QUEST,
  DungeonBossQuestStage,
  dungeonBossQuestRecommendedLevelText,
  type DungeonBossQuestProgress,
} from "../quests/dungeon-boss-quest";
import {
  ENDING_CREDITS,
  ENDING_CREDITS_DEVELOPER,
  ENDING_CREDITS_DURATION_MS,
} from "../ending/ending-credits-rules";
import { endingCreditsBackgroundUrl } from "../assets/ui-assets";
import {
  SKILL_DEFINITIONS,
  SKILL_ORDER,
  ACTIVE_SKILL_ORDER,
  EXTRA_SKILL_HOTKEYS,
  SkillId,
  NINE_TAILS_TRANSFORMATION_MP_COST,
  assignSkillHotkeyAlias,
  isActiveSkillId,
  isSkillUnlocked,
  skillHotkeyAssignments,
  skillHotkeyFor,
  skillHotkeysFor,
  swapSkillHotkeyAliases,
  swapSkillHotbarSlots,
  type ActiveSkillId,
  type ExtraSkillHotkey,
  type SkillHotkey,
  type SkillHotkeyAliases,
  type SkillId as SkillIdType,
} from "../skills/skill-rules";
import { createAudioSettingsControls } from "./audio-settings-controls";

export interface OverlayHandle {
  destroy(): void;
}

export type EndingCreditsCloseReason = "automatic" | "continue";

export interface SkillHotkeyOverlayHandle extends OverlayHandle {
  update(profile: LocalProfile): void;
}

function overlayRoot(): HTMLElement {
  const root = document.querySelector<HTMLElement>("#screen-overlay");
  if (!root) {
    throw new Error("Missing #screen-overlay element.");
  }
  return root;
}

function replaceOverlay(content: HTMLElement): OverlayHandle {
  const root = overlayRoot();
  const game = document.querySelector<HTMLElement>("#game");
  root.replaceChildren(content);
  root.hidden = false;
  if (game) game.inert = true;

  return {
    destroy(): void {
      if (root.contains(content)) {
        root.replaceChildren();
        root.hidden = true;
        if (game) game.inert = false;
      }
    },
  };
}

function textElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string,
  className?: string,
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = text;
  if (className) {
    element.className = className;
  }
  return element;
}

export function showEndingCreditsOverlay(
  onClose: (reason: EndingCreditsCloseReason) => void,
): OverlayHandle {
  const panel = document.createElement("section");
  panel.className = "ending-credits";
  panel.dataset.testid = "ending-credits";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "ending-credits-title");
  panel.style.backgroundImage = `linear-gradient(rgb(3 7 20 / 8%), rgb(3 7 20 / 24%)), url("${endingCreditsBackgroundUrl}")`;

  const viewport = document.createElement("div");
  viewport.className = "ending-credits-viewport";
  const roll = document.createElement("div");
  roll.className = "ending-credits-roll";
  roll.style.setProperty(
    "--ending-credits-duration",
    `${ENDING_CREDITS_DURATION_MS}ms`,
  );
  roll.append(
    textElement("p", ENDING_CREDITS.eyebrow, "ending-credits-eyebrow"),
  );
  const title = textElement("h2", ENDING_CREDITS.title);
  title.id = "ending-credits-title";
  roll.append(
    title,
    textElement("p", ENDING_CREDITS.subtitle, "ending-credits-subtitle"),
  );

  const creditsList = document.createElement("dl");
  creditsList.className = "ending-credits-list";
  for (const role of ENDING_CREDITS.roles) {
    creditsList.append(
      textElement("dt", role),
      textElement("dd", ENDING_CREDITS_DEVELOPER),
    );
  }
  creditsList.append(
    textElement("dt", ENDING_CREDITS.reference.role),
    textElement("dd", ENDING_CREDITS.reference.credit),
  );
  roll.append(
    creditsList,
    textElement("p", ENDING_CREDITS.thanks, "ending-credits-thanks"),
  );
  viewport.append(roll);

  const continueButton = textElement(
    "button",
    "크레딧 닫고 계속 플레이",
    "ending-credits-continue",
  );
  continueButton.type = "button";
  continueButton.dataset.testid = "ending-credits-continue";
  continueButton.addEventListener("click", () => onClose("continue"));
  panel.append(viewport, continueButton);

  const overlay = replaceOverlay(panel);
  const automaticCloseTimer = window.setTimeout(
    () => onClose("automatic"),
    ENDING_CREDITS_DURATION_MS,
  );
  queueMicrotask(() => continueButton.focus());

  return {
    destroy(): void {
      window.clearTimeout(automaticCloseTimer);
      overlay.destroy();
    },
  };
}

function templateElement<T extends HTMLElement>(id: string): T {
  const template = document.querySelector<HTMLTemplateElement>(`#${id}`);
  const element = template?.content.firstElementChild?.cloneNode(true);
  if (!(element instanceof HTMLElement)) {
    throw new Error(`Missing template: ${id}`);
  }
  return element as T;
}

interface GameMenuActions {
  openSettings(): void;
  openStats(): void;
  openSkills(): void;
  openInventory(): void;
  openSkillHotkeys(): void;
  close(): void;
}

export function showGameMenuOverlay(
  profile: LocalProfile,
  actions: GameMenuActions,
): OverlayHandle {
  const panel = templateElement<HTMLElement>("game-menu-template");
  if (document.documentElement.dataset.inputMode === "touch") {
    panel.querySelector<HTMLElement>(
      '[data-testid="menu-skill-hotkeys"] span',
    )!.textContent = "현재 차수 주 스킬 4슬롯 배치";
  }
  panel.querySelector<HTMLElement>(".game-menu-summary")!.textContent =
    `LV. ${profile.character.level} ${playerJobLabel(profile.character.job)} · ${profile.character.name}`;
  for (const [testId, onClick] of [
    ["game-menu-close", actions.close],
    ["menu-inventory", actions.openInventory],
    ["menu-stats", actions.openStats],
    ["menu-skills", actions.openSkills],
    ["menu-skill-hotkeys", actions.openSkillHotkeys],
    ["menu-settings", actions.openSettings],
  ] as const) {
    panel
      .querySelector(`[data-testid="${testId}"]`)!
      .addEventListener("click", onClick);
  }

  const overlay = replaceOverlay(panel);
  queueMicrotask(() =>
    panel
      .querySelector<HTMLButtonElement>('[data-testid="menu-inventory"]')
      ?.focus(),
  );
  return overlay;
}

export function showSettingsOverlay(onClose: () => void): OverlayHandle {
  const panel = templateElement<HTMLElement>("settings-dialog-template");
  panel
    .querySelector("[data-audio-settings-slot]")!
    .replaceWith(createAudioSettingsControls());
  panel
    .querySelector('[data-testid="settings-close"]')!
    .addEventListener("click", onClose);

  const overlay = replaceOverlay(panel);
  queueMicrotask(() =>
    panel
      .querySelector<HTMLButtonElement>('[data-testid="audio-mute-toggle"]')
      ?.focus(),
  );
  return overlay;
}

export function showLoginOverlay(onLogin: () => void): OverlayHandle {
  const panel = document.createElement("section");
  panel.className = "screen-panel login-panel ui-panel ui-panel--book";
  panel.dataset.testid = "login-screen";

  panel.append(
    textElement("p", "KERNING SHADOWS", "eyebrow"),
    textElement("h1", "모험가 로그인"),
    textElement(
      "p",
      "아무 아이디와 비밀번호를 입력해도 같은 로컬 프로필로 접속합니다.",
      "screen-copy",
    ),
  );

  const form = document.createElement("form");
  form.className = "login-form";
  form.dataset.testid = "login-form";

  const idLabel = textElement("label", "아이디");
  const idInput = document.createElement("input");
  idInput.name = "accountId";
  idInput.autocomplete = "username";
  idInput.required = true;
  idInput.dataset.testid = "account-id";
  idLabel.append(idInput);

  const passwordLabel = textElement("label", "비밀번호");
  const passwordInput = document.createElement("input");
  passwordInput.name = "password";
  passwordInput.type = "password";
  passwordInput.autocomplete = "current-password";
  passwordInput.required = true;
  passwordInput.dataset.testid = "password";
  passwordLabel.append(passwordInput);

  const submit = textElement("button", "로그인");
  submit.type = "submit";
  submit.dataset.testid = "login-submit";

  form.append(idLabel, passwordLabel, submit);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (form.reportValidity()) {
      onLogin();
    }
  });
  panel.append(form);

  const handle = replaceOverlay(panel);
  queueMicrotask(() => idInput.focus());
  return handle;
}

export function showCharacterSelectOverlay(
  profiles: readonly (PlayerProfile | null)[],
  initialSlot: CharacterSlot,
  onSelect: (slot: CharacterSlot) => void,
  onCreate: (slot: CharacterSlot) => void,
  onStart: (slot: CharacterSlot) => void,
  onBack: () => void,
): OverlayHandle {
  let selectedSlot = initialSlot;
  const occupiedCount = profiles.filter((profile) => profile !== null).length;
  const panel = document.createElement("section");
  panel.className = "screen-panel character-panel ui-panel ui-panel--wood";
  panel.dataset.testid = "character-select-screen";
  panel.append(
    textElement("p", "CHARACTER SELECT", "eyebrow"),
    textElement("h1", "캐릭터 선택"),
    textElement(
      "p",
      `${occupiedCount} / ${CHARACTER_SLOT_COUNT} 캐릭터 · 빈 슬롯에서 새 캐릭터를 만들 수 있습니다.`,
      "screen-copy",
    ),
  );

  const slots = document.createElement("div");
  slots.className = "character-slots";

  const stats = document.createElement("dl");
  stats.className = "character-stats";
  stats.dataset.testid = "selected-character-stats";

  const renderStats = (profile: PlayerProfile): void => {
    stats.replaceChildren(
      textElement("dt", "HP / MP"),
      textElement(
        "dd",
        `${profile.hp} / ${profile.maxHp} · ${profile.mp} / ${profile.maxMp}`,
      ),
      textElement("dt", "메소"),
      textElement("dd", profile.mesos.toLocaleString("ko-KR")),
      textElement("dt", "LUK / DEX"),
      textElement("dd", `${profile.stats.luk} / ${profile.stats.dex}`),
      textElement("dt", "남은 AP / SP"),
      textElement("dd", `${profile.statPoints} / ${profile.skillPoints}`),
    );
  };

  const cards = new Map<CharacterSlot, HTMLButtonElement>();
  for (const slot of CHARACTER_SLOTS) {
    const profile = profiles[slot - 1] ?? null;
    const card = document.createElement("button");
    card.type = "button";
    card.dataset.testid = `character-slot-${slot}`;
    cards.set(slot, card);

    if (!profile) {
      card.className = "character-slot-empty";
      card.setAttribute("aria-label", `빈 캐릭터 슬롯 ${slot}, 새 캐릭터 생성`);
      card.append(
        textElement("span", `슬롯 ${slot}`, "character-slot-number"),
        textElement("strong", "+ 새 캐릭터 생성"),
      );
      card.addEventListener("click", () => onCreate(slot));
      slots.append(card);
      continue;
    }

    const jobLabel = playerJobLabel(profile.job);
    card.className = "character-card";
    card.append(
      textElement("span", `LV. ${profile.level}`, "level-badge"),
      textElement("strong", profile.name),
      textElement("span", `${jobLabel} · 슬롯 ${slot}`),
    );
    card.addEventListener("click", () => {
      selectedSlot = slot;
      onSelect(slot);
      for (const [candidateSlot, candidateCard] of cards) {
        const candidateProfile = profiles[candidateSlot - 1];
        const selected =
          candidateSlot === selectedSlot && candidateProfile !== null;
        candidateCard.classList.toggle("selected", selected);
        if (candidateProfile) {
          candidateCard.setAttribute(
            "aria-label",
            `${candidateProfile.name}, 레벨 ${candidateProfile.level}, ${playerJobLabel(candidateProfile.job)}, ${selected ? "선택됨" : "선택 가능"}`,
          );
        }
      }
      renderStats(profile);
    });
    slots.append(card);
  }

  const initialProfile = profiles[selectedSlot - 1];
  if (!initialProfile) {
    throw new Error(`Initial character slot ${selectedSlot} is empty.`);
  }
  cards.get(selectedSlot)?.classList.add("selected");
  for (const [slot, card] of cards) {
    const profile = profiles[slot - 1];
    if (profile) {
      card.setAttribute(
        "aria-label",
        `${profile.name}, 레벨 ${profile.level}, ${playerJobLabel(profile.job)}, ${slot === selectedSlot ? "선택됨" : "선택 가능"}`,
      );
    }
  }
  renderStats(initialProfile);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const back = textElement("button", "뒤로");
  back.type = "button";
  back.className = "secondary";
  back.addEventListener("click", onBack);
  const start = textElement("button", "게임 시작");
  start.type = "button";
  start.dataset.testid = "start-game";
  start.addEventListener("click", () => onStart(selectedSlot));
  actions.append(back, start);

  panel.append(slots, stats, actions);
  return replaceOverlay(panel);
}

export function showCharacterCreateOverlay(
  slot: CharacterSlot,
  initialStats: PlayerStats,
  onRoll: () => PlayerStats,
  onNamePreview: (name: string) => void,
  onModePreview: (mode: CharacterCreationModeType) => void,
  onCreate: (
    name: string,
    stats: PlayerStats,
    mode: CharacterCreationModeType,
  ) => void,
  onBack: () => void,
  isFirstCharacter = false,
): OverlayHandle {
  let stats = { ...initialStats };
  let pendingStats: PlayerStats | undefined;
  let nameValid = false;
  let creationMode: CharacterCreationModeType = CharacterCreationMode.Standard;
  const panel = document.createElement("section");
  panel.className =
    "screen-panel character-create-panel ui-panel ui-panel--wood";
  panel.dataset.testid = "character-create-screen";
  panel.setAttribute("aria-labelledby", "character-create-title");
  panel.append(textElement("p", "CHARACTER CREATE", "eyebrow"));
  const title = textElement("h1", "신규 캐릭터 생성");
  title.id = "character-create-title";
  panel.append(
    title,
    textElement(
      "p",
      isFirstCharacter
        ? `저장된 캐릭터가 없습니다. 슬롯 ${slot}에 첫 캐릭터를 생성해 모험을 시작하세요.`
        : `슬롯 ${slot} · 닉네임과 주사위 능력치를 정한 뒤 모험을 시작하세요.`,
      "screen-copy",
    ),
  );

  const form = document.createElement("form");
  form.className = "character-create-form";
  const nameLabel = textElement("label", "캐릭터 닉네임");
  const nameInput = document.createElement("input");
  nameInput.name = "characterName";
  nameInput.autocomplete = "off";
  nameInput.maxLength = CHARACTER_NAME_MAX_LENGTH;
  nameInput.placeholder = "2~12자 한글·영문·숫자";
  nameInput.dataset.testid = "character-name";
  nameLabel.append(nameInput);

  const nameStatus = textElement(
    "p",
    "닉네임을 입력하세요.",
    "character-name-status",
  );
  nameStatus.dataset.testid = "character-name-status";
  nameStatus.setAttribute("role", "status");
  nameStatus.setAttribute("aria-live", "polite");

  const boostOption = textElement(
    "button",
    "Lv.120 호카게 부스트",
    "creation-boost-option secondary",
  );
  boostOption.type = "button";
  boostOption.dataset.testid = "boost-character-toggle";
  boostOption.setAttribute("aria-pressed", "false");
  const boostHint = textElement(
    "p",
    "선택하면 Lv.120 호카게, 자동분배 능력치와 최대 레벨 스킬로 시작합니다.",
    "creation-boost-hint",
  );

  const statHeader = document.createElement("div");
  statHeader.className = "creation-stat-header";
  statHeader.append(textElement("strong", "기본 능력치"));
  const roll = textElement("button", "🎲 주사위 굴리기");
  roll.type = "button";
  roll.className = "secondary";
  roll.dataset.testid = "roll-stats";
  const diceEffect = textElement("span", "🎲", "creation-dice-effect");
  diceEffect.dataset.testid = "dice-roll-effect";
  diceEffect.setAttribute("aria-hidden", "true");
  statHeader.append(roll, diceEffect);

  const statList = document.createElement("dl");
  statList.className = "creation-stats";
  const statValues = new Map<keyof PlayerStats, HTMLElement>();
  for (const [key, label] of [
    ["str", "STR"],
    ["dex", "DEX"],
    ["int", "INT"],
    ["luk", "LUK"],
  ] as const) {
    statList.append(textElement("dt", label));
    const value = textElement("dd", String(stats[key]));
    value.dataset.testid = `creation-stat-${key}`;
    statValues.set(key, value);
    statList.append(value);
  }
  const statHint = textElement(
    "p",
    "각 능력치는 4~13, 네 능력치의 합은 25입니다.",
    "creation-stat-hint",
  );
  statHint.setAttribute("aria-live", "polite");

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const back = textElement("button", "취소");
  back.type = "button";
  back.className = "secondary";
  back.addEventListener("click", onBack);
  const create = textElement("button", "캐릭터 생성");
  create.type = "submit";
  create.disabled = true;
  create.dataset.testid = "create-character";
  actions.append(back, create);

  const updateName = (): void => {
    const validation = validateCharacterName(nameInput.value);
    nameValid = validation.valid;
    nameStatus.textContent = validation.message;
    nameStatus.classList.toggle("valid", validation.valid);
    create.disabled = !validation.valid || pendingStats !== undefined;
    nameInput.setAttribute("aria-invalid", String(!validation.valid));
    onNamePreview(validation.name);
  };
  const settleDiceRoll = (): void => {
    if (!pendingStats) return;
    stats = pendingStats;
    pendingStats = undefined;
    for (const [key, value] of statValues)
      value.textContent = String(stats[key]);
    diceEffect.classList.remove("rolling");
    statList.classList.remove("rolling");
    statList.removeAttribute("aria-busy");
    roll.disabled = false;
    roll.textContent = "🎲 주사위 굴리기";
    create.disabled = !nameValid;
    statHint.textContent =
      "새 능력치가 결정되었습니다. 각 4~13, 합계 25입니다.";
  };
  diceEffect.addEventListener("animationend", settleDiceRoll);
  nameInput.addEventListener("input", updateName);
  boostOption.addEventListener("click", () => {
    creationMode =
      creationMode === CharacterCreationMode.Standard
        ? CharacterCreationMode.Boost
        : CharacterCreationMode.Standard;
    const boosted = creationMode === CharacterCreationMode.Boost;
    boostOption.setAttribute("aria-pressed", String(boosted));
    boostOption.classList.toggle("selected", boosted);
    boostOption.textContent = boosted
      ? "✓ Lv.120 호카게 부스트"
      : "Lv.120 호카게 부스트";
    create.textContent = boosted ? "부스트 캐릭터 생성" : "캐릭터 생성";
    onModePreview(creationMode);
  });
  roll.addEventListener("click", () => {
    pendingStats = { ...onRoll() };
    roll.disabled = true;
    roll.textContent = "주사위 굴리는 중…";
    create.disabled = true;
    statList.classList.add("rolling");
    statList.setAttribute("aria-busy", "true");
    statHint.textContent = "주사위가 굴러가는 중입니다.";
    diceEffect.classList.remove("rolling");
    void diceEffect.offsetWidth;
    diceEffect.classList.add("rolling");
  });
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const validation = validateCharacterName(nameInput.value);
    if (!validation.valid || pendingStats) {
      updateName();
      if (!validation.valid) nameInput.focus();
      return;
    }
    onCreate(validation.name, { ...stats }, creationMode);
  });

  form.append(
    nameLabel,
    nameStatus,
    boostOption,
    boostHint,
    statHeader,
    statList,
    statHint,
    actions,
  );
  panel.append(form);
  const handle = replaceOverlay(panel);
  queueMicrotask(() => nameInput.focus());
  return handle;
}

export function showJobAdvancementOverlay(
  state: JobAdvancementQuestState,
  onAccept: () => void,
  onAdvance: () => void,
  onClose: () => void,
): OverlayHandle {
  const panel = document.createElement("section");
  panel.className = "game-dialog job-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "job-advancement-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "job-dialog-title");

  panel.append(textElement("p", "SHADOW GUILD", "eyebrow"));
  const title = textElement("h2", "다크로드");
  title.id = "job-dialog-title";
  panel.append(title);

  const message = advancementMessage(state);
  panel.append(textElement("p", message, "dialog-copy"));

  if (state.status !== "maximum-rank") {
    const recommendedLevel = textElement(
      "strong",
      `필수 레벨 · Lv.${state.quest.advancement.requiredLevel}`,
      "quest-recommended-level",
    );
    recommendedLevel.dataset.testid = "job-quest-recommended-level";
    panel.append(recommendedLevel);
  }

  if (state.status === "active" || state.status === "ready-to-advance") {
    const status = textElement(
      "p",
      `${state.quest.title} · ${state.quest.destination}`,
      "stats-recommendation",
    );
    status.dataset.testid = "job-quest-status";
    const progress = document.createElement("progress");
    progress.max = state.quest.requiredDefeats;
    progress.value = state.defeated;
    progress.dataset.testid = "job-quest-progress";
    progress.setAttribute(
      "aria-label",
      `${state.quest.targetLabel} ${state.defeated}/${state.quest.requiredDefeats}`,
    );
    panel.append(status, progress);
  }

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement(
    "button",
    state.status === "offer" || state.status === "ready-to-advance"
      ? "아직은…"
      : "확인",
  );
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "job-dialog-close";
  close.addEventListener("click", onClose);
  actions.append(close);

  if (state.status === "offer") {
    const accept = textElement("button", "시험 시작");
    accept.type = "button";
    accept.dataset.testid = "job-quest-accept";
    accept.addEventListener("click", onAccept);
    actions.append(accept);
  }

  if (state.status === "ready-to-advance") {
    const advance = textElement(
      "button",
      `${playerJobLabel(state.quest.advancement.to)}로 전직`,
    );
    advance.type = "button";
    advance.dataset.testid = "job-advance-confirm";
    advance.addEventListener("click", onAdvance);
    actions.append(advance);
  }

  panel.append(actions);
  const handle = replaceOverlay(panel);
  queueMicrotask(() =>
    panel.querySelector<HTMLButtonElement>("button")?.focus(),
  );
  return handle;
}

function advancementMessage(state: JobAdvancementQuestState): string {
  if (state.status === "maximum-rank") {
    return "호카게의 경지에 도달했군. 차크라와 그림자를 모두 다루는 수호자가 되었네.";
  }

  const target = playerJobLabel(state.quest.advancement.to);
  const skills = state.quest.advancement.unlockedSkills
    .map((skillId) => SKILL_DEFINITIONS[skillId].label)
    .join(" · ");
  if (state.status === "offer") {
    return `${target}의 길은 말이 아니라 실력으로 증명해야 하네. ${state.quest.destination}에서 ${state.quest.targetLabel} ${state.quest.requiredDefeats}마리를 쓰러뜨리게.`;
  }
  if (state.status === "active") {
    return `${state.quest.targetLabel} ${state.defeated}/${state.quest.requiredDefeats}. 시험을 마치고 다시 보고하게.`;
  }
  if (state.status === "ready-to-advance") {
    return `시험을 훌륭히 마쳤군. ${target}로 전직하면 ${skills}을 사용할 수 있네.`;
  }
  return `${target} 전직에는 레벨 ${state.quest.advancement.requiredLevel}이 필요하다. 조금 더 성장한 뒤 돌아오게.`;
}

export function showDungeonBossQuestOverlay(
  progress: DungeonBossQuestProgress,
  onAccept: () => void,
  onClaim: () => void,
  onClose: () => void,
): OverlayHandle {
  const panel = document.createElement("section");
  panel.className = "game-dialog dungeon-quest-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "dungeon-boss-quest-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "dungeon-quest-dialog-title");

  panel.append(textElement("p", "DUNGEON EXPEDITION", "eyebrow"));
  const title = textElement("h2", "원정대장 세라");
  title.id = "dungeon-quest-dialog-title";
  const stage = textElement(
    "strong",
    dungeonBossQuestStageLabel(progress.stage),
    "dungeon-quest-stage",
  );
  stage.dataset.testid = "dungeon-boss-quest-stage";
  const recommendedLevel = textElement(
    "strong",
    `적정 레벨 · ${dungeonBossQuestRecommendedLevelText()}`,
    "quest-recommended-level",
  );
  recommendedLevel.dataset.testid = "dungeon-boss-quest-recommended-level";
  panel.append(
    title,
    textElement("p", dungeonBossQuestMessage(progress.stage), "dialog-copy"),
    recommendedLevel,
    stage,
  );

  const route = document.createElement("ol");
  route.className = "dungeon-quest-route";
  for (const [objectiveStage, label] of [
    [
      DungeonBossQuestStage.MidBoss,
      `${DUNGEON_BOSS_QUEST.midBoss.destination} · 적정 Lv.${DUNGEON_BOSS_QUEST.midBoss.recommendedLevel} · ${DUNGEON_BOSS_QUEST.midBoss.name}`,
    ],
    [
      DungeonBossQuestStage.UpperBoss,
      `${DUNGEON_BOSS_QUEST.upperBoss.destination} · 적정 Lv.${DUNGEON_BOSS_QUEST.upperBoss.recommendedLevel} · ${DUNGEON_BOSS_QUEST.upperBoss.name}`,
    ],
    [
      DungeonBossQuestStage.FinalBoss,
      `${DUNGEON_BOSS_QUEST.finalBoss.destination} · 적정 Lv.${DUNGEON_BOSS_QUEST.finalBoss.recommendedLevel} · ${DUNGEON_BOSS_QUEST.finalBoss.name}`,
    ],
    [DungeonBossQuestStage.TurnIn, "커닝시티 · 원정대장 세라에게 보고"],
  ] as const) {
    const item = textElement("li", label);
    item.classList.toggle("current", progress.stage === objectiveStage);
    item.classList.toggle(
      "complete",
      dungeonBossQuestStageIndex(progress.stage) >
        dungeonBossQuestStageIndex(objectiveStage),
    );
    route.append(item);
  }
  panel.append(route);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement("button", "대화 닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "dungeon-boss-quest-close";
  close.addEventListener("click", onClose);
  actions.append(close);
  if (progress.stage === DungeonBossQuestStage.Offer) {
    const accept = textElement("button", "원정 시작");
    accept.type = "button";
    accept.dataset.testid = "dungeon-boss-quest-accept";
    accept.addEventListener("click", onAccept);
    actions.append(accept);
  } else if (progress.stage === DungeonBossQuestStage.TurnIn) {
    const claim = textElement("button", "완료 보고");
    claim.type = "button";
    claim.dataset.testid = "dungeon-boss-quest-claim";
    claim.addEventListener("click", onClaim);
    actions.append(claim);
  }
  panel.append(actions);

  const handle = replaceOverlay(panel);
  queueMicrotask(() =>
    panel.querySelector<HTMLButtonElement>("button")?.focus(),
  );
  return handle;
}

function dungeonBossQuestStageIndex(
  stage: DungeonBossQuestProgress["stage"],
): number {
  return Object.values(DungeonBossQuestStage).indexOf(stage);
}

function dungeonBossQuestStageLabel(
  stage: DungeonBossQuestProgress["stage"],
): string {
  switch (stage) {
    case DungeonBossQuestStage.Offer:
      return "새 원정 의뢰";
    case DungeonBossQuestStage.MidBoss:
      return "1단계 · 중간보스 추적 중";
    case DungeonBossQuestStage.UpperBoss:
      return "2단계 · 상위보스 추적 중";
    case DungeonBossQuestStage.FinalBoss:
      return "3단계 · 최종보스 추적 중";
    case DungeonBossQuestStage.TurnIn:
      return "모든 목표 완료 · 보고 가능";
    case DungeonBossQuestStage.Complete:
      return "원정 완료";
  }
}

function dungeonBossQuestMessage(
  stage: DungeonBossQuestProgress["stage"],
): string {
  switch (stage) {
    case DungeonBossQuestStage.Offer:
      return `여섯 던전을 잇는 회랑에서 세 강자가 깨어났어요. ${DUNGEON_BOSS_QUEST.midBoss.name}, ${DUNGEON_BOSS_QUEST.upperBoss.name}, ${DUNGEON_BOSS_QUEST.finalBoss.name}를 차례로 조사해 주세요.`;
    case DungeonBossQuestStage.MidBoss:
      return `${DUNGEON_BOSS_QUEST.midBoss.destination}에서 ${DUNGEON_BOSS_QUEST.midBoss.name}를 먼저 쓰러뜨려야 다음 흔적을 찾을 수 있어요.`;
    case DungeonBossQuestStage.UpperBoss:
      return `잿불 봉인이 풀렸어요. 이제 ${DUNGEON_BOSS_QUEST.upperBoss.destination}의 ${DUNGEON_BOSS_QUEST.upperBoss.name}를 처치하세요.`;
    case DungeonBossQuestStage.FinalBoss:
      return `월식 봉인이 무너졌어요. 마지막으로 ${DUNGEON_BOSS_QUEST.finalBoss.destination}의 ${DUNGEON_BOSS_QUEST.finalBoss.name}에게 도전하세요. 한 대라도 맞으면 쓰러집니다.`;
    case DungeonBossQuestStage.TurnIn:
      return `세 보스의 반응이 모두 멈췄어요. 보상으로 ${DUNGEON_BOSS_QUEST.reward.mesos.toLocaleString("ko-KR")} 메소와 경험의 서 ${DUNGEON_BOSS_QUEST.reward.experienceBooks}권을 드릴게요.`;
    case DungeonBossQuestStage.Complete:
      return "원정 기록을 길드에 전달했어요. 세 보스는 다시 출현하지만 의뢰 보상은 한 번만 지급됩니다.";
  }
}

export function showDeveloperPromoOverlay(
  onSubscribe: () => void,
  onClose: () => void,
): OverlayHandle {
  const panel = document.createElement("section");
  panel.className = "game-dialog developer-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "developer-promo-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "developer-dialog-title");

  panel.append(textElement("p", "GAME DEVELOPER", "eyebrow"));
  const title = textElement("h2", NPC_CATALOG.gameDeveloper.name);
  title.id = "developer-dialog-title";
  panel.append(
    title,
    textElement(
      "p",
      "반가워요. 이 게임을 만들고 고치는 일용직 개발자 임상진입니다.",
      "dialog-copy",
    ),
    textElement(
      "p",
      "제 유튜브 채널도 놀러 와 주세요. ‘구독하기’를 눌러주시면 이 게임을 계속 만드는 데 큰 힘이 됩니다.",
      "dialog-copy developer-channel-copy",
    ),
  );

  const thanks = textElement(
    "p",
    "채널을 찾아와 주셔서 감사합니다. 구독해 주시면 큰 힘이 됩니다!",
    "developer-thanks",
  );
  thanks.dataset.testid = "developer-subscribe-thanks";
  thanks.setAttribute("role", "status");
  thanks.hidden = true;
  panel.append(thanks);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement("button", "대화 닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "developer-dialog-close";
  close.addEventListener("click", onClose);

  const subscribe = textElement("a", "구독하기");
  subscribe.className = "developer-subscribe-link";
  subscribe.href = NPC_CATALOG.gameDeveloper.channelUrl;
  subscribe.target = "_blank";
  subscribe.rel = "noopener noreferrer";
  subscribe.dataset.testid = "developer-subscribe-link";
  subscribe.setAttribute(
    "aria-label",
    `${NPC_CATALOG.gameDeveloper.name} 유튜브 채널에서 구독하기, 새 탭에서 열림`,
  );
  subscribe.addEventListener("click", () => {
    thanks.hidden = false;
    onSubscribe();
  });
  actions.append(close, subscribe);
  panel.append(actions);

  const handle = replaceOverlay(panel);
  queueMicrotask(() => subscribe.focus());
  return handle;
}

export function showDuaAdoptionOverlay(
  profile: LocalProfile,
  onGivePuppuccino: () => void,
  onClose: () => void,
): OverlayHandle {
  const item = SHOP_ITEM_CATALOG[ShopItemId.Puppuccino];
  const owned = profile.inventory[item.inventoryItemId] ?? 0;
  const panel = document.createElement("section");
  panel.className = "game-dialog dua-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "dua-adoption-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "dua-dialog-title");

  panel.append(textElement("p", "LONELY CORGI", "eyebrow"));
  const title = textElement("h2", NPC_CATALOG.dua.name);
  title.id = "dua-dialog-title";
  const copy = textElement(
    "p",
    owned > 0
      ? "두아가 멍푸치노 향을 맡고 귀를 쫑긋 세웠습니다. 선물하면 모험을 함께하며 떨어진 아이템을 대신 주워줍니다."
      : "두아가 커닝시티 한편에 혼자 앉아 있습니다. 서적상 레오에게 멍푸치노를 사서 선물해 보세요.",
    "dialog-copy",
  );
  const status = textElement(
    "strong",
    `멍푸치노 보유 ${owned}개`,
    "dua-adoption-status",
  );
  status.dataset.testid = "dua-puppuccino-owned";
  panel.append(title, copy, status);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement("button", "대화 닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "dua-dialog-close";
  close.addEventListener("click", onClose);
  const give = textElement("button", "멍푸치노 주기");
  give.type = "button";
  give.dataset.testid = "give-puppuccino-to-dua";
  give.disabled = owned <= 0;
  give.addEventListener("click", onGivePuppuccino);
  actions.append(close, give);
  panel.append(actions);

  const handle = replaceOverlay(panel);
  queueMicrotask(() => (give.disabled ? close : give).focus());
  return handle;
}

export interface StatsOverlayHandle extends OverlayHandle {
  update(profile: LocalProfile): void;
}

export interface SkillOverlayHandle extends OverlayHandle {
  update(profile: LocalProfile): void;
}

export interface ShopOverlayHandle extends OverlayHandle {
  update(profile: LocalProfile): void;
}

export interface InventoryOverlayHandle extends OverlayHandle {
  update(profile: LocalProfile): void;
}

export function showShopOverlay(
  profile: LocalProfile,
  onPurchase: () => void,
  onUse: () => void,
  onPurchasePuppuccino: () => void,
  onPurchaseRevivalCharm: () => void,
  onPurchaseThrowingStar: (tier: PurchasableThrowingStarTier) => void,
  onClose: () => void,
): ShopOverlayHandle {
  const item = SHOP_ITEM_CATALOG[ShopItemId.ExperienceBook];
  const puppuccino = SHOP_ITEM_CATALOG[ShopItemId.Puppuccino];
  const revivalCharm = SHOP_ITEM_CATALOG[ShopItemId.RevivalCharm];
  const panel = document.createElement("section");
  panel.className = "shop-dialog ui-panel ui-panel--wood";
  panel.dataset.testid = "shop-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "shop-dialog-title");

  panel.append(textElement("p", "BOOK MERCHANT", "eyebrow"));
  const title = textElement("h2", "서적상 레오");
  title.id = "shop-dialog-title";
  panel.append(
    title,
    textElement(
      "p",
      `성장 도구와 표창, 멍푸치노, 사망 시 한 번 즉시 되살리는 부활의 부적을 판매합니다. 경험의 서는 현재 EXP를 유지하며 최대 ${EXPERIENCE_BOOK_LEVEL_GAIN}레벨 성장합니다.`,
      "dialog-copy",
    ),
  );

  const wallet = textElement("strong", "", "shop-wallet");
  wallet.dataset.testid = "shop-wallet";
  const row = document.createElement("article");
  row.className = "shop-item-row";
  const bookMark = document.createElement("span");
  bookMark.className = "shop-book-mark";
  bookMark.setAttribute("aria-hidden", "true");
  const copy = document.createElement("div");
  copy.className = "shop-item-copy";
  copy.append(
    textElement("strong", item.name),
    textElement(
      "span",
      `가격 ${item.price} 메소 · 최대 레벨 ${MAX_CHARACTER_LEVEL}`,
    ),
  );
  const owned = document.createElement("output");
  owned.className = "shop-owned";
  owned.dataset.testid = "experience-book-owned";
  copy.append(owned);

  const buttons = document.createElement("div");
  buttons.className = "shop-item-actions";
  const purchase = textElement("button", "구매");
  purchase.type = "button";
  purchase.dataset.testid = "purchase-experience-book";
  purchase.addEventListener("click", onPurchase);
  const use = textElement("button", "사용");
  use.type = "button";
  use.dataset.testid = "use-experience-book";
  use.addEventListener("click", onUse);
  buttons.append(purchase, use);
  row.append(bookMark, copy, buttons);

  const puppuccinoRow = document.createElement("article");
  puppuccinoRow.className = "shop-item-row puppuccino-row";
  const puppuccinoMark = document.createElement("span");
  puppuccinoMark.className = "shop-puppuccino-mark";
  puppuccinoMark.setAttribute("aria-hidden", "true");
  const puppuccinoCopy = document.createElement("div");
  puppuccinoCopy.className = "shop-item-copy";
  puppuccinoCopy.append(
    textElement("strong", puppuccino.name),
    textElement(
      "span",
      `가격 ${puppuccino.price.toLocaleString("ko-KR")} 메소 · 두아에게 주는 선물`,
    ),
  );
  const puppuccinoOwned = document.createElement("output");
  puppuccinoOwned.className = "shop-owned";
  puppuccinoOwned.dataset.testid = "puppuccino-owned";
  puppuccinoCopy.append(puppuccinoOwned);
  const purchasePuppuccino = textElement("button", "구매");
  purchasePuppuccino.type = "button";
  purchasePuppuccino.dataset.testid = "purchase-puppuccino";
  purchasePuppuccino.addEventListener("click", onPurchasePuppuccino);
  puppuccinoRow.append(puppuccinoMark, puppuccinoCopy, purchasePuppuccino);

  const revivalCharmRow = document.createElement("article");
  revivalCharmRow.className = "shop-item-row revival-charm-row";
  const revivalCharmMark = document.createElement("span");
  revivalCharmMark.className = "shop-revival-charm-mark";
  revivalCharmMark.setAttribute("aria-hidden", "true");
  const revivalCharmCopy = document.createElement("div");
  revivalCharmCopy.className = "shop-item-copy";
  revivalCharmCopy.append(
    textElement("strong", revivalCharm.name),
    textElement(
      "span",
      `가격 ${revivalCharm.price.toLocaleString("ko-KR")} 메소 · 최대 1개 · 사망 시 자동 사용`,
    ),
  );
  const revivalCharmOwned = document.createElement("output");
  revivalCharmOwned.className = "shop-owned";
  revivalCharmOwned.dataset.testid = "revival-charm-owned";
  revivalCharmCopy.append(revivalCharmOwned);
  const purchaseRevivalCharm = textElement("button", "구매");
  purchaseRevivalCharm.type = "button";
  purchaseRevivalCharm.dataset.testid = "purchase-revival-charm";
  purchaseRevivalCharm.addEventListener("click", onPurchaseRevivalCharm);
  revivalCharmRow.append(
    revivalCharmMark,
    revivalCharmCopy,
    purchaseRevivalCharm,
  );

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement("button", "상점 닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "shop-close";
  close.addEventListener("click", onClose);
  actions.append(close);
  const catalog = document.createElement("div");
  catalog.className = "shop-catalog";
  catalog.append(row, puppuccinoRow, revivalCharmRow);
  const throwingStarButtons = new Map<ThrowingStarTier, HTMLButtonElement>();
  for (const tier of THROWING_STAR_SHOP_TIERS) {
    const definition = THROWING_STAR_CATALOG[tier];
    const starRow = document.createElement("article");
    starRow.className = `shop-item-row throwing-star-row throwing-star-grade-${definition.grade}`;
    const preview = throwingStarPreview(tier, "shop-throwing-star-preview");
    const starCopy = document.createElement("div");
    starCopy.className = "shop-item-copy";
    starCopy.append(
      textElement("strong", `${definition.grade}등급 · ${definition.name}`),
      textElement(
        "span",
        `가격 ${definition.price.toLocaleString("ko-KR")} 메소 · 표창 피해 +${Math.round((definition.damageMultiplier - 1) * 100)}%`,
      ),
    );
    const buy = textElement("button", "구매");
    buy.type = "button";
    buy.dataset.testid = `purchase-throwing-star-${tier}`;
    buy.addEventListener("click", () => onPurchaseThrowingStar(tier));
    throwingStarButtons.set(tier, buy);
    starRow.append(preview, starCopy, buy);
    catalog.append(starRow);
  }
  panel.append(wallet, catalog, actions);

  const overlay = replaceOverlay(panel);
  const update = (nextProfile: LocalProfile): void => {
    const count = nextProfile.inventory[item.inventoryItemId] ?? 0;
    const puppuccinoCount =
      nextProfile.inventory[puppuccino.inventoryItemId] ?? 0;
    const revivalCharmCount =
      nextProfile.inventory[revivalCharm.inventoryItemId] ?? 0;
    const duaRegistered = nextProfile.pets.dua.registered;
    wallet.textContent = `보유 메소 ${Math.floor(nextProfile.character.mesos).toLocaleString("ko-KR")}`;
    owned.value = `보유 ${count}개`;
    puppuccinoOwned.value = `보유 ${puppuccinoCount}개`;
    revivalCharmOwned.value = `보유 ${revivalCharmCount}개`;
    purchase.disabled = nextProfile.character.mesos < item.price;
    use.disabled =
      count <= 0 || nextProfile.character.level >= MAX_CHARACTER_LEVEL;
    purchasePuppuccino.disabled =
      duaRegistered ||
      puppuccinoCount > 0 ||
      nextProfile.character.mesos < puppuccino.price;
    purchasePuppuccino.textContent = duaRegistered
      ? "두아 등록 완료"
      : puppuccinoCount > 0
        ? "보유 중"
        : "구매";
    purchaseRevivalCharm.disabled =
      revivalCharmCount >= revivalCharm.maximumOwned ||
      nextProfile.character.mesos < revivalCharm.price;
    purchaseRevivalCharm.textContent =
      revivalCharmCount >= revivalCharm.maximumOwned ? "보유 중" : "구매";
    for (const tier of THROWING_STAR_SHOP_TIERS) {
      const button = throwingStarButtons.get(tier);
      if (!button) continue;
      const definition = THROWING_STAR_CATALOG[tier];
      const owned = nextProfile.throwingStars.owned.includes(tier);
      button.disabled = owned || nextProfile.character.mesos < definition.price;
      button.textContent = owned
        ? nextProfile.throwingStars.equipped === tier
          ? "장착 중"
          : "보유 중"
        : "구매";
    }
  };
  update(profile);
  queueMicrotask(() => (purchase.disabled ? close : purchase).focus());

  return {
    destroy: overlay.destroy,
    update,
  };
}

const INVENTORY_CAPACITY = 24;
const INVENTORY_ITEM_DESCRIPTIONS: Record<string, string> = {
  recoveryBottle: "사용하면 HP와 MP를 각각 최대치의 50%만큼 회복합니다.",
  mushroomCap: "초록버섯이 남긴 부드러운 제작 재료입니다.",
  experienceBook: "사용하면 현재 EXP를 유지한 채 최대 10레벨 성장합니다.",
  revivalCharm:
    "사망하는 순간 자동으로 1개를 소비해 같은 자리에서 HP와 MP를 모두 회복합니다. 최대 1개만 보유할 수 있습니다.",
  puppuccino:
    "커닝시티에 혼자 앉아 있는 두아가 가장 좋아하는 달콤한 선물입니다.",
  mesoPouch: "획득 즉시 메소 지갑에 합산되는 주머니입니다.",
  emberCore: "폭열군주 이그니카르의 용광로 심장에서 떨어진 뜨거운 핵입니다.",
  moonlitCodex: "월식현자 루나시온이 지키던 봉인된 마도서입니다.",
};

export function showInventoryOverlay(
  profile: LocalProfile,
  onUseItem: (itemId: UsableInventoryItemId) => void,
  onClose: () => void,
): InventoryOverlayHandle {
  const panel = document.createElement("section");
  panel.className = "inventory-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "inventory-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "inventory-dialog-title");

  const header = document.createElement("header");
  header.className = "inventory-header";
  const heading = document.createElement("div");
  heading.append(textElement("p", "ITEM INVENTORY", "eyebrow"));
  const title = textElement("h2", "아이템 인벤토리");
  title.id = "inventory-dialog-title";
  heading.append(title);
  const wallet = textElement("strong", "", "inventory-wallet");
  wallet.dataset.testid = "inventory-wallet";
  header.append(heading, wallet);
  panel.append(header);

  const content = document.createElement("div");
  content.className = "inventory-content";
  const grid = document.createElement("div");
  grid.className = "inventory-grid";
  grid.setAttribute("aria-label", `${INVENTORY_CAPACITY}칸 아이템 인벤토리`);
  const detail = document.createElement("section");
  detail.className = "inventory-detail";
  detail.setAttribute("aria-live", "polite");
  content.append(grid, detail);
  panel.append(content);

  const footer = document.createElement("div");
  footer.className = "inventory-footer";
  const capacity = textElement("span", "", "inventory-capacity");
  capacity.dataset.testid = "inventory-capacity";
  const close = textElement("button", "인벤토리 닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "inventory-close";
  close.addEventListener("click", onClose);
  footer.append(capacity, close);
  panel.append(footer);

  let selectedId = "";
  const render = (nextProfile: LocalProfile): void => {
    const entries = Object.entries(nextProfile.inventory)
      .filter(
        ([itemId, amount]) => Object.hasOwn(ITEM_CATALOG, itemId) && amount > 0,
      )
      .map(([itemId, amount]) => ({
        kind: "item" as const,
        id: itemId,
        amount,
      }));
    const stars = nextProfile.throwingStars.owned.map((tier) => ({
      kind: "star" as const,
      id: tier,
      amount: 1,
    }));
    const slots = [...entries, ...stars].slice(0, INVENTORY_CAPACITY);
    if (!slots.some(({ kind, id }) => `${kind}:${id}` === selectedId)) {
      const first = slots[0];
      selectedId = first ? `${first.kind}:${first.id}` : "";
    }

    wallet.textContent = `${Math.floor(nextProfile.character.mesos).toLocaleString("ko-KR")} 메소`;
    capacity.textContent = `사용 ${slots.length} / ${INVENTORY_CAPACITY}칸`;
    grid.replaceChildren();
    for (const slot of slots) {
      const slotId = `${slot.kind}:${slot.id}`;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inventory-slot inventory-slot--filled";
      button.classList.toggle("selected", slotId === selectedId);
      button.dataset.testid = `inventory-slot-${slot.id}`;
      const icon =
        slot.kind === "star"
          ? inventoryThrowingStarPreview(slot.id)
          : inventoryItemIcon(slot.id);
      const name =
        slot.kind === "star"
          ? THROWING_STAR_CATALOG[slot.id].name
          : ITEM_CATALOG[slot.id as keyof typeof ITEM_CATALOG].name;
      button.setAttribute("aria-label", `${name} ${slot.amount}개`);
      button.addEventListener("click", () => {
        selectedId = slotId;
        render(nextProfile);
        queueMicrotask(() => {
          const action = panel.querySelector<HTMLButtonElement>(
            ".inventory-use-action:not(:disabled)",
          );
          if (action) {
            action.focus();
          } else {
            panel
              .querySelector<HTMLButtonElement>(".inventory-slot.selected")
              ?.focus();
          }
        });
      });
      button.append(icon, textElement("span", name, "inventory-slot-name"));
      if (slot.amount > 1) {
        button.append(
          textElement("strong", String(slot.amount), "inventory-count"),
        );
      }
      grid.append(button);
    }
    for (let index = slots.length; index < INVENTORY_CAPACITY; index += 1) {
      const empty = document.createElement("span");
      empty.className = "inventory-slot inventory-slot--empty";
      empty.setAttribute("aria-hidden", "true");
      grid.append(empty);
    }

    const [selectedKind, selectedItemId] = selectedId.split(":");
    if (!selectedItemId) {
      detail.replaceChildren(
        textElement("p", "EMPTY", "eyebrow"),
        textElement("h3", "보유 아이템이 없습니다"),
        textElement(
          "p",
          "몬스터를 처치하고 Z 키로 드롭을 회수하세요.",
          "inventory-description",
        ),
      );
    } else if (selectedKind === "star") {
      const star = THROWING_STAR_CATALOG[selectedItemId as ThrowingStarTier];
      const equipped = nextProfile.throwingStars.equipped === selectedItemId;
      detail.replaceChildren(
        textElement("p", `${star.grade} GRADE THROWING STAR`, "eyebrow"),
        textElement("h3", star.name),
        textElement(
          "p",
          `표창 계열 피해 +${Math.round((star.damageMultiplier - 1) * 100)}% · ${equipped ? "현재 장착 중" : "S 능력치·장비 창에서 장착 가능"}`,
          "inventory-description",
        ),
      );
    } else {
      const item = ITEM_CATALOG[selectedItemId as keyof typeof ITEM_CATALOG];
      const amount = nextProfile.inventory[selectedItemId] ?? 0;
      detail.replaceChildren(
        textElement("p", item.kind.toUpperCase(), "eyebrow"),
        textElement("h3", item.name),
        textElement(
          "p",
          INVENTORY_ITEM_DESCRIPTIONS[selectedItemId] ??
            "모험 중 획득한 아이템입니다.",
          "inventory-description",
        ),
        textElement(
          "strong",
          `보유 ${amount.toLocaleString("ko-KR")}개`,
          "inventory-detail-count",
        ),
      );
      if (isUsableInventoryItemId(selectedItemId)) {
        const blockedLabel =
          selectedItemId === "recoveryBottle" &&
          nextProfile.character.hp >= nextProfile.character.maxHp &&
          nextProfile.character.mp >= nextProfile.character.maxMp
            ? "HP·MP가 가득 찼습니다"
            : selectedItemId === "experienceBook" &&
                nextProfile.character.level >= MAX_CHARACTER_LEVEL
              ? "최고 레벨입니다"
              : undefined;
        const use = textElement(
          "button",
          blockedLabel ?? "사용하기",
          "inventory-use-action",
        );
        use.type = "button";
        use.disabled = blockedLabel !== undefined;
        use.dataset.testid = `inventory-use-${selectedItemId}`;
        use.setAttribute(
          "aria-label",
          blockedLabel
            ? `${item.name} 사용 불가, ${blockedLabel}, 보유 ${amount}개`
            : `${item.name} 사용하기, 보유 ${amount}개`,
        );
        use.addEventListener("click", () => {
          onUseItem(selectedItemId);
          queueMicrotask(() => {
            const action = panel.querySelector<HTMLButtonElement>(
              ".inventory-use-action:not(:disabled)",
            );
            const selected = panel.querySelector<HTMLButtonElement>(
              ".inventory-slot.selected",
            );
            (action ?? selected ?? close).focus();
          });
        });
        detail.append(use);
      }
    }
  };

  const overlay = replaceOverlay(panel);
  render(profile);
  queueMicrotask(() => {
    const first = panel.querySelector<HTMLButtonElement>(
      ".inventory-slot--filled",
    );
    (first ?? close).focus();
  });
  return { destroy: overlay.destroy, update: render };
}

function inventoryItemIcon(itemId: string): HTMLSpanElement {
  const icon = document.createElement("span");
  icon.className = `inventory-item-icon inventory-item-icon--${itemId}`;
  icon.setAttribute("aria-hidden", "true");
  return icon;
}

function inventoryThrowingStarPreview(tier: ThrowingStarTier): HTMLSpanElement {
  const definition = THROWING_STAR_CATALOG[tier];
  const preview = document.createElement("span");
  preview.className = "inventory-item-icon inventory-star-preview";
  preview.setAttribute("aria-hidden", "true");
  preview.style.backgroundImage = `url(${equippedThrowingStarsUrl})`;
  const column = definition.projectileFrame % 4;
  const row = Math.floor(definition.projectileFrame / 4);
  preview.style.backgroundPosition = `${-column * 48}px ${-row * 48}px`;
  return preview;
}

function throwingStarPreview(
  tier: ThrowingStarTier,
  className: string,
  displaySize = 64,
): HTMLSpanElement {
  const definition = THROWING_STAR_CATALOG[tier];
  const preview = document.createElement("span");
  preview.className = className;
  preview.setAttribute("aria-hidden", "true");
  preview.style.backgroundImage = `url(${equippedThrowingStarsUrl})`;
  preview.style.width = `${displaySize}px`;
  preview.style.height = `${displaySize}px`;
  preview.style.backgroundSize = `${displaySize * 4}px ${displaySize * 4}px`;
  const column = definition.projectileFrame % 4;
  const row = Math.floor(definition.projectileFrame / 4);
  preview.style.backgroundPosition = `${-column * displaySize}px ${-row * displaySize}px`;
  return preview;
}

export function showSkillOverlay(
  profile: LocalProfile,
  onAllocate: (skillId: SkillIdType) => void,
  onClose: () => void,
): SkillOverlayHandle {
  const panel = document.createElement("section");
  panel.className = "skill-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "skill-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "skill-dialog-title");

  const header = document.createElement("header");
  header.className = "skill-dialog-header";
  const heading = document.createElement("div");
  heading.append(textElement("p", "SKILL INVENTORY", "eyebrow"));
  const title = textElement("h2", "도적·호카게 스킬");
  title.id = "skill-dialog-title";
  heading.append(title);
  const headerControls = document.createElement("div");
  headerControls.className = "skill-header-controls";
  const summary = textElement("strong", "", "skill-points-summary");
  summary.dataset.testid = "remaining-skill-points";
  const close = textElement("button", "×");
  close.type = "button";
  close.className = "skill-close-button";
  close.dataset.testid = "skill-close";
  close.setAttribute("aria-label", "닫기");
  close.addEventListener("click", onClose);
  headerControls.append(summary, close);
  header.append(heading, headerControls);
  panel.append(header);

  const tabs = document.createElement("div");
  tabs.className = "skill-tabs";
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "전직 차수");
  panel.append(tabs);

  const content = document.createElement("div");
  content.className = "skill-dialog-content";
  const list = document.createElement("div");
  list.className = "skill-list";
  list.setAttribute("aria-label", "스킬 목록");
  const detail = document.createElement("section");
  detail.className = "skill-detail";
  detail.setAttribute("aria-live", "polite");
  content.append(list, detail);
  panel.append(content);

  let selectedSkill: SkillIdType =
    SKILL_ORDER.find((skillId) =>
      isSkillUnlocked(skillId, profile.character.job),
    ) ?? SkillId.LuckySeven;

  const render = (nextProfile: LocalProfile): void => {
    const { character } = nextProfile;
    const focusedTestId = panel.contains(document.activeElement)
      ? (document.activeElement as HTMLElement).dataset.testid
      : undefined;
    summary.textContent = `남은 SP ${character.skillPoints}`;
    summary.classList.toggle("has-points", character.skillPoints > 0);
    tabs.replaceChildren();
    list.replaceChildren();

    const selectedTierJob = SKILL_DEFINITIONS[selectedSkill].requiredJob;
    const tierSkillIds = ACTIVE_SKILL_ORDER.filter(
      (skillId, index, skills) =>
        skills.findIndex(
          (candidate) =>
            SKILL_DEFINITIONS[candidate].requiredJob ===
            SKILL_DEFINITIONS[skillId].requiredJob,
        ) === index,
    );
    for (const tierSkillId of tierSkillIds) {
      const tierDefinition = SKILL_DEFINITIONS[tierSkillId];
      const selected = selectedTierJob === tierDefinition.requiredJob;
      const tab = textElement("button", tierDefinition.tierLabel);
      tab.type = "button";
      tab.className = "skill-tab";
      tab.setAttribute("role", "tab");
      tab.setAttribute("aria-selected", String(selected));
      tab.dataset.testid = `skill-tab-${tierSkillId}`;
      tab.addEventListener("click", () => {
        selectedSkill = tierSkillId;
        render(nextProfile);
        queueMicrotask(() =>
          panel
            .querySelector<HTMLButtonElement>(
              `[data-testid="skill-select-${tierSkillId}"]`,
            )
            ?.focus(),
        );
      });
      tabs.append(tab);
    }

    for (const skillId of SKILL_ORDER.filter(
      (candidate) =>
        SKILL_DEFINITIONS[candidate].requiredJob === selectedTierJob,
    )) {
      const definition = SKILL_DEFINITIONS[skillId];
      const hotkey = isActiveSkillId(skillId)
        ? skillHotkeyFor(skillId, nextProfile.skillHotbar)
        : undefined;
      const unlocked = isSkillUnlocked(skillId, character.job);
      const currentLevel = character.skillLevels[skillId];

      const row = document.createElement("article");
      row.className = "skill-row";
      row.classList.toggle("selected", selectedSkill === skillId);
      row.classList.toggle("locked", !unlocked);
      row.classList.toggle("passive", definition.kind === "passive");

      const select = document.createElement("button");
      select.type = "button";
      select.className = "skill-select";
      select.dataset.testid = `skill-select-${skillId}`;
      select.setAttribute(
        "aria-label",
        `${hotkey ? `${hotkey}번` : "패시브"} ${definition.label}, 레벨 ${currentLevel}/${definition.maxLevel}${unlocked ? "" : ", 잠김"}`,
      );
      select.addEventListener("click", () => {
        selectedSkill = skillId;
        render(nextProfile);
      });

      const icon = document.createElement("img");
      icon.className = "skill-icon";
      icon.src = SKILL_ICON_URLS[skillId];
      icon.alt = "";
      icon.width = 46;
      icon.height = 46;
      icon.loading = "eager";
      icon.decoding = "async";
      icon.draggable = false;
      icon.dataset.testid = `skill-icon-${skillId}`;
      icon.setAttribute("aria-hidden", "true");

      const name = document.createElement("span");
      name.className = "skill-row-copy";
      name.append(
        textElement("strong", definition.label),
        textElement(
          "span",
          unlocked
            ? `${hotkey ?? "패시브 · 항상 적용"} · LV. ${currentLevel} / ${definition.maxLevel}`
            : `${hotkey ?? "패시브"} · ${definition.tierLabel} 전직 필요`,
          "skill-level",
        ),
      );
      const levelOutput = name.lastElementChild as HTMLElement;
      levelOutput.dataset.testid = `skill-level-${skillId}`;
      select.append(icon, name);

      const add = textElement("button", "+");
      add.type = "button";
      add.className = "skill-add-button";
      add.dataset.testid = `allocate-skill-${skillId}`;
      add.disabled =
        !unlocked ||
        character.skillPoints <= 0 ||
        currentLevel >= definition.maxLevel;
      add.setAttribute("aria-label", `${definition.label} 스킬 레벨 올리기`);
      add.addEventListener("click", () => onAllocate(skillId));
      row.append(select, add);
      list.append(row);
    }

    renderSkillDetail(detail, selectedSkill, nextProfile);
    if (focusedTestId) {
      queueMicrotask(() => {
        const nextFocus = panel.querySelector<HTMLButtonElement>(
          `[data-testid="${focusedTestId}"]`,
        );
        if (nextFocus && !nextFocus.disabled) {
          nextFocus.focus();
        }
      });
    }
  };

  const overlay = replaceOverlay(panel);
  render(profile);
  queueMicrotask(() =>
    panel
      .querySelector<HTMLButtonElement>(
        `[data-testid="skill-select-${selectedSkill}"]`,
      )
      ?.focus(),
  );

  return {
    destroy: overlay.destroy,
    update: render,
  };
}

export function showSkillHotkeyOverlay(
  profile: LocalProfile,
  onChange: (
    skillHotbar: readonly ActiveSkillId[],
    skillHotkeyAliases: SkillHotkeyAliases,
  ) => void,
  onClose: () => void,
): SkillHotkeyOverlayHandle {
  const panel = templateElement<HTMLElement>("skill-hotkey-dialog-template");
  if (document.documentElement.dataset.inputMode === "touch") {
    panel.dataset.mobileJob = profile.character.job;
    panel.querySelector("#skill-hotkey-dialog-title")!.textContent =
      "모바일 스킬 4슬롯";
    panel.querySelector(".skill-hotkey-dialog-help")!.textContent =
      "현재 차수의 주 스킬만 네 슬롯 안에서 배치할 수 있습니다.";
  }
  const numberSlots = panel.querySelectorAll<HTMLButtonElement>(
    '.skill-hotbar-slot[data-hotkey-kind="number"]',
  );
  const choices = panel.querySelectorAll<HTMLButtonElement>(
    ".skill-hotkey-choice",
  );
  panel
    .querySelector('[data-testid="skill-hotkey-close"]')!
    .addEventListener("click", onClose);

  const extraSlots = panel.querySelectorAll<HTMLButtonElement>(
    '.skill-hotbar-slot[data-hotkey-kind="extra"]',
  );
  const clear = panel.querySelector<HTMLButtonElement>(
    '[data-testid="skill-hotkey-clear"]',
  )!;
  let selected:
    | { kind: "number"; hotkey: SkillHotkey }
    | { kind: "extra"; hotkey: ExtraSkillHotkey } = {
    kind: "number",
    hotkey: "1",
  };
  let currentProfile = profile;
  let draggedNumberSkillId: ActiveSkillId | undefined;
  let draggedExtraHotkey: ExtraSkillHotkey | undefined;

  const render = (nextProfile: LocalProfile): void => {
    currentProfile = nextProfile;
    const assignments = skillHotkeyAssignments(nextProfile.skillHotbar);
    numberSlots.forEach((slot, index) => {
      const { hotkey, skillId } = assignments[index]!;
      slot.dataset.skillId = skillId;
      const isSelected =
        selected.kind === "number" && selected.hotkey === hotkey;
      slot.classList.toggle("selected", isSelected);
      slot.setAttribute("aria-pressed", String(isSelected));
      slot.setAttribute(
        "aria-label",
        `${hotkey}번 슬롯 ${SKILL_DEFINITIONS[skillId].label}. 드래그하거나 Alt와 화살표로 위치 변경`,
      );
      slot.querySelector<HTMLImageElement>("img")!.src =
        SKILL_ICON_URLS[skillId];
    });
    extraSlots.forEach((slot) => {
      const hotkey = slot.dataset.hotkey as ExtraSkillHotkey;
      const skillId = nextProfile.skillHotkeyAliases[hotkey];
      const isSelected =
        selected.kind === "extra" && selected.hotkey === hotkey;
      const fallback = hotkey === "S" ? "스탯" : "비어 있음";
      slot.dataset.skillId = skillId ?? "";
      slot.dataset.emptyLabel = fallback;
      slot.classList.toggle("empty", !skillId);
      slot.classList.toggle("selected", isSelected);
      slot.setAttribute("aria-pressed", String(isSelected));
      slot.setAttribute(
        "aria-label",
        `${hotkey} 추가 슬롯 ${skillId ? SKILL_DEFINITIONS[skillId].label : fallback}`,
      );
      const icon = slot.querySelector<HTMLImageElement>("img")!;
      icon.hidden = !skillId;
      if (skillId) icon.src = SKILL_ICON_URLS[skillId];
    });
    const targetSkillId =
      selected.kind === "number"
        ? assignments.find(({ hotkey }) => hotkey === selected.hotkey)!.skillId
        : nextProfile.skillHotkeyAliases[selected.hotkey];
    clear.disabled = selected.kind === "number" || !targetSkillId;
    choices.forEach((button) => {
      const skillId = button.dataset.skillId as ActiveSkillId;
      const definition = SKILL_DEFINITIONS[skillId];
      const hotkeys = skillHotkeysFor(
        skillId,
        nextProfile.skillHotbar,
        nextProfile.skillHotkeyAliases,
      ).join(" · ");
      button.classList.toggle("assigned", targetSkillId === skillId);
      button.setAttribute(
        "aria-label",
        `${definition.label}, 현재 ${hotkeys} 슬롯${targetSkillId === skillId ? ", 선택한 슬롯에 배치됨" : ""}`,
      );
      button.querySelector<HTMLImageElement>("img")!.src =
        SKILL_ICON_URLS[skillId];
      button.querySelector("small")!.textContent = isSkillUnlocked(
        skillId,
        nextProfile.character.job,
      )
        ? `현재 ${hotkeys}`
        : `${definition.tierLabel} 필요 · 현재 ${hotkeys}`;
    });
  };

  numberSlots.forEach((slot, index) => {
    const hotkey = slot.dataset.hotkey as SkillHotkey;
    slot.addEventListener("click", () => {
      selected = { kind: "number", hotkey };
      render(currentProfile);
    });
    slot.addEventListener("dragstart", (event) => {
      draggedNumberSkillId = slot.dataset.skillId as ActiveSkillId;
      event.dataTransfer?.setData("text/plain", draggedNumberSkillId);
      slot.classList.add("dragging");
    });
    slot.addEventListener("dragend", () => {
      draggedNumberSkillId = undefined;
      slot.classList.remove("dragging");
    });
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      const source = (event.dataTransfer?.getData("text/plain") ||
        draggedNumberSkillId) as ActiveSkillId | undefined;
      const target = slot.dataset.skillId as ActiveSkillId;
      if (source && source !== target) {
        onChange(
          swapSkillHotbarSlots(currentProfile.skillHotbar, source, target),
          currentProfile.skillHotkeyAliases,
        );
      }
    });
    slot.addEventListener("keydown", (event) => {
      if (!event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key))
        return;
      event.preventDefault();
      const targetIndex = index + (event.key === "ArrowLeft" ? -1 : 1);
      const assignments = skillHotkeyAssignments(currentProfile.skillHotbar);
      const target = assignments[targetIndex];
      if (target) {
        onChange(
          swapSkillHotbarSlots(
            currentProfile.skillHotbar,
            assignments[index]!.skillId,
            target.skillId,
          ),
          currentProfile.skillHotkeyAliases,
        );
        queueMicrotask(() => numberSlots[targetIndex]?.focus());
      }
    });
  });
  extraSlots.forEach((slot, index) => {
    const hotkey = slot.dataset.hotkey as ExtraSkillHotkey;
    slot.addEventListener("click", () => {
      selected = { kind: "extra", hotkey };
      render(currentProfile);
    });
    slot.addEventListener("dragstart", (event) => {
      draggedExtraHotkey = hotkey;
      event.dataTransfer?.setData("text/plain", hotkey);
      slot.classList.add("dragging");
    });
    slot.addEventListener("dragend", () => {
      draggedExtraHotkey = undefined;
      slot.classList.remove("dragging");
    });
    slot.addEventListener("dragover", (event) => event.preventDefault());
    slot.addEventListener("drop", (event) => {
      event.preventDefault();
      const source = (event.dataTransfer?.getData("text/plain") ||
        draggedExtraHotkey) as ExtraSkillHotkey | undefined;
      if (
        source &&
        (EXTRA_SKILL_HOTKEYS as readonly string[]).includes(source) &&
        source !== hotkey
      ) {
        onChange(
          currentProfile.skillHotbar,
          swapSkillHotkeyAliases(
            currentProfile.skillHotkeyAliases,
            source,
            hotkey,
          ),
        );
      }
    });
    slot.addEventListener("keydown", (event) => {
      if (!event.altKey || !["ArrowLeft", "ArrowRight"].includes(event.key))
        return;
      event.preventDefault();
      const targetIndex = index + (event.key === "ArrowLeft" ? -1 : 1);
      const target = extraSlots[targetIndex];
      if (target) {
        onChange(
          currentProfile.skillHotbar,
          swapSkillHotkeyAliases(
            currentProfile.skillHotkeyAliases,
            hotkey,
            target.dataset.hotkey as ExtraSkillHotkey,
          ),
        );
        queueMicrotask(() => target.focus());
      }
    });
  });
  choices.forEach((button) =>
    button.addEventListener("click", () => {
      const skillId = button.dataset.skillId as ActiveSkillId;
      if (selected.kind === "number") {
        const target = skillHotkeyAssignments(currentProfile.skillHotbar).find(
          ({ hotkey }) => hotkey === selected.hotkey,
        )!;
        if (target.skillId !== skillId) {
          onChange(
            swapSkillHotbarSlots(
              currentProfile.skillHotbar,
              target.skillId,
              skillId,
            ),
            currentProfile.skillHotkeyAliases,
          );
        }
      } else if (
        currentProfile.skillHotkeyAliases[selected.hotkey] !== skillId
      ) {
        onChange(
          currentProfile.skillHotbar,
          assignSkillHotkeyAlias(
            currentProfile.skillHotkeyAliases,
            selected.hotkey,
            skillId,
          ),
        );
      }
    }),
  );
  clear.addEventListener("click", () => {
    if (selected.kind !== "extra") return;
    onChange(
      currentProfile.skillHotbar,
      assignSkillHotkeyAlias(
        currentProfile.skillHotkeyAliases,
        selected.hotkey,
      ),
    );
  });
  const overlay = replaceOverlay(panel);
  render(profile);
  queueMicrotask(() =>
    panel
      .querySelector<HTMLButtonElement>('[data-testid="skill-hotbar-slot-1"]')
      ?.focus(),
  );
  return { destroy: overlay.destroy, update: render };
}

function renderSkillDetail(
  detail: HTMLElement,
  skillId: SkillIdType,
  profile: LocalProfile,
): void {
  const definition = SKILL_DEFINITIONS[skillId];
  const level = profile.character.skillLevels[skillId];
  const unlocked = isSkillUnlocked(skillId, profile.character.job);
  const nextLevel = Math.min(definition.maxLevel, level + 1);
  const progress = document.createElement("progress");
  progress.max = definition.maxLevel;
  progress.value = level;
  progress.setAttribute(
    "aria-label",
    `${definition.label} 레벨 ${level}/${definition.maxLevel}`,
  );

  const effects: string[] = [];
  let nextEffect: string;
  if (definition.kind === "active") {
    const hotkey = skillHotkeyFor(definition.id, profile.skillHotbar);
    const totalBonus = level * definition.damagePerLevel;
    const nextBonus = nextLevel * definition.damagePerLevel;
    if (skillId === SkillId.NineTailsTransformation) {
      effects.push(
        `액티브 토글 · 변신 MP ${NINE_TAILS_TRANSFORMATION_MP_COST} · 초당 최대 MP 1% · 해제 MP 0 · 숫자키 ${hotkey} · 보조키 ${definition.shortcut}`,
        `변신 중 CTRL 할퀴기 공격속도 2배 · 이동속도 +20% · 장착 표창 공격 보정 · SHIFT 미수옥 · 현재 변신 공격 피해 +${Math.round(level * 2.5)}%`,
      );
      nextEffect = `다음 레벨: 변신 공격 피해 +${Math.round(nextLevel * 2.5)}%`;
    } else {
      const attack = ATTACK_DEFINITIONS[definition.id as AttackKindType];
      effects.push(
        `액티브 · MP ${attack.mpCost} · ${attack.hitCount}타 · 숫자키 ${hotkey} · 보조키 ${definition.shortcut}`,
        `현재 스킬 피해 보너스 +${totalBonus}${attack.hitCount > 1 ? "/타" : ""}`,
      );
      if (skillId === SkillId.Drain) {
        effects.push(
          `적용 피해의 ${Math.round(attack.hpDrainRatio * 100)}% HP 회복`,
        );
      }
      if (attack.maxTargets > 1) {
        effects.push(`최대 ${attack.maxTargets}대상 관통`);
      }
      if (skillId === SkillId.TailedBeastBomb) {
        effects.push("구미호 변신 중에만 사용 가능");
      }
      nextEffect = `다음 레벨: 피해 보너스 +${nextBonus}${attack.hitCount > 1 ? "/타" : ""}`;
    }
  } else {
    effects.push("패시브 · 습득 즉시 모든 해당 효과에 자동 적용");
    effects.push(`현재 효과: ${passiveEffectSummary(skillId, level)}`);
    nextEffect = `다음 레벨: ${passiveEffectSummary(skillId, nextLevel)}`;
  }

  detail.replaceChildren(
    textElement("p", definition.tierLabel, "eyebrow"),
    textElement("h3", definition.label),
    textElement(
      "p",
      unlocked
        ? definition.description
        : `${definition.tierLabel} 전직 후 사용할 수 있습니다.`,
      "skill-description",
    ),
    progress,
    ...effects.map((effect) => textElement("p", effect, "skill-effect-line")),
    textElement(
      "p",
      level >= definition.maxLevel ? "마스터 레벨에 도달했습니다." : nextEffect,
      "skill-next-level",
    ),
  );
  detail.dataset.testid = "skill-detail";
}

function passiveEffectSummary(skillId: SkillIdType, level: number): string {
  const definition = SKILL_DEFINITIONS[skillId];
  if (definition.kind !== "passive") {
    return "";
  }
  const safeLevel = Math.max(0, Math.min(definition.maxLevel, level));
  if (definition.effect.kind === "projectile-range") {
    return `모든 표창 유효 거리 +${safeLevel * definition.effect.percentPerLevel}%`;
  }
  if (definition.effect.kind === "critical-throw") {
    return `모든 표창 치명타 확률 ${safeLevel * definition.effect.chancePercentPerLevel}% · 치명타 피해 ${Math.round(definition.effect.damageMultiplier * 100)}%`;
  }
  const reduction = safeLevel * definition.effect.reductionPercentPerLevel;
  const interval = Math.round(
    RECOVERY_RULES.intervalMs * (1 - reduction / 100),
  );
  return `자연 회복 주기 -${reduction}% · ${interval}ms마다 회복`;
}

export function showStatsOverlay(
  profile: LocalProfile,
  onAllocate: (stat: PlayerStatType) => void,
  onAutoAllocate: () => void,
  onToggleAuto: (enabled: boolean) => void,
  onEquip: (tier: ThrowingStarTier) => void,
  onClose: () => void,
): StatsOverlayHandle {
  const panel = document.createElement("section");
  panel.className = "stats-dialog ui-panel ui-panel--metal";
  panel.dataset.testid = "stats-dialog";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-labelledby", "stats-dialog-title");

  panel.append(textElement("p", "CHARACTER STATS", "eyebrow"));
  const title = textElement("h2", "능력치 · 표창 장비");
  title.id = "stats-dialog-title";
  panel.append(title);

  const content = document.createElement("div");
  content.className = "stats-dialog-content";
  const statsSection = document.createElement("section");
  statsSection.className = "stats-allocation-section";
  statsSection.append(textElement("h3", "능력치 분배"));

  const summary = textElement("p", "", "stats-summary");
  summary.dataset.testid = "remaining-stat-points";
  statsSection.append(summary);

  const grid = document.createElement("div");
  grid.className = "stats-grid";
  const values = new Map<PlayerStatType, HTMLOutputElement>();
  const buttons = new Map<PlayerStatType, HTMLButtonElement>();
  for (const stat of [
    PlayerStat.Str,
    PlayerStat.Dex,
    PlayerStat.Int,
    PlayerStat.Luk,
  ]) {
    const row = document.createElement("div");
    row.className = "stat-row";
    const label = textElement("strong", STAT_LABELS[stat]);
    const value = document.createElement("output");
    value.dataset.testid = `stat-${stat}`;
    const button = textElement("button", "+");
    button.type = "button";
    button.className = "stat-add-button";
    button.dataset.testid = `allocate-${stat}`;
    button.setAttribute("aria-label", `${STAT_LABELS[stat]} 1 포인트 올리기`);
    button.addEventListener("click", () => onAllocate(stat));
    values.set(stat, value);
    buttons.set(stat, button);
    row.append(label, value, button);
    grid.append(row);
  }
  statsSection.append(grid);

  const recommendation = textElement(
    "p",
    "표창도적 추천 자동분배: 레벨당 LUK +4, DEX +1",
    "stats-recommendation",
  );
  statsSection.append(recommendation);

  const autoLabel = document.createElement("label");
  autoLabel.className = "stats-auto-option";
  const autoCheckbox = document.createElement("input");
  autoCheckbox.type = "checkbox";
  autoCheckbox.dataset.testid = "auto-allocate-toggle";
  autoCheckbox.addEventListener("change", () =>
    onToggleAuto(autoCheckbox.checked),
  );
  autoLabel.append(autoCheckbox, textElement("span", "레벨업 시 자동분배"));
  statsSection.append(autoLabel);

  const equipmentSection = document.createElement("section");
  equipmentSection.className = "stats-equipment-section";
  equipmentSection.dataset.testid = "equipment-dialog";
  equipmentSection.setAttribute("role", "region");
  equipmentSection.setAttribute("aria-labelledby", "equipment-dialog-title");
  const equipmentTitle = textElement("h3", "표창 장비");
  equipmentTitle.id = "equipment-dialog-title";
  const equipmentSummary = textElement("p", "", "equipment-summary");
  equipmentSummary.dataset.testid = "equipped-throwing-star";
  equipmentSection.append(equipmentTitle, equipmentSummary);

  const equipmentList = document.createElement("div");
  equipmentList.className = "equipment-list";
  const equipButtons = new Map<ThrowingStarTier, HTMLButtonElement>();
  for (const tier of THROWING_STAR_TIERS) {
    const definition = THROWING_STAR_CATALOG[tier];
    const item = document.createElement("article");
    item.className = `equipment-item throwing-star-grade-${definition.grade}`;
    const preview = throwingStarPreview(tier, "equipment-star-preview", 48);
    const copy = document.createElement("div");
    copy.className = "equipment-item-copy";
    copy.append(
      textElement("strong", `${definition.grade}등급 · ${definition.name}`),
      textElement(
        "span",
        `표창 피해 +${Math.round((definition.damageMultiplier - 1) * 100)}%`,
      ),
    );
    const equip = textElement("button", "장착");
    equip.type = "button";
    equip.dataset.testid = `equip-throwing-star-${tier}`;
    equip.addEventListener("click", () => onEquip(tier));
    equipButtons.set(tier, equip);
    item.append(preview, copy, equip);
    equipmentList.append(item);
  }
  equipmentSection.append(equipmentList);
  content.append(statsSection, equipmentSection);
  panel.append(content);

  const actions = document.createElement("div");
  actions.className = "screen-actions";
  const close = textElement("button", "닫기");
  close.type = "button";
  close.className = "secondary";
  close.dataset.testid = "stats-close";
  close.addEventListener("click", onClose);
  const autoAllocate = textElement("button", "남은 AP 자동분배");
  autoAllocate.type = "button";
  autoAllocate.dataset.testid = "auto-allocate-now";
  autoAllocate.addEventListener("click", onAutoAllocate);
  actions.append(close, autoAllocate);
  panel.append(actions);

  const overlay = replaceOverlay(panel);
  const update = (nextProfile: LocalProfile): void => {
    const { character } = nextProfile;
    summary.textContent = `LV. ${character.level} ${playerJobLabel(character.job)} · 남은 AP ${character.statPoints}`;
    for (const stat of [
      PlayerStat.Str,
      PlayerStat.Dex,
      PlayerStat.Int,
      PlayerStat.Luk,
    ]) {
      values.get(stat)!.value = String(character.stats[stat]);
      buttons.get(stat)!.disabled = character.statPoints <= 0;
    }
    autoCheckbox.checked = character.autoAllocateStats;
    autoAllocate.disabled = character.statPoints <= 0;
    const equipped = THROWING_STAR_CATALOG[nextProfile.throwingStars.equipped];
    equipmentSummary.textContent = `장착: ${equipped.name} · ${equipped.grade}등급 · 피해 +${Math.round((equipped.damageMultiplier - 1) * 100)}%`;
    for (const tier of THROWING_STAR_TIERS) {
      const button = equipButtons.get(tier);
      if (!button) continue;
      const owned = nextProfile.throwingStars.owned.includes(tier);
      const isEquipped = nextProfile.throwingStars.equipped === tier;
      button.disabled = !owned || isEquipped;
      button.textContent = isEquipped ? "장착 중" : owned ? "장착" : "미보유";
      button.setAttribute(
        "aria-label",
        `${THROWING_STAR_CATALOG[tier].name} ${isEquipped ? "장착 중" : owned ? "장착" : "미보유"}`,
      );
    }
  };
  update(profile);
  queueMicrotask(() => autoCheckbox.focus());

  return {
    destroy: overlay.destroy,
    update,
  };
}

export function hideOverlay(): void {
  const root = overlayRoot();
  root.replaceChildren();
  root.hidden = true;
  const game = document.querySelector<HTMLElement>("#game");
  if (game) game.inert = false;
}
