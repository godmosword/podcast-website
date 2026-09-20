// @vitest-environment jsdom
import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getLayoutMetrics, TouchControlPad, type LayoutMode } from "./BlockDropView";

vi.stubGlobal("React", React);

const MIN_TOUCH = 44;
const MODES: LayoutMode[] = ["mobile", "tablet", "desktop"];

/** G-H2：方塊觸控鍵每顆都要 ≥44px（DESIGN 觸控紅線），左右鍵不得再 half 併排成 29px。 */
describe("BlockDrop 觸控鍵尺寸", () => {
  afterEach(cleanup);

  for (const mode of MODES) {
    it(`${mode}：每顆觸控鍵寬高皆 ≥ ${MIN_TOUCH}px`, () => {
      const metrics = getLayoutMetrics(mode, true).touch;
      expect(metrics).not.toBeNull();
      render(
        <TouchControlPad
          metrics={metrics!}
          holdType={null}
          canHold
          onRotate={() => {}}
          onMoveLeftDown={() => {}}
          onMoveRightDown={() => {}}
          onMoveStop={() => {}}
          onDrop={() => {}}
          onHold={() => {}}
        />,
      );
      for (const name of ["旋轉", "左移", "右移", "落下", "暫存"]) {
        const btn = screen.getByRole("button", { name });
        // 寬度＝側欄 colW（100%），高度＝btn
        expect(btn.style.width).toBe("100%");
        expect(metrics!.colW).toBeGreaterThanOrEqual(MIN_TOUCH);
        expect(parseFloat(btn.style.height)).toBeGreaterThanOrEqual(MIN_TOUCH);
      }
    });
  }
});
