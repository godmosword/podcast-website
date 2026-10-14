// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CandyMatchBoard } from "./CandyMatchBoard";
import type { BoardState } from "@/lib/games/candy-match/engine";

vi.stubGlobal("React", React);

const captureMap = new Map<number, Element>();

function installPointerCaptureShim() {
  Element.prototype.setPointerCapture = vi.fn(function (this: Element, pointerId: number) {
    captureMap.set(pointerId, this);
  });
  Element.prototype.releasePointerCapture = vi.fn(function (this: Element, pointerId: number) {
    captureMap.delete(pointerId);
  });
  Element.prototype.hasPointerCapture = vi.fn(function (this: Element, pointerId: number) {
    return captureMap.get(pointerId) === this;
  });
}

function makeBoard(cols = 3, rows = 3): BoardState {
  return {
    cols,
    rows,
    pieces: Array.from({ length: cols * rows }, (_, i) => i % 5),
    dirt: Array(cols * rows).fill(0),
    specials: Array(cols * rows).fill("none"),
  };
}

describe("CandyMatchBoard pointer capture", () => {
  beforeEach(() => {
    captureMap.clear();
    installPointerCaptureShim();
  });

  afterEach(() => {
    cleanup();
  });

  it("pointerdown 呼叫 setPointerCapture", () => {
    render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
      />,
    );
    const cell = screen.getByRole("button", { name: /第 1 列第 1 格/ });
    fireEvent.pointerDown(cell, { pointerId: 11, clientX: 50, clientY: 50 });
    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(11);
  });

  it("輕微移動後 pointerup 仍觸發 tap（未達 14px 閾值）", () => {
    const onTapCell = vi.fn();
    render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={onTapCell}
        onSwipeCell={vi.fn()}
      />,
    );
    const cell = screen.getByRole("button", { name: /第 1 列第 1 格/ });
    fireEvent.pointerDown(cell, { pointerId: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(cell, { pointerId: 2, clientX: 108, clientY: 105 });
    fireEvent.pointerUp(cell, { pointerId: 2, clientX: 108, clientY: 105 });
    expect(onTapCell).toHaveBeenCalledWith(0);
    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(2);
  });

  it("pointercancel 僅在 pointerId 相符時才清除 drag", () => {
    const onTapCell = vi.fn();
    render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={onTapCell}
        onSwipeCell={vi.fn()}
      />,
    );
    const cell = screen.getByRole("button", { name: /第 1 列第 1 格/ });
    fireEvent.pointerDown(cell, { pointerId: 4, clientX: 20, clientY: 20 });
    fireEvent.pointerCancel(cell, { pointerId: 99 });
    fireEvent.pointerUp(cell, { pointerId: 4, clientX: 20, clientY: 20 });
    expect(onTapCell).toHaveBeenCalledWith(0);
  });

  it("pointercancel 相符 pointerId 時清除且不觸發 tap", () => {
    const onTapCell = vi.fn();
    render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={onTapCell}
        onSwipeCell={vi.fn()}
      />,
    );
    const cell = screen.getByRole("button", { name: /第 1 列第 1 格/ });
    fireEvent.pointerDown(cell, { pointerId: 4, clientX: 20, clientY: 20 });
    fireEvent.pointerCancel(cell, { pointerId: 4 });
    fireEvent.pointerUp(cell, { pointerId: 4, clientX: 20, clientY: 20 });
    expect(onTapCell).not.toHaveBeenCalled();
  });

  it("swap motion 標在兩格上；reduced 不標 data-swap", () => {
    const { rerender } = render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
        motion={{ swap: { a: 0, b: 1 } }}
      />,
    );
    expect(screen.getByTestId("candy-match-board").getAttribute("data-swap")).toBe("0-1");
    expect(screen.getByRole("button", { name: /第 1 列第 1 格/ }).getAttribute("data-swap")).toBe("true");

    rerender(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
        motion={{ swap: { a: 0, b: 1 }, reduced: true }}
      />,
    );
    expect(screen.getByTestId("candy-match-board").getAttribute("data-swap")).toBeNull();
  });

  it("fall motion 寫入 data-fall-rows；reduced 跳過", () => {
    render(
      <CandyMatchBoard
        board={makeBoard()}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
        motion={{ falls: [{ to: 3, rows: 2 }] }}
      />,
    );
    expect(screen.getByTestId("candy-match-board").getAttribute("data-falling")).toBe("true");
    expect(
      screen.getByRole("button", { name: /第 2 列第 1 格/ }).getAttribute("data-fall-rows"),
    ).toBe("2");
  });

  it("厚污漬標成兩層，普通髒格是一層", () => {
    const board = makeBoard();
    board.dirt[0] = 2;
    board.dirt[1] = 1;
    render(
      <CandyMatchBoard
        board={board}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
      />,
    );
    const thick = screen.getByRole("button", { name: /厚污漬/ });
    const thin = screen.getByRole("button", { name: /髒髒格/ });
    expect(thick.getAttribute("data-dirt")).toBe("2");
    expect(thin.getAttribute("data-dirt")).toBe("1");
    expect(thin.getAttribute("aria-label")).not.toContain("厚污漬");
  });

  it("爆炸糖顯示徽章", () => {
    const board = makeBoard();
    board.specials[0] = "burst";
    render(
      <CandyMatchBoard
        board={board}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set()}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
      />,
    );
    const cell = screen.getByRole("button", { name: /爆炸糖/ });
    expect(cell.getAttribute("data-special")).toBe("burst");
    // 角落徽章是黏土圖示（svg），不再是 emoji
    expect(cell.querySelector('[data-kind="burst"] svg')).not.toBeNull();
    expect(cell.textContent).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("掃把糖顯示徽章；reduced 不標 data-sweep", () => {
    const board = makeBoard();
    board.specials[0] = "row";
    const { rerender } = render(
      <CandyMatchBoard
        board={board}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set([0])}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
        motion={{ sweep: "row" }}
      />,
    );
    const cell = screen.getByRole("button", { name: /掃把糖/ });
    expect(cell.getAttribute("data-special")).toBe("row");
    expect(cell.getAttribute("data-sweep")).toBe("row");

    rerender(
      <CandyMatchBoard
        board={board}
        cellPx={48}
        selected={null}
        hint={null}
        popping={new Set([0])}
        shaking={new Set()}
        disabled={false}
        onTapCell={vi.fn()}
        onSwipeCell={vi.fn()}
        motion={{ sweep: "row", reduced: true }}
      />,
    );
    expect(
      screen.getByRole("button", { name: /掃把糖/ }).getAttribute("data-sweep"),
    ).toBeNull();
    expect(screen.getByRole("button", { name: /掃把糖/ }).getAttribute("data-fx-still")).toBe("true");
  });
});

describe("消除特效", () => {
  afterEach(() => {
    cleanup();
  });

  const base = {
    cellPx: 48,
    selected: null,
    hint: null,
    shaking: new Set<number>(),
    disabled: false,
    onTapCell: vi.fn(),
    onSwipeCell: vi.fn(),
  };

  it("掃把讓車車開過橫排，並留下尾巴", () => {
    const board = makeBoard(4, 3);
    render(
      <CandyMatchBoard
        {...base}
        board={board}
        popping={new Set([0, 1, 2, 3])}
        motion={{
          fx: [{ kind: "line", axis: "row", index: 0 }],
          praise: null,
          particles: [],
          particleBurst: 0,
          shake: false,
          still: false,
        }}
      />,
    );
    const car = screen.getByTestId("candy-fx-line");
    expect(car.getAttribute("data-axis")).toBe("row");
    expect(car.querySelector("svg")).not.toBeNull();
    expect(screen.queryByTestId("candy-fx-confetti")).toBeNull();
  });

  it("直欄也有車車", () => {
    render(
      <CandyMatchBoard
        {...base}
        board={makeBoard(3, 4)}
        popping={new Set([0, 3, 6, 9])}
        motion={{ fx: [{ kind: "line", axis: "col", index: 1 }] }}
      />,
    );
    expect(screen.getByTestId("candy-fx-line").getAttribute("data-axis")).toBe("col");
  });

  it("爆炸糖冒出三角錐與衝擊波", () => {
    render(
      <CandyMatchBoard
        {...base}
        board={makeBoard()}
        popping={new Set([4])}
        motion={{ fx: [{ kind: "burst", origin: 4 }] }}
      />,
    );
    const burst = screen.getByTestId("candy-fx-burst");
    expect(burst.querySelector("svg")).not.toBeNull();
    expect(burst.querySelectorAll("i").length).toBe(8);
  });

  it("彩虹從起點掃出去", () => {
    render(
      <CandyMatchBoard
        {...base}
        board={makeBoard()}
        popping={new Set([0, 4, 8])}
        motion={{ fx: [{ kind: "color", origin: 0, cells: [0, 4, 8] }] }}
      />,
    );
    const rainbow = screen.getByTestId("candy-fx-color");
    expect(rainbow.querySelectorAll("line").length).toBe(2);
  });

  it("稱讚升級會念出字、撒彩紙；減少動態改成高亮、不撒彩紙、不晃", () => {
    const board = makeBoard();
    const { rerender } = render(
      <CandyMatchBoard
        {...base}
        board={board}
        popping={new Set([0, 1, 2])}
        motion={{
          fx: [],
          particles: [{ cell: 0, color: "#ff7a9c" }, { cell: 1, color: "#ffd34d" }],
          particleBurst: 1,
          praise: { id: 1, text: "好棒", step: 1, confetti: true },
          shake: false,
        }}
      />,
    );
    expect(screen.getByTestId("candy-fx-praise").textContent).toBe("好棒");
    expect(screen.getAllByTestId("candy-fx-confetti").length).toBeGreaterThan(0);
    expect(screen.getByTestId("candy-match-particles")).toBeTruthy();

    rerender(
      <CandyMatchBoard
        {...base}
        board={board}
        popping={new Set([0, 1, 2])}
        motion={{
          reduced: true,
          fx: [{ kind: "line", axis: "row", index: 0 }],
          praise: { id: 2, text: "太厲害了", step: 3, confetti: false },
          shake: true,
          still: true,
          particles: [{ cell: 0, color: "#ff7a9c" }],
          particleBurst: 2,
        }}
      />,
    );
    expect(screen.getByTestId("candy-fx-praise").textContent).toBe("太厲害了");
    expect(screen.queryByTestId("candy-fx-line")).toBeNull();
    expect(screen.queryByTestId("candy-fx-confetti")).toBeNull();
    expect(screen.queryByTestId("candy-match-particles")).toBeNull();
    expect(screen.getAllByTestId("candy-fx-still").length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: /第 1 列第 1 格/ }).getAttribute("data-fx-still")).toBe("true");
    const wrap = screen.getByTestId("candy-match-board").parentElement;
    expect(wrap?.getAttribute("data-shake")).toBeNull();
    expect(wrap?.getAttribute("data-still")).toBe("true");
  });

  it("大組合才把棋盤標成輕晃", () => {
    render(
      <CandyMatchBoard
        {...base}
        board={makeBoard()}
        popping={new Set()}
        motion={{ shake: true }}
      />,
    );
    expect(screen.getByTestId("candy-match-board").parentElement?.getAttribute("data-shake")).toBe("true");
  });
});
