// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BarTouchButton, GridTouchButton } from "./TouchControls";

vi.stubGlobal("React", React);

const captureMap = new Map<number, Element>();

const origSetPointerCapture = Element.prototype.setPointerCapture;
const origReleasePointerCapture = Element.prototype.releasePointerCapture;
const origHasPointerCapture = Element.prototype.hasPointerCapture;

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

describe("TouchControls pointer capture", () => {
  beforeEach(() => {
    captureMap.clear();
    installPointerCaptureShim();
  });

  afterEach(() => {
    cleanup();
    Element.prototype.setPointerCapture = origSetPointerCapture;
    Element.prototype.releasePointerCapture = origReleasePointerCapture;
    Element.prototype.hasPointerCapture = origHasPointerCapture;
  });

  it("GridTouchButton：down 呼叫 setPointerCapture；leave 不觸發 onUp", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();
    render(
      <GridTouchButton label="左移" onDown={onDown} onUp={onUp}>
        ←
      </GridTouchButton>,
    );
    const btn = screen.getByRole("button", { name: "左移" });
    fireEvent.pointerDown(btn, { pointerId: 7, clientX: 0, clientY: 0 });
    expect(Element.prototype.setPointerCapture).toHaveBeenCalledWith(7);
    expect(onDown).toHaveBeenCalledTimes(1);
    expect(onUp).not.toHaveBeenCalled();

    fireEvent.pointerLeave(btn, { pointerId: 7 });
    expect(onUp).not.toHaveBeenCalled();
  });

  it("GridTouchButton：up / cancel / lost 各只觸發 onUp 一次", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();
    render(
      <GridTouchButton label="右移" onDown={onDown} onUp={onUp}>
        →
      </GridTouchButton>,
    );
    const btn = screen.getByRole("button", { name: "右移" });
    fireEvent.pointerDown(btn, { pointerId: 3 });

    fireEvent.pointerUp(btn, { pointerId: 3 });
    expect(onUp).toHaveBeenCalledTimes(1);
    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(3);

    fireEvent.pointerCancel(btn, { pointerId: 3 });
    fireEvent(btn, new Event("lostpointercapture", { bubbles: true }));
    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it("GridTouchButton：按住時 lostpointercapture 觸發 onUp 一次", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();
    render(
      <GridTouchButton label="右移" onDown={onDown} onUp={onUp}>
        →
      </GridTouchButton>,
    );
    const btn = screen.getByRole("button", { name: "右移" });
    fireEvent.pointerDown(btn, { pointerId: 8 });
    expect(onDown).toHaveBeenCalledTimes(1);

    fireEvent.lostPointerCapture(btn, { pointerId: 8 });
    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it("GridTouchButton：down 後 unmount 觸發 onUp 一次", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();
    const { unmount } = render(
      <GridTouchButton label="左移" onDown={onDown} onUp={onUp}>
        ←
      </GridTouchButton>,
    );
    const btn = screen.getByRole("button", { name: "左移" });
    fireEvent.pointerDown(btn, { pointerId: 12 });
    expect(onDown).toHaveBeenCalledTimes(1);

    unmount();
    expect(onUp).toHaveBeenCalledTimes(1);
  });

  it("BarTouchButton：leave 不釋放；up 釋放並 onUp", () => {
    const onDown = vi.fn();
    const onUp = vi.fn();
    render(
      <BarTouchButton label="跳躍" onDown={onDown} onUp={onUp}>
        跳
      </BarTouchButton>,
    );
    const btn = screen.getByRole("button", { name: "跳躍" });
    fireEvent.pointerDown(btn, { pointerId: 5 });
    expect(onDown).toHaveBeenCalledTimes(1);

    fireEvent.pointerLeave(btn, { pointerId: 5 });
    expect(onUp).not.toHaveBeenCalled();

    fireEvent.pointerUp(btn, { pointerId: 5 });
    expect(onUp).toHaveBeenCalledTimes(1);
    expect(Element.prototype.releasePointerCapture).toHaveBeenCalledWith(5);
  });
});
