// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColoringToolbar } from "./ColoringToolbar";
import { BucketIcon, CrayonIcon, EraserIcon } from "./ColoringToolbarIcons";

afterEach(() => {
  cleanup();
});

const NOOP = () => {};

function renderToolbar(
  overrides: Partial<ComponentProps<typeof ColoringToolbar>> = {},
) {
  return render(
    <ColoringToolbar
      tool="crayon"
      onToolChange={NOOP}
      brushSize="medium"
      onBrushSizeChange={NOOP}
      canUndo
      onUndo={NOOP}
      onClear={NOOP}
      onDownload={NOOP}
      viewActive={false}
      onResetView={NOOP}
      {...overrides}
    />,
  );
}

describe("ColoringToolbar", () => {
  it("畫具有圖示和看得到的名字", () => {
    renderToolbar();

    for (const name of ["蠟筆", "填滿", "擦掉"] as const) {
      const btn = screen.getByRole("button", { name });
      expect(btn.textContent).toContain(name);
      expect(btn.querySelector("svg")).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("button", { name: "更多" }));
    for (const name of ["筆刷細", "筆刷中", "筆刷粗"] as const) {
      const btn = screen.getByRole("button", { name });
      expect(btn.textContent).toBe("");
      expect(btn.querySelector("[data-size-dot]")).toBeTruthy();
    }
  });

  it("操作列圖示鈕保留原本可及名稱", () => {
    renderToolbar({ canUndo: false, viewActive: true });

    expect(screen.getByRole("button", { name: "復原" })).toHaveProperty(
      "disabled",
      true,
    );
    fireEvent.click(screen.getByRole("button", { name: "更多" }));
    expect(
      screen.getByRole("button", { name: "清空" }).querySelector("svg"),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "縮放還原" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.queryByRole("button", { name: "故事照片" })).toBeNull();
    expect(
      screen.getByRole("button", { name: "下載" }).querySelector("svg"),
    ).toBeTruthy();
  });

  it("畫具圖示用色盤色，不是單色剪影", () => {
    expect(renderToStaticMarkup(<CrayonIcon />)).toContain("#f2c94c");
    expect(renderToStaticMarkup(<BucketIcon />)).toContain("#2d9cdb");
    expect(renderToStaticMarkup(<EraserIcon />)).toContain("#f781c6");
  });

  it("清空要再按一次才會清掉", () => {
    const onClear = vi.fn();
    renderToolbar({ onClear });
    fireEvent.click(screen.getByRole("button", { name: "更多" }));
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "再按一次清空" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("點填滿會切工具，筆刷三檔此時不可按", () => {
    const onToolChange = vi.fn();
    renderToolbar({ tool: "bucket", onToolChange });

    fireEvent.click(screen.getByRole("button", { name: "蠟筆" }));
    expect(onToolChange).toHaveBeenCalledWith("crayon");

    fireEvent.click(screen.getByRole("button", { name: "更多" }));
    expect(screen.getByRole("button", { name: "筆刷細" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "筆刷中" })).toHaveProperty(
      "disabled",
      true,
    );
    expect(screen.getByRole("button", { name: "筆刷粗" })).toHaveProperty(
      "disabled",
      true,
    );
  });
});
