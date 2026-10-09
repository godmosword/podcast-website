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

  it("家長面板的動作都是圖示磚，縮放還原不在面板裡", () => {
    renderToolbar({ canUndo: false, onPrint: NOOP });

    expect(screen.getByRole("button", { name: "復原" })).toHaveProperty(
      "disabled",
      true,
    );
    openAdultTools();
    for (const name of ["重做", "下載", "列印線稿", "清空"] as const) {
      expect(
        screen.getByRole("button", { name }).querySelector("svg"),
      ).toBeTruthy();
    }
    expect(screen.queryByRole("button", { name: "縮放還原" })).toBeNull();
    expect(screen.queryByRole("button", { name: "故事照片" })).toBeNull();
  });

  it("家長面板分三塊設定，每塊都有標題", () => {
    renderToolbar();
    openAdultTools();

    const dialog = screen.getByRole("dialog", { name: "家長工具" });
    for (const name of ["筆刷粗細", "塗法", "色盤"] as const) {
      expect(
        dialog.querySelector(`[role="group"][aria-label="${name}"]`),
      ).toBeTruthy();
      expect(screen.getByRole("heading", { name })).toBeTruthy();
    }
    expect(dialog.textContent).toContain("作品只存在這台裝置");
  });

  it("塗法與色盤點了會回報，選中的那個標 aria-pressed", () => {
    const onGuidedChange = vi.fn();
    const onColorGroupChange = vi.fn();
    renderToolbar({
      guided: true,
      colorGroup: "all",
      onGuidedChange,
      onColorGroupChange,
    });
    openAdultTools();

    const guidedBtn = screen.getByRole("button", { name: /^不出線/ });
    expect(guidedBtn.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: /^自由塗/ }));
    expect(onGuidedChange).toHaveBeenCalledWith(false);

    const all = screen.getByRole("button", { name: "全部" });
    expect(all.getAttribute("aria-pressed")).toBe("true");
    expect(all.querySelectorAll("[data-swatch]")).toHaveLength(12);
    const rainbow = screen.getByRole("button", { name: "彩虹" });
    expect(rainbow.querySelectorAll("[data-swatch]")).toHaveLength(6);
    fireEvent.click(rainbow);
    expect(onColorGroupChange).toHaveBeenCalledWith("rainbow");
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
        screen.getByRole("dialog", { name: "家長工具" }),
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
