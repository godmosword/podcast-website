import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  FIT_MARGIN,
  MAX_SCALE,
  MIN_SCALE,
  clampCamera,
  clampScale,
  fitScaleFor,
  wheelZoomFactor,
} from "./map-camera-utils";

describe("map-camera-utils", () => {
  it("wheelZoomFactor 向上滾放大、向下滾縮小", () => {
    expect(wheelZoomFactor(-50)).toBeGreaterThan(1);
    expect(wheelZoomFactor(50)).toBeLessThan(1);
  });

  it("clampScale 夾在 MIN_SCALE–MAX_SCALE", () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(99)).toBe(MAX_SCALE);
    expect(clampScale(1)).toBe(1);
  });

  it("fitScaleFor 為 contain-fit × FIT_MARGIN", () => {
    // 寬受限（窄直向視窗）
    expect(fitScaleFor(2000, 3000)).toBeCloseTo(
      (2000 / MAP_STAGE.width) * FIT_MARGIN,
      6,
    );
    // 高受限（寬橫向視窗）
    expect(fitScaleFor(5000, 1440)).toBeCloseTo(
      (1440 / MAP_STAGE.height) * FIT_MARGIN,
      6,
    );
  });

  it("fitScaleFor 邊界：0 尺寸回 1、極端尺寸夾 clamp", () => {
    expect(fitScaleFor(0, 800)).toBe(1);
    expect(fitScaleFor(1280, 0)).toBe(1);
    expect(fitScaleFor(100, 100)).toBe(MIN_SCALE);
    expect(fitScaleFor(100000, 100000)).toBe(MAX_SCALE);
  });

  it("clampCamera 在舞台放得下時置中", () => {
    expect(clampCamera({ scale: 1, tx: 999, ty: -999 }, 1280, 900)).toEqual({
      scale: 1,
      tx: (1280 - MAP_STAGE.width) / 2,
      ty: (900 - MAP_STAGE.height) / 2,
    });
  });

  it("clampCamera 允許放大後的角落島置中", () => {
    const scale = 1.6;
    const viewport = { w: 375, h: 667 };
    const dino = { x: 210, y: 260 };

    expect(
      clampCamera(
        {
          scale,
          tx: viewport.w / 2 - dino.x * scale,
          ty: viewport.h / 2 - dino.y * scale,
        },
        viewport.w,
        viewport.h,
      ),
    ).toEqual({
      scale,
      tx: viewport.w / 2 - dino.x * scale,
      ty: viewport.h / 2 - dino.y * scale,
    });
  });

  it("clampCamera 於 FOCUS_SCALE 保留 dock offset（舞台大於視窗時不吃掉 viewportOffsetY）", () => {
    // T6 點島置中一致化：第一次點擊 fly-to 帶 dock offset，第二次開 sheet 不再位移。
    // 前提是 clampCamera 在舞台大於視窗（此處 1000×720 × 1.6 = 1600×1152）時，
    // 不會把 flyTo 算出的含 offset ty 夾回置中。tested viewports 375/1280 皆成立。
    const scale = 1.6;
    const offsetY = 96;
    const dino = { x: 210, y: 260 };
    for (const viewport of [
      { w: 375, h: 667 },
      { w: 1280, h: 800 },
    ]) {
      const tx = viewport.w / 2 - dino.x * scale;
      const ty = viewport.h / 2 - dino.y * scale + offsetY;
      expect(clampCamera({ scale, tx, ty }, viewport.w, viewport.h)).toEqual({
        scale,
        tx,
        ty,
      });
    }
  });

  it("clampCamera 夾住超出可置中範圍的平移", () => {
    const scale = 1.6;
    expect(clampCamera({ scale, tx: 9999, ty: 9999 }, 375, 667)).toEqual({
      scale,
      tx: 375 / 2,
      ty: 667 / 2,
    });
    expect(clampCamera({ scale, tx: -9999, ty: -9999 }, 375, 667)).toEqual({
      scale,
      tx: 375 / 2 - MAP_STAGE.width * scale,
      ty: 667 / 2 - MAP_STAGE.height * scale,
    });
  });
});
