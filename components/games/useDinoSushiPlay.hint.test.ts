// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { SynthVoice } from "@/lib/gamekit/runtime/audio";
import { EVICT_POP_DELAY, SUSHI_SFX } from "@/lib/games/dino-sushi/sfx";
import { toppingById, type ToppingId } from "@/lib/games/dino-sushi/toppings";
import { IDLE_HINT_MS, useDinoSushiPlay } from "./useDinoSushiPlay";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, "__dinoSushiSeed");
});

function setup() {
  vi.useFakeTimers();
  (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  return renderHook(
    ({ inputPaused }: { inputPaused: boolean }) =>
      useDinoSushiPlay({
        reducedMotion: true,
        inputPaused,
        onServed: vi.fn(),
        onDone: vi.fn(),
      }),
    { initialProps: { inputPaused: false } },
  );
}

type Play = ReturnType<typeof setup>["result"];

/** 照單做完第一單送出，等反應播完（減少動態：1.1 秒），停在第二單剛出現。 */
function finishFirstOrder(result: Play) {
  act(() => result.current.actions.start("order"));
  const first = result.current.round!.orders[0]!;
  act(() => result.current.actions.pickBase(first.base));
  for (const id of first.toppings) act(() => result.current.actions.add(id));
  act(() => result.current.actions.serve());
  act(() => {
    vi.advanceTimersByTime(1100);
  });
  expect(result.current.round!.index).toBe(1);
}

/** 托盤上、這一單沒點的家常料（點了算偏）。 */
function offOrderSavory(result: Play): ToppingId {
  const round = result.current.round!;
  const order = round.orders[round.index]!;
  return round.tray.find((id) => toppingById(id).kind === "savory" && !order.toppings.includes(id))!;
}

describe("點偏了立刻亮下一步", () => {
  it("教完第一單之後，點錯的料會亮正確的下一格，不出現錯誤字", () => {
    const { result } = setup();
    finishFirstOrder(result);
    expect(result.current.hint).toBeNull();
    expect(result.current.message).not.toMatch(/錯了|不對|再試一次/);

    const second = result.current.round!.orders[1]!;
    const wrong = second.base === "nigiri" ? "temaki" : "nigiri";
    act(() => result.current.actions.pickBase(wrong as typeof second.base));
    expect(result.current.choosingBase).toBe(false);
    expect(result.current.round!.sushi.base).toBe(wrong);
    expect(result.current.hint).toEqual({ kind: "base", id: second.base });
    expect(result.current.message).not.toMatch(/錯了|不對|再試一次/);

    act(() => result.current.actions.pickBase(second.base));
    expect(result.current.hint).toBeNull();
    const off = offOrderSavory(result);
    act(() => result.current.actions.add(off));
    expect(result.current.round!.sushi.toppings).toContain(off);
    expect(result.current.hint).toEqual({ kind: "topping", id: second.toppings[0] });
    expect(result.current.message).not.toMatch(/錯了|不對|再試一次/);
  });

  it("芥末、甜點是彩蛋：放了不亮提示，也不會收掉點偏留下的光暈", () => {
    const { result } = setup();
    finishFirstOrder(result);
    const second = result.current.round!.orders[1]!;
    act(() => result.current.actions.pickBase(second.base));
    const sweet = result.current.round!.tray.find((id) => toppingById(id).kind === "sweet")!;
    act(() => result.current.actions.add("wasabi"));
    expect(result.current.hint).toBeNull();
    act(() => result.current.actions.add(sweet));
    expect(result.current.hint).toBeNull();

    act(() => result.current.actions.remove(1));
    act(() => result.current.actions.remove(0));
    act(() => result.current.actions.add(offOrderSavory(result)));
    expect(result.current.hint).toEqual({ kind: "topping", id: second.toppings[0] });
    act(() => result.current.actions.add("wasabi"));
    expect(result.current.hint).toEqual({ kind: "topping", id: second.toppings[0] });
  });

  it("料位滿了還點料：擠掉最舊那層，不會卡住；擠掉單上要的那層才立刻亮下一步", () => {
    const { result } = setup();
    finishFirstOrder(result);
    const second = result.current.round!.orders[1]!;
    const want = second.toppings[0]!;
    const sweet = result.current.round!.tray.find((id) => toppingById(id).kind === "sweet")!;
    act(() => result.current.actions.pickBase(second.base));
    for (const id of ["wasabi", "wasabi", sweet] as const) act(() => result.current.actions.add(id));
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS);
    });
    expect(result.current.hint).toEqual({ kind: "topping", id: want });
    act(() => result.current.actions.add(want));
    expect(result.current.round!.sushi.toppings).toEqual(["wasabi", sweet, want]);
    expect(result.current.shake).toBe(0);
    expect(result.current.hint).toBeNull();
    // 再放兩樣彩蛋：擠掉的都是彩蛋，單上要的還在，不亮
    act(() => result.current.actions.add("wasabi"));
    act(() => result.current.actions.add(sweet));
    expect(result.current.round!.sushi.toppings).toEqual([want, "wasabi", sweet]);
    expect(result.current.hint).toBeNull();
    // 這次擠掉的是單上要的：馬上亮缺的那樣
    act(() => result.current.actions.add("wasabi"));
    expect(result.current.round!.sushi.toppings).toEqual(["wasabi", sweet, "wasabi"]);
    expect(result.current.hint).toEqual({ kind: "topping", id: want });
  });

  it("放彩蛋會把閒置重新起算：剛玩過不會馬上亮", () => {
    const { result } = setup();
    finishFirstOrder(result);
    const second = result.current.round!.orders[1]!;
    act(() => result.current.actions.pickBase(second.base));
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS - 500);
    });
    act(() => result.current.actions.add("wasabi"));
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS - 1);
    });
    expect(result.current.hint).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.hint).toEqual({ kind: "topping", id: second.toppings[0] });
  });

  it("閒置 4.5 秒後亮出下一步，從新訂單出現才起算（不是從按「給多多吃」）", () => {
    const { result } = setup();
    finishFirstOrder(result);
    expect(result.current.hint).toBeNull();
    // 按「給多多吃」後 4.5 秒：新訂單才出現 3.4 秒，還不亮
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS - 1100);
    });
    expect(result.current.hint).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    const second = result.current.round!.orders[1]!;
    expect(result.current.hint).toEqual({ kind: "base", id: second.base });
  });

  it("吃的動畫途中暫停：繼續後時間軸補完，新訂單出現後 4.5 秒才亮", () => {
    const { result, rerender } = setup();
    act(() => result.current.actions.start("order"));
    const first = result.current.round!.orders[0]!;
    act(() => result.current.actions.pickBase(first.base));
    for (const id of first.toppings) act(() => result.current.actions.add(id));
    act(() => result.current.actions.serve());
    act(() => {
      vi.advanceTimersByTime(500);
    });
    rerender({ inputPaused: true });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.round!.index).toBe(0);
    rerender({ inputPaused: false });
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.round!.index).toBe(1);
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS - 1);
    });
    expect(result.current.hint).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.hint).toEqual({ kind: "base", id: result.current.round!.orders[1]!.base });
  });

  it("暫停過再繼續：閒置重新起算，照樣會亮提示", () => {
    const { result, rerender } = setup();
    finishFirstOrder(result);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender({ inputPaused: true });
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(result.current.hint).toBeNull();
    rerender({ inputPaused: false });
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS - 1);
    });
    expect(result.current.hint).toBeNull();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    const second = result.current.round!.orders[1]!;
    expect(result.current.hint).toEqual({ kind: "base", id: second.base });
  });
});

describe("擠掉最舊那層的音效", () => {
  it("料位滿了再放：先一聲輕的「咻」，「啵」晚一點才響；沒滿時不咻", () => {
    vi.useFakeTimers();
    (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
    const audio = { ensureAudio: vi.fn(), tone: vi.fn(), voices: vi.fn() };
    const { result } = renderHook(() =>
      useDinoSushiPlay({ audio, reducedMotion: true, inputPaused: false, onServed: vi.fn(), onDone: vi.fn() }),
    );
    act(() => result.current.actions.start("free"));
    act(() => result.current.actions.pickBase("nigiri"));
    const tray = result.current.round!.tray;
    for (const id of tray.slice(0, 3)) act(() => result.current.actions.add(id));
    expect(audio.voices).not.toHaveBeenCalledWith(SUSHI_SFX.evict);

    audio.voices.mockClear();
    act(() => result.current.actions.add(tray[3]!));
    // 合成一組送出：同時起播的話輕的「咻」會被「啵」蓋掉，所以「啵」整組晚 EVICT_POP_DELAY
    expect(audio.voices).toHaveBeenCalledTimes(1);
    const voices = audio.voices.mock.calls[0]![0] as SynthVoice[];
    const evict = SUSHI_SFX.evict.length;
    expect(voices.slice(0, evict)).toEqual(SUSHI_SFX.evict);
    expect(voices.length).toBeGreaterThan(evict);
    for (const v of voices.slice(evict)) expect(v.at ?? 0).toBeGreaterThanOrEqual(EVICT_POP_DELAY);
  });
});
