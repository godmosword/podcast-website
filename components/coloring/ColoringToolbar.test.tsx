// @vitest-environment jsdom
import type { ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ColoringToolbar } from "./ColoringToolbar";
import { BucketIcon, CrayonIcon, EraserIcon } from "./ColoringToolbarIcons";

afterEach(() => {
  cleanup();
});

const NOOP = () => {};

function openAdultTools() {
  fireEvent.keyDown(screen.getByRole("button", { name: "家長工具" }), {
    key: "Enter",
  });
}

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
  it("畫具有圖示，名字留給讀螢幕", () => {
    renderToolbar();

    for (const name of ["蠟筆", "填滿", "擦掉"] as const) {
      const btn = screen.getByRole("button", { name });
      expect(btn.querySelector("[data-sr]")?.textContent).toBe(name);
      expect(btn.querySelector("svg")).toBeTruthy();
    }

    openAdultTools();
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
    openAdultTools();
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

  it("清空要看圖確認，留下顏色不會清掉", () => {
    const onClear = vi.fn();
    renderToolbar({ onClear });
    openAdultTools();
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "先不要清空" }));
    expect(onClear).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "清空" }));
    fireEvent.click(screen.getByRole("button", { name: "清空畫布" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("短按家長工具不會打開，按住才會", () => {
    vi.useFakeTimers();
    try {
      renderToolbar();
      const gate = screen.getByRole("button", { name: "家長工具" });
      fireEvent.click(gate);
      expect(screen.queryByRole("dialog")).toBeNull();
      fireEvent.pointerDown(gate);
      act(() => {
        vi.advanceTimersByTime(699);
      });
      expect(screen.queryByRole("dialog")).toBeNull();
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(
        screen.getByRole("dialog", { name: "更多著色工具" }),
      ).toBeTruthy();
    } finally {
      vi.useRealTimers();
    }
  });

  it("點填滿會切工具，筆刷三檔此時不可按", () => {
    const onToolChange = vi.fn();
    renderToolbar({ tool: "bucket", onToolChange });

    fireEvent.click(screen.getByRole("button", { name: "蠟筆" }));
    expect(onToolChange).toHaveBeenCalledWith("crayon");

    openAdultTools();
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
