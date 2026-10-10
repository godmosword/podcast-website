import { describe, expect, it } from "vitest";
import { ORDERS_PER_ROUND } from "./orders";
import { createRound, roundReducer, type RoundAction, type RoundState } from "./round";

function run(state: RoundState, actions: RoundAction[]): RoundState {
  return actions.reduce(roundReducer, state);
}

/** 照訂單做一盤並吃完。 */
function serveCurrentOrder(state: RoundState): RoundState {
  const order = state.orders[state.index]!;
  return run(state, [
    { type: "pick-base", base: order.base },
    ...order.toppings.map((id) => ({ type: "add", id }) as const),
    { type: "serve" },
    { type: "reaction-done" },
  ]);
}

describe("點餐一輪", () => {
  it("開局：5 單、托盤 8 格、砧板空", () => {
    const s = createRound("order", 5);
    expect(s.orders).toHaveLength(ORDERS_PER_ROUND);
    expect(s.tray).toHaveLength(8);
    expect(s.sushi).toEqual({ base: null, toppings: [] });
    expect(s.done).toBe(false);
  });

  it("5 單都一次做對：金邊盤 5 個、全部 firstTry", () => {
    let s = createRound("order", 9);
    for (let i = 0; i < ORDERS_PER_ROUND; i++) s = serveCurrentOrder(s);
    expect(s.done).toBe(true);
    expect(s.plates).toHaveLength(5);
    expect(s.plates.every((p) => p.gold)).toBe(true);
    expect(s.firstTries).toEqual([true, true, true, true, true]);
  });

  it("料不齊送出：不吃、壽司留在砧板、補一樣就好；這單不再是一次做對", () => {
    const start = createRound("order", 21);
    const order = start.orders[0]!;
    let s = run(start, [{ type: "pick-base", base: order.base }, { type: "serve" }]);
    expect(s.pending).toMatchObject({ mood: "look", eats: false });
    s = roundReducer(s, { type: "reaction-done" });
    expect(s.sushi.base).toBe(order.base);
    expect(s.plates).toHaveLength(0);
    expect(s.index).toBe(0);
    s = run(s, [
      ...order.toppings.map((id) => ({ type: "add", id }) as const),
      { type: "serve" },
      { type: "reaction-done" },
    ]);
    expect(s.index).toBe(1);
    expect(s.firstTries).toEqual([false]);
    expect(s.plates[0]).toMatchObject({ gold: false });
    expect(s.sushi).toEqual({ base: null, toppings: [] });
  });

  it("反應播放中鎖輸入", () => {
    const start = createRound("order", 4);
    const order = start.orders[0]!;
    const s = run(start, [
      { type: "pick-base", base: order.base },
      ...order.toppings.map((id) => ({ type: "add", id }) as const),
      { type: "serve" },
    ]);
    expect(s.pending).not.toBeNull();
    for (const a of [
      { type: "add", id: "corn" },
      { type: "remove", slot: 0 },
      { type: "pick-base", base: "temaki" },
      { type: "serve" },
    ] as const) {
      expect(roundReducer(s, a)).toBe(s);
    }
  });

  it("還沒選飯不能送出；第 4 料不改 state", () => {
    const start = createRound("order", 2);
    expect(roundReducer(start, { type: "serve" })).toBe(start);
    const full = run(start, [
      { type: "pick-base", base: "nigiri" },
      { type: "add", id: start.tray[0]! },
      { type: "add", id: start.tray[1]! },
      { type: "add", id: start.tray[2]! },
    ]);
    expect(roundReducer(full, { type: "add", id: start.tray[3]! })).toBe(full);
  });

  it("托盤以外的料不能加", () => {
    const start = createRound("order", 2);
    const base = roundReducer(start, { type: "pick-base", base: "nigiri" });
    const outside = ["tamago", "shrimp", "crab", "corn", "cucumber", "tuna", "floss", "salmon", "avocado"].find(
      (id) => !start.tray.includes(id as never),
    );
    expect(outside).toBeDefined();
    expect(roundReducer(base, { type: "add", id: outside as never })).toBe(base);
  });
});

describe("刷牙彩蛋", () => {
  it("反應播完還能刷；送下一盤就收起", () => {
    const start = createRound("free", 6);
    const sweet = start.tray.find((id) => id === "strawberry" || id === "pudding")!;
    let s = run(start, [
      { type: "pick-base", base: "gunkan" },
      { type: "add", id: sweet },
      { type: "serve" },
      { type: "reaction-done" },
    ]);
    expect(s.brushReady).toBe(true);
    s = run(s, [{ type: "pick-base", base: "nigiri" }, { type: "serve" }]);
    expect(s.brushReady).toBe(false);
    s = roundReducer(s, { type: "reaction-done" });
    expect(roundReducer(s, { type: "brush" })).toBe(s);
  });

  it("吃到甜點才能刷，一輪最多一次", () => {
    const start = createRound("free", 6);
    const sweet = start.tray.find((id) => id === "strawberry" || id === "pudding")!;
    expect(roundReducer(start, { type: "brush" })).toBe(start);
    let s = run(start, [
      { type: "pick-base", base: "gunkan" },
      { type: "add", id: sweet },
      { type: "serve" },
    ]);
    expect(s.pending?.brush).toBe(true);
    s = roundReducer(s, { type: "brush" });
    expect(s.brushUsed).toBe(true);
    s = run(s, [
      { type: "reaction-done" },
      { type: "pick-base", base: "gunkan" },
      { type: "add", id: sweet },
      { type: "serve" },
    ]);
    expect(s.pending?.brush).toBe(false);
    expect(roundReducer(s, { type: "brush" })).toBe(s);
  });
});

describe("自由做", () => {
  it("沒有訂單；只有白飯也能送；按「多多吃飽了」才結束", () => {
    let s = createRound("free", 3);
    expect(s.orders).toEqual([]);
    s = run(s, [{ type: "pick-base", base: "temaki" }, { type: "serve" }]);
    expect(s.pending).toMatchObject({ eats: true });
    s = roundReducer(s, { type: "reaction-done" });
    expect(s.plates).toHaveLength(1);
    expect(s.plates[0]!.gold).toBe(false);
    expect(s.done).toBe(false);
    s = roundReducer(s, { type: "finish" });
    expect(s.done).toBe(true);
  });

  it("點餐模式不能用「吃飽了」提早結束", () => {
    const s = createRound("order", 3);
    expect(roundReducer(s, { type: "finish" })).toBe(s);
  });
});
