import { describe, expect, it, vi } from "vitest";
import { JuiceController } from "@/lib/gamekit/runtime/juice";
import {
  updateAdventure,
  type PhysicsCallbacks,
} from "@/lib/games/car-adventure/physics";
import {
  applyAdvanceLevel,
  createGameState,
  TILE,
} from "@/lib/games/car-adventure/types";

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

  it("兒童模式提供更寬鬆的跳躍高度", () => {
    const normal = createGameState(0, 3, false);
    const assisted = createGameState(0, 5, true);
    normal.player.onGround = true;
    assisted.player.onGround = true;
    normal.input.jump = true;
    assisted.input.jump = true;
    updateAdventure(normal, 1 / 60, makeFx());
    updateAdventure(assisted, 1 / 60, makeFx());
    expect(assisted.player.vy).toBeLessThan(normal.player.vy);
    expect(assisted.assist).toBe(true);
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

describe("car-adventure 可破壞磚（S2）", () => {
  /** 在空曠處放一顆可破壞磚於玩家正上方，回傳已定位的 state。 */
  function setupHeadbutt(): ReturnType<typeof createGameState> {
    const g = createGameState(0, 3);
    g.lv.breakable.add("3,4");
    const p = g.player;
    p.x = 3 * TILE + 3;
    p.y = 5 * TILE;
    p.vy = -400;
    p.onGround = false;
    return g;
  }

  it("頭頂由下往上撞碎：加分並記入 broken", () => {
    const g = setupHeadbutt();
    updateAdventure(g, 1 / 60, makeFx());
    expect(g.broken.has("3,4")).toBe(true);
    expect(g.score).toBe(50);
  });

  it("已撞碎的磚不再重複加分", () => {
    const g = setupHeadbutt();
    updateAdventure(g, 1 / 60, makeFx());
    const scoreAfterFirst = g.score;
    // 再次以相同姿勢撞同一格：已在 broken，不得再加分
    g.player.x = 3 * TILE + 3;
    g.player.y = 5 * TILE;
    g.player.vy = -400;
    updateAdventure(g, 1 / 60, makeFx());
    expect(g.score).toBe(scoreAfterFirst);
  });

  it("落下踩在可破壞磚上：著地、不撞碎", () => {
    const g = createGameState(0, 3);
    g.lv.breakable.add("3,6");
    const p = g.player;
    p.x = 3 * TILE + 3;
    p.y = 6 * TILE - p.h;
    p.vy = 300;
    p.onGround = false;
    updateAdventure(g, 1 / 60, makeFx());
    expect(g.broken.has("3,6")).toBe(false);
    expect(g.player.onGround).toBe(true);
  });

  it("推進關卡會清空 broken", () => {
    const g = createGameState(0, 3);
    g.broken.add("1,1");
    applyAdvanceLevel(g, 1);
    expect(g.broken.size).toBe(0);
  });

  it("非 reduced 的粒子路徑不拋錯且仍撞碎", () => {
    const g = setupHeadbutt();
    expect(() =>
      updateAdventure(g, 1 / 60, makeFx({ reduced: false })),
    ).not.toThrow();
    expect(g.broken.has("3,4")).toBe(true);
  });
});

describe("car-adventure 移動平台（S3）", () => {
  /** 在 level-01 的空曠格（tile 30 缺口、上方無地形）放一塊平台。 */
  function pushPlatform(
    g: ReturnType<typeof createGameState>,
    over: Partial<{ speed: number }> = {},
  ) {
    const pf = {
      x: 30 * TILE,
      y: 4 * TILE,
      x0: 30 * TILE,
      y0: 4 * TILE,
      w: 2 * TILE,
      h: 18,
      axis: "x" as const,
      range: 2 * TILE,
      speed: 120,
      dir: 1,
      ...over,
    };
    g.lv.movingPlatforms.push(pf);
    return pf;
  }

  it("站在水平移動平台上會被承載位移", () => {
    const g = createGameState(0, 3);
    const pf = pushPlatform(g);
    const p = g.player;
    p.x = 30 * TILE;
    p.y = 4 * TILE - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    const beforeX = p.x;
    updateAdventure(g, 1 / 60, makeFx({ reduced: false }));
    expect(pf.x).toBeGreaterThan(pf.x0);
    expect(p.x).toBeGreaterThan(beforeX);
    expect(p.onGround).toBe(true);
  });

  it("reduced 時平台靜止於起點、不橫向承載", () => {
    const g = createGameState(0, 3);
    const pf = pushPlatform(g);
    const p = g.player;
    p.x = 30 * TILE;
    p.y = 4 * TILE - p.h;
    p.vx = 0;
    p.vy = 0;
    p.onGround = true;
    const beforeX = p.x;
    updateAdventure(g, 1 / 60, makeFx({ reduced: true }));
    expect(pf.x).toBe(pf.x0);
    expect(p.x).toBe(beforeX);
  });

  it("落下會被平台接住（著地、不穿透）", () => {
    const g = createGameState(0, 3);
    pushPlatform(g, { speed: 0 });
    const p = g.player;
    p.x = 30 * TILE;
    p.y = 4 * TILE - p.h - 4;
    p.vx = 0;
    p.vy = 400;
    p.onGround = false;
    updateAdventure(g, 1 / 60, makeFx({ reduced: false }));
    expect(p.onGround).toBe(true);
    expect(p.y + p.h).toBeLessThanOrEqual(4 * TILE + 1);
  });
});

describe("car-adventure 敵人種類（S4）", () => {
  function pushEnemy(
    g: ReturnType<typeof createGameState>,
    over: Record<string, unknown> = {},
  ) {
    const e = {
      x: 30 * TILE,
      y: 4 * TILE,
      w: 30,
      h: 24,
      vx: 0,
      dir: -1 as number,
      alive: true,
      kind: "patrol" as "patrol" | "hopper" | "floater",
      vy: 0,
      baseY: 4 * TILE,
      t: 0,
      hopTimer: 0,
      ...over,
    };
    g.lv.enemies.push(e);
    return e;
  }

  /** 讓玩家從上方落向 tile 30 的敵人（貼近踩踏帶）。 */
  function dropOnto(g: ReturnType<typeof createGameState>) {
    const p = g.player;
    p.x = 30 * TILE;
    p.y = 4 * TILE;
    p.vx = 0;
    p.vy = 300;
    p.onGround = false;
  }

  it("patrol（預設）踩踏行為不變：踩死加 200", () => {
    const g = createGameState(0, 3);
    dropOnto(g);
    const e = pushEnemy(g, { y: 4 * TILE + 22, baseY: 4 * TILE + 22 });
    const before = g.score;
    updateAdventure(g, 1 / 60, makeFx());
    expect(e.alive).toBe(false);
    expect(g.score).toBe(before + 200);
  });

  it("hopper 可踩：踩死加 200", () => {
    const g = createGameState(0, 3);
    dropOnto(g);
    const e = pushEnemy(g, {
      kind: "hopper",
      y: 4 * TILE + 22,
      baseY: 4 * TILE + 22,
    });
    const before = g.score;
    updateAdventure(g, 1 / 60, makeFx());
    expect(e.alive).toBe(false);
    expect(g.score).toBe(before + 200);
  });

  it("floater 不可踩：落在其上仍受傷、敵人存活", () => {
    const g = createGameState(0, 3);
    dropOnto(g);
    const e = pushEnemy(g, {
      kind: "floater",
      y: 4 * TILE + 22,
      baseY: 4 * TILE + 22,
    });
    updateAdventure(g, 1 / 60, makeFx());
    expect(e.alive).toBe(true);
    expect(g.lives).toBe(2);
  });

  it("hopper 落地後會彈起（vy<0）", () => {
    const g = createGameState(0, 3);
    g.player.x = 85 * TILE;
    const e = pushEnemy(g, {
      kind: "hopper",
      x: 5 * TILE + 3,
      y: 9 * TILE + 12,
      baseY: 9 * TILE + 12,
      hopTimer: 0,
    });
    updateAdventure(g, 1 / 60, makeFx());
    expect(e.vy).toBeLessThan(0);
  });
});
