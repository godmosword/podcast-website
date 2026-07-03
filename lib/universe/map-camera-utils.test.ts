import { describe, expect, it } from "vitest";
import {
  CLICK_ZOOM_IN_FACTOR,
  CLICK_ZOOM_OUT_FACTOR,
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
});
