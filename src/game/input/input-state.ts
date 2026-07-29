import type { GameAction } from "./actions";

export class InputState {
  private readonly down = new Set<GameAction>();
  private readonly pressed = new Set<GameAction>();
  private readonly sources = new Map<GameAction, Set<string>>();

  press(action: GameAction, repeated = false, source: string = action): void {
    const actionSources = this.sources.get(action) ?? new Set<string>();
    const wasDown = actionSources.size > 0;
    actionSources.add(source);
    this.sources.set(action, actionSources);

    if (!repeated && !wasDown) {
      this.pressed.add(action);
    }
    this.down.add(action);
  }

  release(action: GameAction, source: string = action): void {
    const actionSources = this.sources.get(action);
    actionSources?.delete(source);
    if (!actionSources || actionSources.size === 0) {
      this.sources.delete(action);
      this.down.delete(action);
    }
  }

  isDown(action: GameAction): boolean {
    return this.down.has(action);
  }

  consumePressed(action: GameAction): boolean {
    const wasPressed = this.pressed.has(action);
    this.pressed.delete(action);
    return wasPressed;
  }

  reset(): void {
    this.down.clear();
    this.pressed.clear();
    this.sources.clear();
  }
}
