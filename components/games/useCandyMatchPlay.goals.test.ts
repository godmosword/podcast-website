// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { CandyMatchInstance } from "@/lib/gamekit/games/candy-match/adapter";
import { findHintMove } from "@/lib/games/candy-match/engine";
import { buildRound } from "@/lib/games/candy-match/stages";
import { useCandyMatchPlay } from "./useCandyMatchPlay";

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

describe("消消樂關前與結算朗讀", () => {
  it("介紹還沒收起時不能交換", () => {
    const { result } = render();
    act(() => {
      result.current.actions.start(buildRound(0, "easy", { replay: false, rng: () => 0.2 }));
    });
    const board = result.current.play!.board;
    const move = findHintMove(board.pieces, board.cols, board.rows, board.specials);
    expect(move).not.toBeNull();
    act(() => {
      result.current.actions.attemptSwap(move!.a, move!.b);
    });
    expect(result.current.play!.progress.swaps).toBe(0);
    expect(result.current.busy).toBe(false);
    expect(result.current.outcome).toBeNull();
  });

  it("挑戰只剩一步且沒達標時，念出還差幾台", async () => {
    const { result } = render();
    const round = buildRound(1, "challenge", { replay: false, rng: () => 0.2 });
    const oneMove = {
      ...round,
      stage: { ...round.stage, moves: 1, goals: [{ kind: "collect" as const, piece: 0, count: 99 }] },
    };
    act(() => {
      result.current.actions.start(oneMove);
    });
    act(() => {
      result.current.actions.beginPlay();
    });
    const board = result.current.play!.board;
    const move = findHintMove(board.pieces, board.cols, board.rows, board.specials);
    expect(move).not.toBeNull();
    await act(async () => {
      result.current.actions.attemptSwap(move!.a, move!.b);
      await vi.advanceTimersByTimeAsync(4000);
    });
    expect(result.current.outcome?.kind).toBe("retry");
    expect(result.current.speechCue?.text).toMatch(/^再差 \d+ 台小紅！再試一次！$/);
    expect(instance.notifyRetry).toHaveBeenCalled();
  });
});
