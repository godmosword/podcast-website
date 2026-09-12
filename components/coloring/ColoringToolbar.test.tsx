// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColoringToolbar } from "./ColoringToolbar";

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
      showPreview={false}
      onTogglePreview={NOOP}
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
  it("畫具與筆刷是圖示鈕，可及名稱仍是中文", () => {
    renderToolbar();

    for (const name of ["蠟筆", "油漆桶", "橡皮擦"] as const) {
      const btn = screen.getByRole("button", { name });
      expect(btn.textContent).toBe("");
      expect(btn.querySelector("svg")).toBeTruthy();
    }

    for (const name of ["筆刷細", "筆刷中", "筆刷粗"] as const) {
      const btn = screen.getByRole("button", { name });
      expect(btn.textContent).toBe("");
      expect(btn.querySelector("[data-size-dot]")).toBeTruthy();
    }
  });

  it("操作列圖示鈕保留原本可及名稱", () => {
    renderToolbar({ canUndo: false, viewActive: true, showPreview: true });

    expect(screen.getByRole("button", { name: "復原" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "清空" }).querySelector("svg")).toBeTruthy();
    expect(screen.getByRole("button", { name: "縮放還原" })).toHaveProperty(
      "disabled",
      false,
    );
    expect(screen.getByRole("button", { name: "看原圖" }).getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(screen.getByRole("button", { name: "下載" }).querySelector("svg")).toBeTruthy();
  });

  it("點油漆桶會切工具，筆刷三檔此時不可按", () => {
    const onToolChange = vi.fn();
    renderToolbar({ tool: "bucket", onToolChange });

    fireEvent.click(screen.getByRole("button", { name: "蠟筆" }));
    expect(onToolChange).toHaveBeenCalledWith("crayon");

    expect(screen.getByRole("button", { name: "筆刷細" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "筆刷中" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "筆刷粗" })).toHaveProperty("disabled", true);
  });
});
