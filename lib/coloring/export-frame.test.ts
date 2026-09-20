import { describe, expect, it } from "vitest";
import { FRAME_SITE_NAME, FRAME_SITE_URL, frameLayout } from "./export-frame";

describe("K-10 著色作品品牌邊框版面", () => {
  it("作品置中於上方、底部留品牌列，吉祥物在右下角落且不壓到作品", () => {
    const L = frameLayout(1024);
    expect(L.art.x).toBe(L.pad);
    expect(L.art.y).toBe(L.pad);
    expect(L.width).toBe(1024 + L.pad * 2);
    expect(L.height).toBeGreaterThan(L.art.y + L.art.size + L.footer.height);
    expect(L.footer.y).toBeGreaterThanOrEqual(L.art.y + L.art.size);
    expect(L.mascot.y).toBeGreaterThanOrEqual(L.footer.y);
    expect(L.mascot.x + L.mascot.width).toBeLessThanOrEqual(L.width - L.pad);
    // 吉祥物依 480×360 等比
    expect(L.mascot.width / L.mascot.height).toBeCloseTo(480 / 360, 1);
    // 文字在左、吉祥物在右，不重疊（站名最寬約 4 個字 × nameSize）
    expect(L.text.x + L.text.nameSize * 4.5).toBeLessThan(L.mascot.x);
  });

  it("版面隨作品尺寸等比縮放", () => {
    const a = frameLayout(512);
    const b = frameLayout(1024);
    expect(b.pad / a.pad).toBeCloseTo(2, 0);
    expect(b.footer.height / a.footer.height).toBeCloseTo(2, 0);
  });

  it("品牌字樣＝站名＋不含協定的網址，沒有任何遊戲化文案", () => {
    expect(FRAME_SITE_NAME).toBe("車車遊樂園");
    expect(FRAME_SITE_URL).toBe("podcast-website-mu.vercel.app");
  });
});
