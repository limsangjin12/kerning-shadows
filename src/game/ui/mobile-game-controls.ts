import { SKILL_ICON_URLS } from "../assets/skill-icon-assets";
import type { PlayerJob } from "../data/catalog";
import {
  GameAction,
  gameActionForSkill,
  type GameAction as GameActionType,
} from "../input/actions";
import {
  clampMobileJoystickOffset,
  mobileJoystickDirections,
  type MobileJoystickDirections,
} from "../input/mobile-control-rules";
import {
  SKILL_DEFINITIONS,
  mobileSkillsForHotbar,
  type ActiveSkillId,
} from "../skills/skill-rules";

const JOYSTICK_SOURCE_PREFIX = "mobile-joystick";

export type MobileInteractionAction = "none" | "dialog" | "portal" | "climb";

type MobileActionHandler = (
  action: GameActionType,
  pressed: boolean,
  source: string,
) => void;

export interface MobileGameControlsHandle {
  update(job: PlayerJob, skillHotbar: readonly ActiveSkillId[]): void;
  setInteractionAction(action: MobileInteractionAction): void;
  destroy(): void;
}

function bindMomentaryAction(
  button: HTMLButtonElement,
  action: GameActionType,
  source: string,
  onAction: MobileActionHandler,
): void {
  let activePointer: number | undefined;
  const release = (): void => {
    if (activePointer === undefined) return;
    onAction(action, false, source);
    activePointer = undefined;
    button.classList.remove("pressed");
  };
  button.addEventListener("pointerdown", (event) => {
    if (activePointer !== undefined || event.button !== 0) return;
    event.preventDefault();
    activePointer = event.pointerId;
    button.setPointerCapture(event.pointerId);
    button.classList.add("pressed");
    onAction(action, true, source);
  });
  button.addEventListener("pointerup", release);
  button.addEventListener("pointercancel", release);
  button.addEventListener("lostpointercapture", release);
  button.addEventListener("contextmenu", (event) => event.preventDefault());
}

export function createMobileGameControls(
  onAction: MobileActionHandler,
): MobileGameControlsHandle {
  const app = document.querySelector<HTMLElement>("#app");
  if (!app) {
    throw new Error("Mobile controls require the #app host.");
  }
  const template = document.querySelector<HTMLTemplateElement>(
    "#mobile-game-controls-template",
  )!;
  const root = template.content.firstElementChild!.cloneNode(
    true,
  ) as HTMLElement;
  const joystick = root.querySelector<HTMLButtonElement>(".mobile-joystick")!;
  const joystickKnob = root.querySelector<HTMLElement>(
    ".mobile-joystick-knob",
  )!;
  const skillButtons = Array.from(
    root.querySelectorAll<HTMLButtonElement>(".mobile-skill-button"),
    (button) => ({
      button,
      icon: button.querySelector<HTMLImageElement>("img")!,
      label: button.querySelector<HTMLElement>(".mobile-action-label")!,
    }),
  );
  let interactionAction: MobileInteractionAction = "none";
  const jump = root.querySelector<HTMLButtonElement>(".mobile-jump-button")!;
  bindMomentaryAction(jump, GameAction.Jump, "mobile-jump", onAction);
  const dialog = root.querySelector<HTMLButtonElement>(
    ".mobile-dialog-button",
  )!;
  bindMomentaryAction(dialog, GameAction.Interact, "mobile-dialog", onAction);
  const move = root.querySelector<HTMLButtonElement>(".mobile-move-button")!;
  const moveLabel = move.querySelector<HTMLElement>(".mobile-action-label")!;
  bindMomentaryAction(move, GameAction.Interact, "mobile-move", onAction);
  const attack = root.querySelector<HTMLButtonElement>(
    ".mobile-attack-button",
  )!;
  bindMomentaryAction(
    attack,
    GameAction.BasicAttack,
    "mobile-basic-attack",
    onAction,
  );
  const loot = root.querySelector<HTMLButtonElement>(".mobile-loot-button")!;
  bindMomentaryAction(loot, GameAction.Loot, "mobile-loot", onAction);
  const menu = root.querySelector<HTMLButtonElement>(".mobile-menu-button")!;
  bindMomentaryAction(menu, GameAction.OpenMenu, "mobile-menu", onAction);
  app.append(root);

  let activeJoystickPointer: number | undefined;
  let directions: MobileJoystickDirections = {
    left: false,
    right: false,
    down: false,
  };

  const setHeld = (
    action: GameActionType,
    next: boolean,
    previous: boolean,
    source: string,
  ): void => {
    if (next === previous) return;
    onAction(action, next, source);
  };

  const updateJoystick = (clientX: number, clientY: number): void => {
    const bounds = joystick.getBoundingClientRect();
    const horizontalRadius = Math.max(1, bounds.width * 0.28);
    const verticalRadius = Math.max(1, bounds.height * 0.24);
    const deltaX = clientX - (bounds.left + bounds.width / 2);
    const deltaY = clientY - (bounds.top + bounds.height / 2);
    const next = mobileJoystickDirections(
      deltaX,
      deltaY,
      horizontalRadius,
      verticalRadius,
    );
    setHeld(
      GameAction.MoveLeft,
      next.left,
      directions.left,
      `${JOYSTICK_SOURCE_PREFIX}-left`,
    );
    setHeld(
      GameAction.MoveRight,
      next.right,
      directions.right,
      `${JOYSTICK_SOURCE_PREFIX}-right`,
    );
    setHeld(
      GameAction.MoveDown,
      next.down,
      directions.down,
      `${JOYSTICK_SOURCE_PREFIX}-down`,
    );
    directions = next;
    const offset = clampMobileJoystickOffset(
      deltaX,
      deltaY,
      horizontalRadius,
      verticalRadius,
    );
    joystickKnob.style.transform = `translate(${offset.x}px, ${offset.y}px)`;
  };

  const resetJoystick = (): void => {
    setHeld(
      GameAction.MoveLeft,
      false,
      directions.left,
      `${JOYSTICK_SOURCE_PREFIX}-left`,
    );
    setHeld(
      GameAction.MoveRight,
      false,
      directions.right,
      `${JOYSTICK_SOURCE_PREFIX}-right`,
    );
    setHeld(
      GameAction.MoveDown,
      false,
      directions.down,
      `${JOYSTICK_SOURCE_PREFIX}-down`,
    );
    directions = { left: false, right: false, down: false };
    activeJoystickPointer = undefined;
    joystickKnob.style.transform = "translate(0, 0)";
    joystick.classList.remove("pressed");
  };

  joystick.addEventListener("pointerdown", (event) => {
    if (activeJoystickPointer !== undefined || event.button !== 0) return;
    event.preventDefault();
    activeJoystickPointer = event.pointerId;
    joystick.setPointerCapture(event.pointerId);
    joystick.classList.add("pressed");
    updateJoystick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointermove", (event) => {
    if (event.pointerId !== activeJoystickPointer) return;
    event.preventDefault();
    updateJoystick(event.clientX, event.clientY);
  });
  joystick.addEventListener("pointerup", resetJoystick);
  joystick.addEventListener("pointercancel", resetJoystick);
  joystick.addEventListener("lostpointercapture", resetJoystick);
  joystick.addEventListener("contextmenu", (event) => event.preventDefault());

  const update = (
    job: PlayerJob,
    skillHotbar: readonly ActiveSkillId[],
  ): void => {
    const skills = mobileSkillsForHotbar(job, skillHotbar);
    const skillSignature = skills.join(",");
    if (
      root.dataset.job === job &&
      root.dataset.skillSignature === skillSignature
    ) {
      return;
    }
    root.dataset.job = job;
    root.dataset.skillSignature = skillSignature;
    for (const [index, current] of skillButtons.entries()) {
      const skillId: ActiveSkillId | undefined = skills[index];
      const button = current.button.cloneNode(true) as HTMLButtonElement;
      current.button.replaceWith(button);
      const icon = button.querySelector<HTMLImageElement>("img")!;
      const label = button.querySelector<HTMLElement>(".mobile-action-label")!;
      skillButtons[index] = { button, icon, label };
      button.dataset.skillId = skillId ?? "";
      button.disabled = !skillId;
      icon.hidden = !skillId;
      if (!skillId) {
        label.textContent = "전직 후";
        button.setAttribute("aria-label", `대표 스킬 ${index + 1}, 잠김`);
        continue;
      }
      const definition = SKILL_DEFINITIONS[skillId];
      icon.src = SKILL_ICON_URLS[skillId];
      label.textContent = definition.label;
      button.dataset.action = gameActionForSkill(skillId);
      button.setAttribute("aria-label", `${definition.label} 사용`);
      bindMomentaryAction(
        button,
        gameActionForSkill(skillId),
        `mobile-skill-${index + 1}`,
        onAction,
      );
    }
  };

  const setInteractionAction = (next: MobileInteractionAction): void => {
    if (interactionAction === next) return;
    interactionAction = next;
    dialog.hidden = next !== "dialog";
    move.hidden = next !== "portal" && next !== "climb";
    moveLabel.textContent = next === "climb" ? "오르기" : "이동";
    move.setAttribute(
      "aria-label",
      next === "climb" ? "줄 오르기" : "포탈로 이동",
    );
  };
  return {
    update,
    setInteractionAction,
    destroy(): void {
      resetJoystick();
      root.remove();
    },
  };
}
