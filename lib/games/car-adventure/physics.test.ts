import { describe, expect, it, vi } from "vitest";
import { JuiceController } from "@/lib/gamekit/runtime/juice";
import {
  updateAdventure,
  type PhysicsCallbacks,
} from "@/lib/games/car-adventure/physics";
import { createGameState } from "@/lib/games/car-adventure/types";

function makeFx(
  overrides: Partial<PhysicsCallbacks> = {},
): PhysicsCallbacks {
  return {
    reduced: true,
    juice: new JuiceController(),
    levelStartLives: 3,
    onJump: vi.fn(),
    onCoin: vi.fn(),
    onStomp: vi.fn(),
    onHurt: vi.fn(),
    onWin: vi.fn(),
    setStatus: vi.fn(),
    onAdvanceLevel: vi.fn(),
    ...overrides,
  };
}

describe("car-adventure physics", () => {
  it("createGameState 套用起始生命與關卡起點", () => {
    const g = createGameState(0, 5);
    expect(g.lives).toBe(5);
    expect(g.levelIndex).toBe(0);
    expect(g.player.x).toBe(g.lv.start.x);
    expect(g.player.y).toBe(g.lv.start.y);
    expect(g.score).toBe(0);
  });

  it("落地時跳躍會觸發 onJump 並給向上速度", () => {
    const g = createGameState(0, 3);
    g.player.onGround = true;
    g.input.jump = true;
    const callbacks = makeFx();
    updateAdventure(g, 1 / 60, callbacks);
    expect(callbacks.onJump).toHaveBeenCalled();
    expect(g.player.vy).toBeLessThan(0);
  });

  it("掉出世界底部會扣命並觸發 onHurt", () => {
    const g = createGameState(0, 3);
    g.player.y = g.lv.worldH + 200;
    const callbacks = makeFx();
    updateAdventure(g, 1 / 60, callbacks);
    expect(callbacks.onHurt).toHaveBeenCalled();
    expect(g.lives).toBe(2);
  });
});
