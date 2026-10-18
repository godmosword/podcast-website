// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandyMatchInstance } from "@/lib/gamekit/games/candy-match/adapter";
import { buildRound } from "@/lib/games/candy-match/stages";
import { HINT_SHOW_MS, HINT_SOFT_MS, useCandyMatchPlay } from "./useCandyMatchPlay";

const instance = {
  notifyScore: vi.fn(),
  notifyWon: vi.fn(),
  notifyRetry: vi.fn(),
  isInputPaused: () => false,
} as unknown as CandyMatchInstance;

function render() {
  return renderHook(() =>
    useCandyMatchPlay({
      instance,
      ensureAudio: () => {},
      tone: () => {},
      reducedMotion: true,
      inputPaused: false,
      syncHost: () => {},
      tipsSeen: ["swap"],
      onTipSeen: () => {},
    }),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("消消樂輕鬆提示", () => {
  it("5 秒念文字，9 秒才亮出建議的交換", () => {
    expect(HINT_SOFT_MS).toBe(5_000);
    expect(HINT_SHOW_MS).toBe(9_000);
    const { result } = render();
    act(() => {
      result.current.actions.start(buildRound(0, "easy", { replay: false, rng: () => 0.2 }));
    });
    expect(result.current.speechCue?.text).toBe("收集 50 台車車。");
    expect(result.current.briefing).toBe(true);
    expect(result.current.hint).toBeNull();
    act(() => {
      result.current.actions.beginPlay();
    });
    expect(result.current.briefing).toBe(false);

    act(() => {
      vi.advanceTimersByTime(HINT_SOFT_MS);
    });
    expect(result.current.message).toBe("找找三個一樣的圖案！");
    expect(result.current.speechCue?.text).toBe("找找三個一樣的圖案！");
    expect(result.current.hint).toBeNull();

    act(() => {
      vi.advanceTimersByTime(HINT_SHOW_MS - HINT_SOFT_MS);
    });
    expect(result.current.message).toBe("看看發光的地方！");
    expect(result.current.speechCue?.text).toBe("看看發光的地方！");
    expect(result.current.speechCue?.interrupt).toBe(true);
    expect(result.current.hint).not.toBeNull();
  });

  it("挑戰模式閒置不會自己亮提示", () => {
    const { result } = render();
    act(() => {
      result.current.actions.start(buildRound(0, "challenge", { replay: false, rng: () => 0.2 }));
    });
    act(() => {
      vi.advanceTimersByTime(HINT_SHOW_MS + 1_000);
    });
    expect(result.current.hint).toBeNull();
    expect(result.current.speechCue?.text).toBe("收集 40 台車車。");
  });
});
