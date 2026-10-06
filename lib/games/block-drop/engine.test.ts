import { describe, expect, it } from "vitest";
import {
  beginGame,
  finishClear,
  freeModeConfig,
  freshGame,
  hardDrop,
  holdPiece,
  move,
  rotate,
  softStep,
  tick,
  type EngineConfig,
  type EngineContext,
  type GameState,
} from "./engine";
import { emptyBoard, spawnX, type Board, type PieceType } from "./pieces";
import { seededRng } from "./rng";
import { CLEAR_ANIM_MS, LOCK_RESET_LIMIT, gravityMs } from "./scoring";

function ctxFor(config: EngineConfig, seed = 1): EngineContext {
  return { config, rng: seededRng(seed), events: [] };
}

function startWith(g: GameState, ctx: EngineContext, type: PieceType): void {
  g.status = "playing";
  g.bag = [type, "O", "O", "O", "O", "O", "O", "O", "O"];
  g.active = null;
  // 直接生成指定方塊（不經 refill 打亂）
  g.active = { type, rot: 0, x: spawnX(g.board[0]!.length), y: 0 };
  g.bag.shift();
  ctx.events = [];
}

const relaxed = () => freeModeConfig("relaxed", false);

describe("自由堆疊數值（原樣搬自 View）", () => {
  it("重力：(軟降 45 或 max(70, 800−70×(Lv−1))) × 難度倍率", () => {
    expect(freeModeConfig("relaxed", false).gravityInterval(1, false)).toBeCloseTo(800 * 1.35);
    expect(freeModeConfig("standard", false).gravityInterval(5, false)).toBe(gravityMs(5));
    expect(freeModeConfig("challenge", false).gravityInterval(1, true)).toBeCloseTo(45 * 0.82);
    expect(gravityMs(20)).toBe(70);
    expect(freeModeConfig("relaxed", false).lockDelayMs).toBe(620);
    expect(freeModeConfig("standard", false).lockDelayMs).toBe(450);
    expect(freeModeConfig("challenge", false).lockDelayMs).toBe(360);
  });

  it("7-bag：固定 seed 結果可重現，每 7 塊各出現一次", () => {
    const a = freshGame();
    const b = freshGame();
    beginGame(a, ctxFor(relaxed(), 42));
    beginGame(b, ctxFor(relaxed(), 42));
    expect([a.active!.type, ...a.bag]).toEqual([b.active!.type, ...b.bag]);
    expect(new Set([a.active!.type, ...a.bag.slice(0, 6)]).size).toBe(7);
  });
});

describe("重力與鎖定（注入時鐘）", () => {
  it("累積滿一格的時間才下降一格", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    startWith(g, ctx, "T");
    const interval = relaxed().gravityInterval(1, false);
    tick(g, ctx, interval - 1, 0);
    expect(g.active!.y).toBe(0);
    tick(g, ctx, 1, 0);
    expect(g.active!.y).toBe(1);
  });

  it("落地後經過鎖定延遲才鎖定；移動重置計時最多 15 次", () => {
    const g = freshGame();
    const ctx = ctxFor(freeModeConfig("standard", false));
    startWith(g, ctx, "O");
    while (softStep(g));
    tick(g, ctx, 1, 0);
    expect(g.grounded).toBe(true);
    for (let i = 0; i < LOCK_RESET_LIMIT; i++) {
      tick(g, ctx, 400, 0);
      move(g, ctx, i % 2 === 0 ? 1 : -1);
    }
    expect(g.resets).toBe(LOCK_RESET_LIMIT);
    expect(g.pieces).toBe(0);
    // 超過上限後移動不再重置計時：400 + 50 ≥ 450 就鎖定
    tick(g, ctx, 400, 0);
    move(g, ctx, 1);
    expect(g.pieces).toBe(0);
    tick(g, ctx, 50, 0);
    expect(g.pieces).toBe(1);
  });

  it("autoFall 關閉時不自動落下，按住往下才落", () => {
    const g = freshGame(8, 14);
    const ctx = ctxFor({ ...relaxed(), autoFall: false });
    startWith(g, ctx, "O");
    tick(g, ctx, 5000, 0);
    expect(g.active!.y).toBe(0);
    g.softDrop = true;
    tick(g, ctx, 200, 0);
    expect(g.active!.y).toBeGreaterThan(0);
  });

  it("測試掛鉤 frozen：只推進消排動畫，不累積重力", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    startWith(g, ctx, "T");
    tick(g, ctx, 100000, 0, true);
    expect(g.active!.y).toBe(0);
  });
});

function fillRow(board: Board, y: number, gapCols: number[]): void {
  board[y] = board[y]!.map((_, x) => (gapCols.includes(x) ? null : "Z"));
}

describe("消排、計分與升級", () => {
  it("硬降每格 2 分；消 1 排 100×Lv；全清加分；動畫後才結算", () => {
    const g = freshGame();
    const ctx = ctxFor(freeModeConfig("standard", true));
    fillRow(g.board, 19, [0, 1, 2, 3]);
    startWith(g, ctx, "I");
    move(g, ctx, -3);
    hardDrop(g, ctx, 1000);
    expect(g.clearing).toBe(true);
    // I 的 rot0 佔方塊框第 1 列：從 y=0 落到 y=18，共 18 格
    expect(g.score).toBe(18 * 2);
    tick(g, ctx, 16, 1000 + CLEAR_ANIM_MS - 1);
    expect(g.lines).toBe(0);
    tick(g, ctx, 16, 1000 + CLEAR_ANIM_MS);
    expect(g.lines).toBe(1);
    expect(g.score).toBe(36 + 100 + 1000);
    expect(ctx.events.some((e) => e.type === "perfectClear")).toBe(true);
    expect(g.combo).toBe(1);
  });

  it("每 10 排升一級（任務冒險關閉升級）", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    g.lines = 9;
    g.status = "playing";
    g.clearing = true;
    g.clearRows = [19];
    fillRow(g.board, 19, []);
    g.board[18]![0] = "T";
    finishClear(g, ctx);
    expect(g.level).toBe(2);
    const stage = freshGame();
    const stageCtx = ctxFor({ ...relaxed(), levelUp: false });
    stage.lines = 9;
    stage.status = "playing";
    stage.clearing = true;
    stage.clearRows = [19];
    fillRow(stage.board, 19, []);
    finishClear(stage, stageCtx);
    expect(stage.level).toBe(1);
  });
});

describe("連擊與彩虹", () => {
  it("連續消排：連擊加分 50×(連擊−1)×Lv，彩虹模式再加 120×連擊×排數", () => {
    const g = freshGame();
    const ctx = ctxFor(freeModeConfig("standard", true));
    g.status = "playing";
    g.combo = 1;
    g.clearing = true;
    g.clearRows = [19];
    fillRow(g.board, 19, []);
    g.board[18]![0] = "T";
    finishClear(g, ctx);
    expect(g.combo).toBe(2);
    expect(g.score).toBe(100 + 50 + 240);
    expect(ctx.events.map((e) => e.type)).toEqual(
      expect.arrayContaining(["cleared", "comboBonus", "rainbowBonus"]),
    );
  });
});

describe("到頂與救援", () => {
  it("輕鬆難度救援 1 次（清上方 4 列），再到頂就結束且只回報一次", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    for (let y = 0; y < 20; y++) fillRow(g.board, y, [9]);
    g.status = "playing";
    g.active = { type: "O", rot: 0, x: 3, y: 0 };
    hardDrop(g, ctx, 0);
    expect(g.rescues).toBe(1);
    expect(g.board.slice(0, 4).every((row) => row.every((c) => c === null))).toBe(true);
    expect(g.status).toBe("playing");
    for (let y = 0; y < 4; y++) fillRow(g.board, y, [9]);
    g.active = { type: "O", rot: 0, x: 3, y: -1 };
    hardDrop(g, ctx, 0);
    expect(g.status).toBe("over");
    const overs = ctx.events.filter((e) => e.type === "gameOver");
    expect(overs).toHaveLength(1);
    expect(overs[0]).toMatchObject({ reason: "topout", report: true });
  });

  it("任務冒險救援清掉石頭以上的玩家方塊，石頭不動", () => {
    const g = freshGame(8, 14);
    const ctx = ctxFor({ ...relaxed(), rescueKind: "halfStack", rescueLimit: 2 });
    g.board[13] = ["X", "X", "X", null, "X", "X", "X", "X"];
    for (let y = 1; y < 13; y++) g.board[y] = ["T", "T", "T", "T", "T", "T", null, "T"];
    g.status = "playing";
    g.active = { type: "O", rot: 0, x: 2, y: -1 };
    hardDrop(g, ctx, 0);
    expect(g.rescues).toBe(1);
    expect(g.board[13]).toEqual(["X", "X", "X", null, "X", "X", "X", "X"]);
    expect(g.board.slice(0, 13).every((row) => row.every((c) => c === null))).toBe(true);
  });
});

describe("暫存與旋轉", () => {
  it("暫存後同一塊不能再暫存；換回時從出生位置開始", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    beginGame(g, ctx);
    const first = g.active!.type;
    expect(holdPiece(g, ctx)).toBe(true);
    expect(g.hold).toBe(first);
    expect(holdPiece(g, ctx)).toBe(false);
    hardDrop(g, ctx, 0);
    if (g.clearing) tick(g, ctx, 16, CLEAR_ANIM_MS);
    expect(holdPiece(g, ctx)).toBe(true);
    expect(g.active).toMatchObject({ type: first, rot: 0, x: 3, y: 0 });
  });

  it("暫存關閉（任務冒險前幾站）時無作用", () => {
    const g = freshGame(8, 14);
    const ctx = ctxFor({ ...relaxed(), holdEnabled: false });
    beginGame(g, ctx);
    expect(holdPiece(g, ctx)).toBe(false);
    expect(g.hold).toBeNull();
  });

  it("靠牆旋轉會踢牆", () => {
    const g = freshGame();
    const ctx = ctxFor(relaxed());
    startWith(g, ctx, "I");
    rotate(g, ctx, 1);
    while (move(g, ctx, 1));
    expect(rotate(g, ctx, 1)).toBe(true);
    expect(g.active!.x + 3).toBeLessThan(10);
  });
});

describe("任務冒險判定順序", () => {
  const stageConfig = (over: Partial<EngineConfig>): EngineConfig => ({
    ...relaxed(),
    levelUp: false,
    rescueKind: "halfStack",
    rescueLimit: 2,
    isComplete: (g) => g.lines >= 1,
    ...over,
  });

  it("最後一塊同時完成任務與用完塊數：過關優先", () => {
    const g = freshGame(8, 14, emptyBoard(8, 14));
    const ctx = ctxFor(stageConfig({ pieceCap: 1 }));
    fillRow(g.board, 13, [2, 3, 4, 5]);
    startWith(g, ctx, "I");
    hardDrop(g, ctx, 0);
    tick(g, ctx, 16, CLEAR_ANIM_MS);
    expect(g.status).toBe("won");
    expect(ctx.events.some((e) => e.type === "won")).toBe(true);
  });

  it("沒完成就用完塊數：結束（outOfPieces）", () => {
    const g = freshGame(8, 14);
    const ctx = ctxFor(stageConfig({ pieceCap: 1 }));
    startWith(g, ctx, "O");
    hardDrop(g, ctx, 0);
    expect(g.status).toBe("over");
    expect(g.overReason).toBe("outOfPieces");
  });

  it("盤面越過危險線記一次 crossedLine", () => {
    const g = freshGame(8, 14);
    const ctx = ctxFor(stageConfig({ dangerRow: 3 }));
    for (let y = 3; y < 14; y++) fillRow(g.board, y, [0, 1]);
    startWith(g, ctx, "O");
    move(g, ctx, -2);
    hardDrop(g, ctx, 0);
    expect(g.crossedLine).toBe(true);
    expect(ctx.events.filter((e) => e.type === "crossedLine")).toHaveLength(1);
  });
});
