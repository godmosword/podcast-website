// @vitest-environment jsdom
import React, { useRef } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useFocusTrap } from "./useFocusTrap";

vi.stubGlobal("React", React);

afterEach(() => cleanup());

function Trap({ active, returnFocus }: { active: boolean; returnFocus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useFocusTrap(active, ref, { returnFocus });
  return (
    <div ref={ref}>
      <button type="button">inside</button>
    </div>
  );
}

function setup(returnFocus?: boolean) {
  const outside = document.createElement("button");
  outside.textContent = "outside";
  document.body.appendChild(outside);
  outside.focus();
  const view = render(<Trap active returnFocus={returnFocus} />);
  // jsdom 沒有版面（offsetParent 恆為 null），初始焦點移不進去；手動模擬使用者已在面板內。
  view.getByRole("button", { name: "inside" }).focus();
  return { outside, view };
}

describe("useFocusTrap", () => {
  it("關閉時把焦點還給開啟前的元素（預設）", () => {
    const { outside, view } = setup();
    view.rerender(<Trap active={false} />);
    expect(document.activeElement).toBe(outside);
    outside.remove();
  });

  it("returnFocus: false 時不自行返還，交給呼叫端", () => {
    const { outside, view } = setup(false);
    view.rerender(<Trap active={false} returnFocus={false} />);
    expect(document.activeElement?.textContent).toBe("inside");
    outside.remove();
  });
});

function TrapWithTrigger() {
  const ref = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useFocusTrap(true, ref, { include: [triggerRef] });
  return (
    <>
      <button type="button" ref={triggerRef}>
        trigger
      </button>
      <div ref={ref}>
        <button type="button">first</button>
        <button type="button">last</button>
      </div>
      <button type="button">background</button>
    </>
  );
}

describe("useFocusTrap：include 把容器外的觸發器一起算進 Tab 環繞", () => {
  it("初始焦點仍在容器第一項；Tab 從最後一項繞到觸發器，Shift+Tab 從觸發器繞回最後一項", () => {
    // jsdom 沒有版面：讓每個元素都算「看得到」
    const spy = vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body);
    const view = render(<TrapWithTrigger />);
    const trigger = view.getByRole("button", { name: "trigger" });
    const first = view.getByRole("button", { name: "first" });
    const last = view.getByRole("button", { name: "last" });
    expect(document.activeElement).toBe(first);

    last.focus();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(trigger);

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(last);
    spy.mockRestore();
  });
});

describe("useFocusTrap：Tab 一律由 trap 自己移（Safari 預設 Tab 不停在連結上）", () => {
  it("中間的項目按 Tab 也由 trap 決定下一個，不交給瀏覽器（攔下預設行為）", () => {
    const spy = vi.spyOn(HTMLElement.prototype, "offsetParent", "get").mockReturnValue(document.body);
    const view = render(<TrapWithTrigger />);
    const trigger = view.getByRole("button", { name: "trigger" });
    const first = view.getByRole("button", { name: "first" });
    const last = view.getByRole("button", { name: "last" });
    first.focus();
    const tab = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
    // 焦點掉到 body（例如 Safari 把連結跳過）時，下一次 Tab 回到環繞的第一個
    (document.activeElement as HTMLElement).blur();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }));
    expect(document.activeElement).toBe(trigger);
    spy.mockRestore();
  });
});
