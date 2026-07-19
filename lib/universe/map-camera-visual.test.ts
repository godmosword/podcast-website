// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  PARALLAX_NEAR,
  SEA_TILE,
  applyParallaxCamera,
  applySeaCamera,
  applyStageCamera,
} from "./map-camera-visual";

describe("map-camera-visual", () => {
  const cam = { scale: 1.5, tx: 40, ty: -20 };
  const meta = {
    isAnimating: false,
    flyDurationMs: 600,
    reducedMotion: false,
  };

  it("applyStageCamera 寫入 transform 與 CSS 變數", () => {
    const el = document.createElement("div");
    applyStageCamera(el, cam, meta);
    expect(el.style.transform).toBe("translate(40px, -20px) scale(1.5)");
    expect(el.style.getPropertyValue("--map-scale")).toBe("1.5");
    expect(el.style.getPropertyValue("--label-offset-y")).toBe("6px");
    expect(el.style.transition).toBe("none");
  });

  it("遠距 scale 時標籤上移", () => {
    const el = document.createElement("div");
    applyStageCamera(el, { scale: 0.4, tx: 0, ty: 0 }, meta);
    expect(el.style.getPropertyValue("--label-offset-y")).toBe("-140px");
  });

  it("applySeaCamera 跟隨 scale／平移", () => {
    const el = document.createElement("div");
    applySeaCamera(el, cam, meta);
    expect(el.style.backgroundSize).toBe(`${SEA_TILE * 1.5}px ${SEA_TILE * 1.5}px`);
    expect(el.style.backgroundPosition).toBe("40px -20px");
  });

  it("applyParallaxCamera 使用近景係數", () => {
    const el = document.createElement("div");
    applyParallaxCamera(el, cam, meta);
    const pScale = 1 + (1.5 - 1) * PARALLAX_NEAR;
    expect(el.style.transform).toBe(
      `translate(${40 * PARALLAX_NEAR}px, ${-20 * PARALLAX_NEAR}px) scale(${pScale})`,
    );
  });
});
