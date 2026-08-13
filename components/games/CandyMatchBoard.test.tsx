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
    dirt: Array(cols * rows).fill(false),
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
});
