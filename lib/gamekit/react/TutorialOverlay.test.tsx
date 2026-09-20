// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { TutorialOverlay } from "./TutorialOverlay";

vi.stubGlobal("React", React);

const STEPS = [{ gesture: "tap", text: "點一下" }] as const;

describe("TutorialOverlay（G-H5）", () => {
  afterEach(cleanup);

  it("portal 到 document.body，不困在容器的 stacking context 裡", () => {
    const { container } = render(
      <div data-testid="host">
        <TutorialOverlay title="測試" steps={STEPS} onClose={() => {}} />
      </div>,
    );
    const dialog = screen.getByRole("dialog");
    expect(container.contains(dialog)).toBe(false);
    expect(document.body.contains(dialog)).toBe(true);
  });

  it("有 onStart：主鈕是「開始玩！」，按下關閉並真的開始", () => {
    const onClose = vi.fn();
    const onStart = vi.fn();
    render(<TutorialOverlay title="測試" steps={STEPS} onClose={onClose} onStart={onStart} />);
    fireEvent.click(screen.getByRole("button", { name: "開始玩！" }));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it("沒 onStart（局中打開）：主鈕只是「知道了」", () => {
    const onClose = vi.fn();
    render(<TutorialOverlay title="測試" steps={STEPS} onClose={onClose} />);
    expect(screen.queryByRole("button", { name: "開始玩！" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "知道了" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
