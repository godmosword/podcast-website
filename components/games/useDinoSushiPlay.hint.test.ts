// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { IDLE_HINT_MS, useDinoSushiPlay } from "./useDinoSushiPlay";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, "__dinoSushiSeed");
});

function setup() {
  vi.useFakeTimers();
  (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  return renderHook(() =>
    useDinoSushiPlay({
      reducedMotion: true,
      inputPaused: false,
      onServed: vi.fn(),
      onDone: vi.fn(),
    }),
  );
}

describe("點偏了立刻亮下一步", () => {
  it("教完第一單之後，點錯的料會亮正確的下一格，不出現錯誤字", () => {
    const { result } = setup();
    act(() => result.current.actions.start("order"));
    const first = result.current.round!.orders[0]!;
    act(() => result.current.actions.pickBase(first.base));
    for (const id of first.toppings) act(() => result.current.actions.add(id));
    act(() => result.current.actions.serve());
    act(() => {
      vi.advanceTimersByTime(1100);
    });

    expect(result.current.round!.index).toBe(1);
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
    act(() => result.current.actions.add("wasabi"));
    expect(result.current.round!.sushi.toppings).toContain("wasabi");
    expect(result.current.hint).toEqual({ kind: "topping", id: second.toppings[0] });
    expect(result.current.message).not.toMatch(/錯了|不對|再試一次/);
  });

  it("閒置 4.5 秒後亮出下一步", () => {
    const { result } = setup();
    act(() => result.current.actions.start("order"));
    const first = result.current.round!.orders[0]!;
    act(() => result.current.actions.pickBase(first.base));
    for (const id of first.toppings) act(() => result.current.actions.add(id));
    act(() => result.current.actions.serve());
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    expect(result.current.hint).toBeNull();
    act(() => {
      vi.advanceTimersByTime(IDLE_HINT_MS);
    });
    const second = result.current.round!.orders[1]!;
    expect(result.current.hint).toEqual({ kind: "base", id: second.base });
  });
});
