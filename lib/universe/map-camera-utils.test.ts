import { describe, expect, it } from "vitest";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  CLICK_ZOOM_IN_FACTOR,
  CLICK_ZOOM_OUT_FACTOR,
  FIT_MARGIN,
  MAX_SCALE,
  MIN_SCALE,
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
});
