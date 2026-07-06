import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  CLICK_ZOOM_IN_FACTOR,
  CLICK_ZOOM_OUT_FACTOR,
  FIT_MARGIN,
  MAX_SCALE,
  MIN_SCALE,
  clampCamera,
  clampScale,
  fitScaleFor,
  pointerTravelExceeded,
  wheelZoomFactor,
} from "./map-camera-utils";

describe("map-camera-utils", () => {
  it("pointerTravelExceeded 以 6px 為 tap 門檻", () => {
    expect(pointerTravelExceeded(5, 0)).toBe(false);
    expect(pointerTravelExceeded(5, 3)).toBe(false);
    expect(pointerTravelExceeded(6, 0)).toBe(true);
    expect(pointerTravelExceeded(4, 5)).toBe(true);
  });

  it("wheelZoomFactor 向上滾放大、向下滾縮小", () => {
    expect(wheelZoomFactor(-50)).toBeGreaterThan(1);
    expect(wheelZoomFactor(50)).toBeLessThan(1);
  });

  it("click 縮放倍率互為倒數", () => {
    expect(CLICK_ZOOM_IN_FACTOR * CLICK_ZOOM_OUT_FACTOR).toBeCloseTo(1, 5);
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
