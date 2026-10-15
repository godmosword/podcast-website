import { describe, expect, it, vi } from "vitest";
import { SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import { createRound, roundReducer, type RoundAction, type RoundState } from "@/lib/games/dino-sushi/round";
import { toppingById } from "@/lib/games/dino-sushi/toppings";
import { hintTarget, IDLE_HINT_MS, isOffStep, playVoices } from "./useDinoSushiPlay";

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

  it("料位塞滿錯的料：直接指缺的料，點下去會擠掉最舊那層", () => {
    const start = createRound("order", 7);
    const order = start.orders[0]!;
    const full = run(start, [
      { type: "pick-base", base: order.base },
      { type: "add", id: "wasabi" },
      { type: "add", id: "wasabi" },
      { type: "add", id: "wasabi" },
    ]);
    expect(hintTarget(full)).toEqual({ kind: "topping", id: order.toppings[0] });
    const swapped = roundReducer(full, { type: "add", id: order.toppings[0]! });
    expect(swapped.sushi.toppings).toEqual(["wasabi", "wasabi", order.toppings[0]]);
    expect(isOffStep(full, { type: "add", id: order.toppings[0]! })).toBe(false);
  });

  it("重複的料：最舊那層後面還有一樣的，擠掉也不缺，直接指缺的料", () => {
    const start = createRound("order", 7);
    const s0 = { ...start, index: 2 };
    const order = start.orders[2]!;
    const wanted = order.toppings[0]!;
    const full = run(s0, [
      { type: "pick-base", base: order.base },
      { type: "add", id: wanted },
      { type: "add", id: wanted },
      { type: "add", id: wanted },
    ]);
    expect(hintTarget(full)).toEqual({ kind: "topping", id: order.toppings[1] });
  });

  it("料位滿了、最舊那層是單上要的：先指要拿掉的那一格，點別的料算偏", () => {
    const start = createRound("order", 7);
    const s0 = { ...start, index: 2 };
    const order = start.orders[2]!;
    const [first, second] = order.toppings;
    const sweet = start.tray.find((id) => toppingById(id).kind === "sweet")!;
    const full = run(s0, [
      { type: "pick-base", base: order.base },
      { type: "add", id: first! },
      { type: "add", id: "wasabi" },
      { type: "add", id: "wasabi" },
    ]);
    expect(hintTarget(full)).toEqual({ kind: "remove", slot: 1 });
    // 不管放的是缺的料還是彩蛋，都會把單上要的那層擠掉
    expect(isOffStep(full, { type: "add", id: second! })).toBe(true);
    expect(isOffStep(full, { type: "add", id: sweet })).toBe(true);
    const removed = roundReducer(full, { type: "remove", slot: 1 });
    expect(hintTarget(removed)).toEqual({ kind: "topping", id: second });
  });

  it("反應播放中與自由做不給提示", () => {
    const free = createRound("free", 7);
    expect(hintTarget(free)).toBeNull();
    const order = createRound("order", 7);
    const pending = run(order, [{ type: "pick-base", base: "nigiri" }, { type: "serve" }]);
    expect(hintTarget(pending)).toBeNull();
  });
});

describe("無錯誤提示", () => {
  it("閒置亮提示的等待是 4.5 秒", () => {
    expect(IDLE_HINT_MS).toBe(4500);
  });

  it("點錯飯型、點到訂單沒有的家常料，算偏離；訂單裡還沒放的另一樣、芥末與甜點都不算", () => {
    const start = createRound("order", 7);
    const order = start.orders[0]!;
    const wrongBase = order.base === "nigiri" ? "temaki" : "nigiri";
    expect(isOffStep(start, { type: "pick-base", base: wrongBase })).toBe(true);
    expect(isOffStep(start, { type: "pick-base", base: order.base })).toBe(false);

    const based = roundReducer(start, { type: "pick-base", base: order.base });
    const offOrder = start.tray.find((id) => toppingById(id).kind === "savory" && !order.toppings.includes(id))!;
    const sweet = start.tray.find((id) => toppingById(id).kind === "sweet")!;
    expect(isOffStep(based, { type: "add", id: offOrder })).toBe(true);
    expect(isOffStep(based, { type: "add", id: "wasabi" })).toBe(false);
    expect(isOffStep(based, { type: "add", id: sweet })).toBe(false);
    expect(isOffStep(based, { type: "add", id: order.toppings[0]! })).toBe(false);
    if (order.toppings.length > 1) {
      expect(isOffStep(based, { type: "add", id: order.toppings[1]! })).toBe(false);
    }

    const withExtra = roundReducer(based, { type: "add", id: "wasabi" });
    expect(hintTarget(withExtra)).toEqual({ kind: "topping", id: order.toppings[0] });
  });

  it("飯型還沒對的時候加料，下一步仍是換對的飯", () => {
    const start = createRound("order", 7);
    const order = start.orders[0]!;
    const wrongBase = order.base === "nigiri" ? "temaki" : "nigiri";
    const picked = roundReducer(start, { type: "pick-base", base: wrongBase });
    expect(isOffStep(picked, { type: "add", id: order.toppings[0]! })).toBe(true);
    // 飯型錯了也一樣：芥末是彩蛋，不算偏
    expect(isOffStep(picked, { type: "add", id: "wasabi" })).toBe(false);
    expect(hintTarget(picked)).toEqual({ kind: "base", id: order.base });
  });

  it("自由做沒有偏離", () => {
    const free = createRound("free", 7);
    const picked = roundReducer(free, { type: "pick-base", base: "nigiri" });
    expect(isOffStep(picked, { type: "add", id: "wasabi" })).toBe(false);
    expect(hintTarget(picked)).toBeNull();
  });
});

describe("playVoices", () => {
  it("有 voices 時整組交給 audio bus", () => {
    const audio = { ensureAudio: vi.fn(), tone: vi.fn(), voices: vi.fn() };
    playVoices(audio, SUSHI_SFX.serve);
    expect(audio.voices).toHaveBeenCalledWith(SUSHI_SFX.serve);
    expect(audio.tone).not.toHaveBeenCalled();
  });

  it("只有 tone 的 audio bus：只播第一個振盪器音，不播噪音", () => {
    const audio = { ensureAudio: vi.fn(), tone: vi.fn() };
    playVoices(audio, SUSHI_SFX.base);
    expect(audio.tone).toHaveBeenCalledTimes(1);
    const first = SUSHI_SFX.base[0]!;
    expect(audio.tone).toHaveBeenCalledWith(first.freq, first.dur, first.wave, first.vol);
  });

  it("沒有 audio bus 時安靜不出錯", () => {
    expect(() => playVoices(undefined, SUSHI_SFX.fanfare)).not.toThrow();
  });
});
