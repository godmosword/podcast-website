// @vitest-environment jsdom
import React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GameHost from "./GameHost";
import { candyMatchAdapter } from "@/lib/gamekit/games/candy-match/adapter";
import { getBestScoreFromStore, saveBestScoreInStore } from "@/lib/progress-store";

vi.stubGlobal("React", React);

/**
 * G-C1 回歸：消消樂按「暫停」後，工具列必須出現「繼續遊戲」，且棋盤不可再操作。
 * 根因是 CandyMatchView 的 controller effect 把 `startLevel` 放進 deps，
 * host status 變 `paused` 時 effect 重跑、再呼叫 `notifyReady("title")` 把狀態打回 ready。
 */
describe("GameHost × candy-match 暫停", () => {
  beforeEach(() => {
    // jsdom 的 localStorage 在此環境不可用（--localstorage-file 警告），換記憶體版
    const store = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    };
    Object.defineProperty(window, "localStorage", { value: localStorageMock, configurable: true });
    vi.stubGlobal("localStorage", localStorageMock);
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    window.matchMedia ??= ((q: string) =>
      ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }) as MediaQueryList);
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("pause 後 toolbar 顯示「繼續遊戲」、棋盤 disabled；resume 後回到「暫停遊戲」", async () => {
    render(<GameHost adapter={candyMatchAdapter} title="繽紛消消樂" />);

    // 標題 → 地圖 → 第 1 關
    fireEvent.click(screen.getByRole("button", { name: /開始/ }));
    fireEvent.click(screen.getByText("下一關").closest("button")!);
    await act(async () => {});

    const board = () => screen.getByTestId("candy-match-board");
    expect(board().getAttribute("aria-disabled")).toBeNull();
    expect(screen.getByRole("button", { name: "暫停遊戲" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "暫停遊戲" }));
    await act(async () => {});

    expect(screen.getByRole("button", { name: "繼續遊戲" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "暫停遊戲" })).toBeNull();
    // 棋盤仍在（沒被打回 title），且整盤停用
    expect(board().getAttribute("aria-disabled")).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "繼續遊戲" }));
    await act(async () => {});
    expect(screen.getByRole("button", { name: "暫停遊戲" })).toBeTruthy();
    expect(board().getAttribute("aria-disabled")).toBeNull();
  });

  /** G-M6：消消樂 `hasScore: false`，即使舊資料存了分數，抬頭也不該冒出「最佳 ⭐」。 */
  it("hasScore:false 的遊戲不顯示最佳分", async () => {
    saveBestScoreInStore("candy-match", 500);
    expect(getBestScoreFromStore("candy-match")).toBe(500);
    render(<GameHost adapter={candyMatchAdapter} title="繽紛消消樂" />);
    await act(async () => {});
    expect(screen.queryByText(/最佳/)).toBeNull();
  });
});
