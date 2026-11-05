import { describe, expect, it } from "vitest";
import { imageErrored, imageLoaded, NO_IMAGE_FALLBACK } from "@/lib/story-image-fallback";

const A = "/stories/ep-3/01.jpg";
const B = "/stories/ep-3/02.jpg";

describe("播放頁插圖退回狀態", () => {
  it("現代格式失敗：改用 JPG，等 JPG 載好前算等待中，還不算失敗", () => {
    const next = imageErrored(NO_IMAGE_FALLBACK, A, true);
    expect(next.jpgOnly.has(A)).toBe(true);
    expect(next.waitingJpg.has(A)).toBe(true);
    expect(next.failed.has(A)).toBe(false);
  });

  it("JPG 載好：不再等待，也不算失敗", () => {
    const next = imageLoaded(imageErrored(NO_IMAGE_FALLBACK, A, true), A);
    expect(next.jpgOnly.has(A)).toBe(true);
    expect(next.waitingJpg.has(A)).toBe(false);
    expect(next.failed.has(A)).toBe(false);
  });

  it("JPG 也失敗：記成失敗、不再等待（這張不會再有 onLoad，骨架不能一直蓋著）", () => {
    const next = imageErrored(imageErrored(NO_IMAGE_FALLBACK, A, true), A, false);
    expect(next.waitingJpg.has(A)).toBe(false);
    expect(next.failed.has(A)).toBe(true);
  });

  it("每張分開記，不改到傳進來的狀態", () => {
    const first = imageErrored(NO_IMAGE_FALLBACK, A, false);
    const second = imageErrored(first, B, true);
    expect(first.waitingJpg.has(B)).toBe(false);
    expect(second.failed.has(A)).toBe(true);
    expect(second.failed.has(B)).toBe(false);
    expect(NO_IMAGE_FALLBACK.failed.size).toBe(0);
  });

  it("沒在等 JPG 的圖載好：回同一份，不觸發重畫", () => {
    expect(imageLoaded(NO_IMAGE_FALLBACK, A)).toBe(NO_IMAGE_FALLBACK);
  });
});
