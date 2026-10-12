import { describe, expect, it, vi } from "vitest";
import { SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import { createRound, roundReducer, type RoundAction, type RoundState } from "@/lib/games/dino-sushi/round";
import { hintTarget, playVoices } from "./useDinoSushiPlay";

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
