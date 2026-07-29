export const HUD_PANEL_TOGGLE_EVENT = "kerning-shadows:hud-panel-toggle";

export type HudFloatingPanel = "miniMap" | "quest" | "controls";

interface HudPanelToggleDetail {
  panel: HudFloatingPanel;
  collapsed: boolean;
}

function controlFor(panel: HudFloatingPanel): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    `#hud-window-controls [data-hud-panel="${panel}"]`,
  );
}

function updateControl(button: HTMLButtonElement, collapsed: boolean): void {
  const label =
    button.dataset.hudPanel === "miniMap"
      ? "미니맵"
      : button.dataset.hudPanel === "quest"
        ? "퀘스트 알림"
        : "조작 안내";
  button.dataset.collapsed = String(collapsed);
  button.setAttribute("aria-expanded", String(!collapsed));
  button.setAttribute("aria-label", `${label} ${collapsed ? "펼치기" : "접기"}`);
  button.textContent = collapsed ? "+" : "−";
}

export function setupHudWindowControls(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>(
    "#hud-window-controls [data-hud-panel]",
  )) {
    button.addEventListener("click", () => {
      const panel = button.dataset.hudPanel as HudFloatingPanel;
      const collapsed = button.dataset.collapsed !== "true";
      updateControl(button, collapsed);
      window.dispatchEvent(
        new CustomEvent<HudPanelToggleDetail>(HUD_PANEL_TOGGLE_EVENT, {
          detail: { panel, collapsed },
        }),
      );
    });
  }
}

export function resetHudWindowControls(): void {
  for (const panel of ["miniMap", "quest", "controls"] as const) {
    const button = controlFor(panel);
    if (button) updateControl(button, false);
  }
}

export function setHudWindowControlVisible(
  panel: HudFloatingPanel,
  visible: boolean,
): void {
  const button = controlFor(panel);
  if (button) button.hidden = !visible;
}
