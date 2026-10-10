import { describe, expect, it } from "vitest";
import { createRound, roundReducer, type RoundAction, type RoundState } from "@/lib/games/dino-sushi/round";
import { hintTarget } from "./useDinoSushiPlay";

function run(state: RoundState, actions: RoundAction[]): RoundState {
  return actions.reduce(roundReducer, state);
}

describe("點餐提示指向下一步", () => {
  it("先指飯型，再指缺的料，齊了指送出", () => {
    const start = createRound("order", 7);
    const order = start.orders[0]!;
    expect(hintTarget(start)).toEqual({ kind: "base", id: order.base });
    const based = roundReducer(start, { type: "pick-base", base: order.base });
    expect(hintTarget(based)).toEqual({ kind: "topping", id: order.toppings[0] });
    const done = run(based, order.toppings.map((id) => ({ type: "add", id }) as const));
    expect(hintTarget(done)).toEqual({ kind: "serve" });
  });

  it("料位塞滿錯的料：改指要拿掉的那一格，不會卡住", () => {
    const start = createRound("order", 7);
    const order = start.orders[0]!;
    const full = run(start, [
      { type: "pick-base", base: order.base },
      { type: "add", id: "wasabi" },
      { type: "add", id: "wasabi" },
      { type: "add", id: "wasabi" },
    ]);
    expect(hintTarget(full)).toEqual({ kind: "remove", slot: 0 });
  });

  it("重複的料也算多的：拿掉第二個重複", () => {
    const start = createRound("order", 7);
    const order = start.orders[2]!;
    const s0 = { ...start, index: 2 };
    const wanted = order.toppings[0]!;
    const full = run(s0, [
      { type: "pick-base", base: order.base },
      { type: "add", id: wanted },
      { type: "add", id: wanted },
      { type: "add", id: wanted },
    ]);
    expect(hintTarget(full)).toEqual({ kind: "remove", slot: 1 });
  });

  it("反應播放中與自由做不給提示", () => {
    const free = createRound("free", 7);
    expect(hintTarget(free)).toBeNull();
    const order = createRound("order", 7);
    const pending = run(order, [{ type: "pick-base", base: "nigiri" }, { type: "serve" }]);
    expect(hintTarget(pending)).toBeNull();
  });
});
