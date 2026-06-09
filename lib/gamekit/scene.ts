import type { GameSceneId } from "./types";

export type SceneContext = {
  scene: GameSceneId;
  data?: Record<string, unknown>;
};

export type SceneHandler = {
  enter?: (ctx: SceneContext) => void;
  exit?: () => void;
  update?: (dt: number) => void;
  render?: (alpha: number) => void;
};

/**
 * 場景堆疊 stub：title → menu → play → pause → result。
 * Phase 7 接各款完整外框。
 */
export class SceneManager {
  private stack: GameSceneId[] = ["title"];
  private handlers = new Map<GameSceneId, SceneHandler>();

  register(scene: GameSceneId, handler: SceneHandler): void {
    this.handlers.set(scene, handler);
  }

  get current(): GameSceneId {
    return this.stack[this.stack.length - 1] ?? "title";
  }

  push(scene: GameSceneId, data?: Record<string, unknown>): void {
    this.handlers.get(this.current)?.exit?.();
    this.stack.push(scene);
    this.handlers.get(scene)?.enter?.({ scene, data });
  }

  pop(): GameSceneId | null {
    if (this.stack.length <= 1) return null;
    this.handlers.get(this.current)?.exit?.();
    this.stack.pop();
    const next = this.current;
    this.handlers.get(next)?.enter?.({ scene: next });
    return next;
  }

  replace(scene: GameSceneId, data?: Record<string, unknown>): void {
    this.handlers.get(this.current)?.exit?.();
    this.stack[this.stack.length - 1] = scene;
    this.handlers.get(scene)?.enter?.({ scene, data });
  }

  update(dt: number): void {
    this.handlers.get(this.current)?.update?.(dt);
  }

  render(alpha: number): void {
    this.handlers.get(this.current)?.render?.(alpha);
  }
}
