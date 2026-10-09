// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColoringResetView } from "./ColoringResetView";

afterEach(() => {
  cleanup();
});

describe("ColoringResetView", () => {
  it("是有名字的圖示鈕，按了就把畫面收回", () => {
    const onReset = vi.fn();
    render(<ColoringResetView onReset={onReset} />);

    const btn = screen.getByRole("button", { name: "縮放還原" });
    expect(btn.querySelector("svg")).toBeTruthy();
    fireEvent.click(btn);
    expect(onReset).toHaveBeenCalledOnce();
  });
});
