import {
  DEFAULT_INPUT_BINDINGS,
  actionForCode,
  type GameAction,
  type InputBindings,
} from "./actions";
import { InputState } from "./input-state";

interface KeyboardEventLike {
  code: string;
  repeat: boolean;
  target: EventTarget | null;
  preventDefault(): void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== "object") {
    return false;
  }

  const element = target as EventTarget & {
    tagName?: unknown;
    isContentEditable?: unknown;
  };
  const tagName = typeof element.tagName === "string" ? element.tagName.toLowerCase() : "";
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    element.isContentEditable === true
  );
}

export function shouldCaptureGameKey(
  code: string,
  target: EventTarget | null,
  canvasFocused: boolean,
  bindings: InputBindings = DEFAULT_INPUT_BINDINGS,
): boolean {
  return canvasFocused && !isEditableTarget(target) && actionForCode(code, bindings) !== undefined;
}

export class InputController {
  readonly state = new InputState();

  private bindings: InputBindings;
  private readonly canvas: HTMLCanvasElement;

  constructor(
    canvas: HTMLCanvasElement,
    bindings: InputBindings = DEFAULT_INPUT_BINDINGS,
  ) {
    this.canvas = canvas;
    this.bindings = bindings;
    this.canvas.tabIndex = 0;

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.reset);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.addEventListener("pointerdown", this.focusCanvas);
  }

  isDown(action: GameAction): boolean {
    return this.state.isDown(action);
  }

  consumePressed(action: GameAction): boolean {
    return this.state.consumePressed(action);
  }

  pressVirtual(action: GameAction, source: string): void {
    this.state.press(action, false, source);
  }

  releaseVirtual(action: GameAction, source: string): void {
    this.state.release(action, source);
  }

  resetState(): void {
    this.state.reset();
  }

  setBindings(bindings: InputBindings): void {
    this.state.reset();
    this.bindings = bindings;
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.reset);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.canvas.removeEventListener("pointerdown", this.focusCanvas);
    this.state.reset();
  }

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    this.processKeyDown(event);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const action = actionForCode(event.code, this.bindings);
    if (!action) {
      return;
    }

    if (shouldCaptureGameKey(event.code, event.target, this.hasCanvasFocus(), this.bindings)) {
      event.preventDefault();
    }
    this.state.release(action, event.code);
  };

  processKeyDown(event: KeyboardEventLike): void {
    const action = actionForCode(event.code, this.bindings);
    if (!action || !shouldCaptureGameKey(event.code, event.target, this.hasCanvasFocus(), this.bindings)) {
      return;
    }

    event.preventDefault();
    this.state.press(action, event.repeat, event.code);
  }

  private hasCanvasFocus(): boolean {
    return document.activeElement === this.canvas;
  }

  private readonly focusCanvas = (): void => {
    this.canvas.focus({ preventScroll: true });
  };

  private readonly reset = (): void => {
    this.state.reset();
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) {
      this.state.reset();
    }
  };
}
