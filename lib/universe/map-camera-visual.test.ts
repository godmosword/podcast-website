// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import {
  PARALLAX_FAR,
  PARALLAX_NEAR,
  SEA_TILE,
  SKY_MAX_DRIFT,
  applyParallaxCamera,
  applySeaCamera,
  applySkyCamera,
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

  it("applySkyCamera 用遠景係數，且比近景雲移動得少", () => {
    const el = document.createElement("div");
    applySkyCamera(el, cam, meta);
    expect(el.style.transform).toBe(
      `translate(${40 * PARALLAX_FAR}px, ${-20 * PARALLAX_FAR}px)`,
    );
    expect(Math.abs(40 * PARALLAX_FAR)).toBeLessThan(Math.abs(40 * PARALLAX_NEAR));
  });

  it("applySkyCamera 夾住位移，日月不會被平移推出視窗", () => {
    const el = document.createElement("div");
    // 世界可平移數千 px；未夾住的話月亮（及其水面月光）會整顆離開畫面。
    applySkyCamera(el, { scale: 1, tx: 9000, ty: -9000 }, meta);
    expect(el.style.transform).toBe(
      `translate(${SKY_MAX_DRIFT}px, ${-SKY_MAX_DRIFT}px)`,
    );
  });

  it("applySkyCamera 在 reduced-motion 下完全不位移", () => {
    const el = document.createElement("div");
    applySkyCamera(el, cam, { ...meta, reducedMotion: true });
    expect(el.style.transform).toBe("none");
  });

  it("applySkyCamera 不縮放：天象遠到不該跟著 zoom 變大", () => {
    const el = document.createElement("div");
    applySkyCamera(el, { scale: 2.4, tx: 0, ty: 0 }, meta);
    expect(el.style.transform).not.toContain("scale");
  });
});
