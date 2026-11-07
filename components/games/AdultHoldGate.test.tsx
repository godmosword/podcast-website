// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ADULT_HINT_MS, ADULT_HOLD_MS, AdultHoldGate } from "./AdultHoldGate";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderGate() {
  const onOpen = vi.fn();
  render(<AdultHoldGate className="look" open={false} onOpen={onOpen} />);
  return { onOpen, gate: screen.getByRole("button", { name: "家長工具" }) };
}

describe("AdultHoldGate", () => {
  it("短按不會打開，但會冒出看得到的「大人請按住」，過一會兒收起", () => {
    const { onOpen, gate } = renderGate();
    fireEvent.pointerDown(gate);
    act(() => {
      vi.advanceTimersByTime(200);
    });
    fireEvent.pointerUp(gate);
    fireEvent.click(gate);
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByTestId("adult-gate-hint").textContent).toBe("大人請按住");
    act(() => {
      vi.advanceTimersByTime(ADULT_HINT_MS);
    });
    expect(screen.queryByTestId("adult-gate-hint")).toBeNull();
  });

  it("按滿 0.7 秒才打開，放開時不再冒提示，打開那一下的 click 也不會被當成別的動作", () => {
    const { onOpen, gate } = renderGate();
    fireEvent.pointerDown(gate);
    act(() => {
      vi.advanceTimersByTime(ADULT_HOLD_MS - 1);
    });
    expect(onOpen).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(onOpen).toHaveBeenCalledTimes(1);
    fireEvent.pointerUp(gate);
    fireEvent.click(gate);
    expect(screen.queryByTestId("adult-gate-hint")).toBeNull();
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("手指滑出按鈕就取消，不打開也不提示", () => {
    const { onOpen, gate } = renderGate();
    fireEvent.pointerDown(gate);
    fireEvent.pointerLeave(gate);
    act(() => {
      vi.advanceTimersByTime(ADULT_HOLD_MS);
    });
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.queryByTestId("adult-gate-hint")).toBeNull();
  });

  it("鍵盤 Enter／空白鍵直接打開；讀屏念得到「按住才會打開」", () => {
    const { onOpen, gate } = renderGate();
    fireEvent.keyDown(gate, { key: "Enter" });
    fireEvent.keyDown(gate, { key: " " });
    expect(onOpen).toHaveBeenCalledTimes(2);
    const described = document.getElementById(gate.getAttribute("aria-describedby") ?? "");
    expect(described?.textContent).toBe("按住才會打開");
  });
});
