// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TAP_MOVE_PX, TapButton } from "./DinoSushiPiece";

afterEach(cleanup);

function renderButton(onTap: (point?: unknown) => void) {
  render(<TapButton onTap={onTap}>蝦</TapButton>);
  const button = screen.getByRole("button", { name: "蝦" });
  button.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      right: 80,
      bottom: 64,
      width: 80,
      height: 64,
      toJSON() {
        return {};
      },
    }) as DOMRect;
  return button;
}

describe("TapButton", () => {
  it("手指幾乎沒移動、放開仍在鈕上，算點一下", () => {
    const onTap = vi.fn();
    const button = renderButton(onTap);
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(button, { pointerId: 1, button: 0, clientX: 24, clientY: 22 });
    expect(onTap).toHaveBeenCalledOnce();
  });

  it("移動超過門檻（從托盤開始滑）不算選料", () => {
    const onTap = vi.fn();
    const button = renderButton(onTap);
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerUp(button, {
      pointerId: 1,
      button: 0,
      clientX: 20 + TAP_MOVE_PX + 4,
      clientY: 20,
    });
    expect(onTap).not.toHaveBeenCalled();
  });

  it("pointercancel 之後放開不算點", () => {
    const onTap = vi.fn();
    const button = renderButton(onTap);
    fireEvent.pointerDown(button, { pointerId: 1, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerCancel(button, { pointerId: 1 });
    fireEvent.pointerUp(button, { pointerId: 1, button: 0, clientX: 20, clientY: 20 });
    expect(onTap).not.toHaveBeenCalled();
  });

  it("鍵盤 click（detail 0）仍會觸發", () => {
    const onTap = vi.fn();
    const button = renderButton(onTap);
    fireEvent.click(button, { detail: 0 });
    expect(onTap).toHaveBeenCalledOnce();
  });
});
