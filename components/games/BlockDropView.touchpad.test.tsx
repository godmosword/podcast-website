// @vitest-environment jsdom
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BlockDropKeys,
  MIN_KEY_GAP,
  MIN_KEY_W,
  getLayoutMetrics,
  layoutModeFor,
  type LayoutMode,
} from "./BlockDropControls";

vi.stubGlobal("React", React);

/**
 * 兒童觸控鍵：平常邊長 ≥48px、相鄰鍵間距 ≥12px（計劃 §2 井下鍵列）；
 * 窄到放不下時才縮，但不低於 DESIGN §觸控 的 44px／8px（實際排版由 e2e 量）。
 */
const MIN_KEY = 48;
const MIN_GAP = 12;
const MODES: LayoutMode[] = ["mobile", "tablet", "desktop", "landscape"];

function handlers() {
  return {
    onRotate: vi.fn(),
    onMoveLeftDown: vi.fn(),
    onMoveRightDown: vi.fn(),
    onMoveStop: vi.fn(),
    onDropDown: vi.fn(),
    onDropUp: vi.fn(),
    onHold: vi.fn(),
  };
}

describe("BlockDrop 觸控鍵", () => {
  afterEach(cleanup);

  for (const mode of MODES) {
    it(`${mode}：每顆鍵 ≥ ${MIN_KEY}px、間距 ≥ ${MIN_GAP}px，五顆鍵都有 aria-label`, () => {
      const layout = getLayoutMetrics(mode, true);
      const metrics = layout.keys;
      expect(metrics).not.toBeNull();
      expect(metrics!.key).toBeGreaterThanOrEqual(MIN_KEY);
      expect(metrics!.gap).toBeGreaterThanOrEqual(MIN_GAP);
      expect(layout.keyLayout).toBe(mode === "landscape" ? "sides" : "bar");
      render(
        <BlockDropKeys metrics={metrics!} dropMode="hard" showHold holdType={null} canHold {...handlers()} />,
      );
      for (const name of ["旋轉", "左移", "右移", "落下", "暫存"]) {
        const btn = screen.getByRole("button", { name });
        expect(parseFloat(btn.style.width)).toBeGreaterThanOrEqual(MIN_KEY);
        expect(parseFloat(btn.style.minWidth)).toBeGreaterThanOrEqual(MIN_KEY_W);
        expect(parseFloat(btn.style.height)).toBeGreaterThanOrEqual(MIN_KEY);
      }
    });
  }

  it("滑鼠（非 coarse）不出觸控鍵", () => {
    expect(getLayoutMetrics("mobile", false).keys).toBeNull();
  });

  it("輕鬆冒險：↓ 是「往下（按住快快落）」，按下／放開各呼叫一次；暫存未開放時不顯示", () => {
    const h = handlers();
    render(
      <BlockDropKeys
        metrics={getLayoutMetrics("mobile", true).keys!}
        dropMode="soft"
        showHold={false}
        holdType={null}
        canHold={false}
        dropGlow
        {...h}
      />,
    );
    expect(screen.queryByRole("button", { name: "暫存" })).toBeNull();
    const drop = screen.getByRole("button", { name: "往下（按住快快落）" });
    expect(drop.dataset.glow).toBe("true");
    fireEvent.pointerDown(drop, { pointerId: 1 });
    fireEvent.pointerUp(drop, { pointerId: 1 });
    expect(h.onDropDown).toHaveBeenCalledTimes(1);
    expect(h.onDropUp).toHaveBeenCalledTimes(1);
  });

  it("橫向手機兩側鍵欄：左側只有 ◀ ▶，右側是轉／↓／暫存", () => {
    const metrics = getLayoutMetrics("landscape", true).keys!;
    const { container } = render(
      <>
        <BlockDropKeys metrics={metrics} dropMode="hard" showHold holdType={null} canHold part="left" {...handlers()} />
        <BlockDropKeys metrics={metrics} dropMode="hard" showHold holdType={null} canHold part="right" {...handlers()} />
      </>,
    );
    const left = container.querySelector('[data-part="left"]')!;
    const right = container.querySelector('[data-part="right"]')!;
    expect([...left.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["左移", "右移"]);
    expect([...right.querySelectorAll("button")].map((b) => b.getAttribute("aria-label"))).toEqual(["暫存", "旋轉", "落下"]);
  });

  it("版面判定：矮而寬的手機走橫向，iPad 直向走平板", () => {
    expect(layoutModeFor(844, 390)).toBe("landscape");
    expect(layoutModeFor(844, 340)).toBe("landscape");
    expect(layoutModeFor(390, 664)).toBe("mobile");
    expect(layoutModeFor(768, 1024)).toBe("tablet");
    expect(layoutModeFor(1280, 800)).toBe("desktop");
  });

  it("窄螢幕縮鍵的下限守住 DESIGN §觸控（44px／8px）", () => {
    expect(MIN_KEY_W).toBeGreaterThanOrEqual(44);
    expect(MIN_KEY_GAP).toBeGreaterThanOrEqual(8);
  });
});
