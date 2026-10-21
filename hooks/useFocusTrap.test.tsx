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
