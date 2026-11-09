// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  FREE_TIMELINE,
  ORDER_TIMELINE,
  ORDER_TIMELINE_REDUCED,
  useDinoSushiPlay,
  type ServePhase,
} from "./useDinoSushiPlay";

/** 客人吃（2026-11-08）：送出 → 交接 → 帶子送過去 → 客人咬一口 → 同一拍反應 → 解鎖，全程 ≤ 1.6 秒。 */

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  Reflect.deleteProperty(window, "__dinoSushiSeed");
});

function setup(reducedMotion: boolean) {
  vi.useFakeTimers();
  (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed = 7;
  return renderHook(
    ({ inputPaused }: { inputPaused: boolean }) =>
      useDinoSushiPlay({ reducedMotion, inputPaused, onServed: vi.fn(), onDone: vi.fn() }),
    { initialProps: { inputPaused: false } },
  );
}

type Hook = ReturnType<typeof setup>["result"];

function serveFirstOrder(result: Hook) {
  act(() => result.current.actions.start("order"));
  const first = result.current.round!.orders[0]!;
  act(() => result.current.actions.pickBase(first.base));
  for (const id of first.toppings) act(() => result.current.actions.add(id));
  act(() => result.current.actions.serve());
}

function at(result: Hook, ms: number, last: { t: number }): ServePhase {
  act(() => {
    vi.advanceTimersByTime(ms - last.t);
  });
  last.t = ms;
  return result.current.phase;
}

describe("點餐送餐時間軸", () => {
  it("交接 → 送過去 → 咬一口 → 反應 → 1.6 秒解鎖、下一位入座", () => {
    const { result } = setup(false);
    serveFirstOrder(result);
    const last = { t: 0 };
    expect(result.current.phase).toBe("handoff");
    expect(at(result, ORDER_TIMELINE.ride! - 1, last)).toBe("handoff");
    expect(at(result, ORDER_TIMELINE.ride!, last)).toBe("ride");
    expect(at(result, ORDER_TIMELINE.eat, last)).toBe("eat");
    expect(at(result, ORDER_TIMELINE.react, last)).toBe("react");
    // 高潮同一拍：謝謝與表情一起出現
    expect(result.current.thanks).not.toBeNull();
    expect(result.current.caption?.eats).toBe(true);
    expect(result.current.round!.index).toBe(0);
    expect(at(result, ORDER_TIMELINE.done - 1, last)).toBe("react");
    expect(at(result, ORDER_TIMELINE.done, last)).toBe("idle");
    expect(result.current.round!.index).toBe(1);
    expect(result.current.locked).toBe(false);
    expect(ORDER_TIMELINE.done).toBeLessThanOrEqual(1600);
  });

  it("減少動態：不送，直接咬，0.8 秒解鎖", () => {
    const { result } = setup(true);
    serveFirstOrder(result);
    const last = { t: 0 };
    expect(result.current.phase).toBe("eat");
    expect(at(result, ORDER_TIMELINE_REDUCED.react, last)).toBe("react");
    expect(at(result, ORDER_TIMELINE_REDUCED.done, last)).toBe("idle");
    expect(result.current.round!.index).toBe(1);
    expect(ORDER_TIMELINE_REDUCED.done).toBeLessThanOrEqual(800);
  });

  it("送到一半暫停：時間停住，繼續後補完剩下的", () => {
    const { result, rerender } = setup(false);
    serveFirstOrder(result);
    act(() => {
      vi.advanceTimersByTime(ORDER_TIMELINE.ride! + 100);
    });
    expect(result.current.phase).toBe("ride");
    rerender({ inputPaused: true });
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.phase).toBe("ride");
    expect(result.current.round!.index).toBe(0);
    rerender({ inputPaused: false });
    act(() => {
      vi.advanceTimersByTime(ORDER_TIMELINE.done - ORDER_TIMELINE.ride! - 100);
    });
    expect(result.current.phase).toBe("idle");
    expect(result.current.round!.index).toBe(1);
  });

  it("同一幀按兩次送出（兩指、重複觸發）：只送一次，第一次就做對的金盤不會不見", () => {
    const { result } = setup(false);
    act(() => result.current.actions.start("order"));
    const first = result.current.round!.orders[0]!;
    act(() => result.current.actions.pickBase(first.base));
    for (const id of first.toppings) act(() => result.current.actions.add(id));
    act(() => {
      result.current.actions.serve();
      result.current.actions.serve();
    });
    expect(result.current.round!.attempts).toBe(1);
    act(() => {
      vi.advanceTimersByTime(ORDER_TIMELINE.done);
    });
    expect(result.current.round!.index).toBe(1);
    expect(result.current.round!.plates).toHaveLength(1);
    expect(result.current.round!.plates[0]!.gold).toBe(true);
  });

  it("送餐途中回標題：排程全部取消，不會再跳到下一單", () => {
    const { result } = setup(false);
    serveFirstOrder(result);
    act(() => result.current.actions.leave());
    act(() => {
      vi.advanceTimersByTime(ORDER_TIMELINE.done * 2);
    });
    expect(result.current.round).toBeNull();
    expect(result.current.phase).toBe("idle");
  });
});

describe("自由做仍是多多吃", () => {
  it("送過來 → 張嘴 → 咀嚼 → 反應，沒有交接", () => {
    const { result } = setup(false);
    act(() => result.current.actions.start("free"));
    const round = result.current.round!;
    act(() => result.current.actions.pickBase(round.allowedBases[0]!));
    act(() => result.current.actions.serve());
    const last = { t: 0 };
    expect(result.current.phase).toBe("ride");
    expect(at(result, FREE_TIMELINE.eat, last)).toBe("eat");
    expect(at(result, FREE_TIMELINE.chew!, last)).toBe("chew");
    expect(at(result, FREE_TIMELINE.react, last)).toBe("react");
    expect(at(result, FREE_TIMELINE.done, last)).toBe("idle");
  });
});
