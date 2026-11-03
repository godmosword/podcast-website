import { describe, expect, it } from "vitest";
import { CANVAS_PIXEL_BUDGET, canvasDpr } from "@/lib/games/orange-express/canvas-dpr";

describe("前窗畫布解析度（PR-I2）", () => {
  it("手機前窗（比 360 窄也一樣）在 3 倍螢幕上用 2 倍，不再固定 1 倍", () => {
    expect(canvasDpr(349, 114, 3)).toBe(2);
    expect(canvasDpr(365, 409, 3)).toBe(2);
  });

  it("大畫布照像素預算往下收；1 倍螢幕、省流量模式都是 1 倍", () => {
    const desktop = canvasDpr(1256, 380, 2);
    expect(desktop).toBeLessThan(2);
    expect(1256 * 380 * desktop * desktop).toBeLessThanOrEqual(CANVAS_PIXEL_BUDGET + 1);
    expect(canvasDpr(365, 409, 1)).toBe(1);
    expect(canvasDpr(365, 409, 3, true)).toBe(1);
  });

  it("再大的畫布也不低於 1 倍；量不到大小時保守用 1 倍", () => {
    expect(canvasDpr(4000, 2000, 2)).toBe(1);
    expect(canvasDpr(0, 200, 3)).toBe(1);
    expect(canvasDpr(-5, 200, 3)).toBe(1);
    expect(canvasDpr(Number.NaN, 200, 3)).toBe(1);
  });
});
