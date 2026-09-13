import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { pngToWebp } from "./png-to-webp";

describe("pngToWebp", () => {
  it("將 .png 副檔名換成 .webp", () => {
    expect(pngToWebp("/adventures/map/sea.png")).toBe("/adventures/map/sea.webp");
    expect(pngToWebp("/adventures/zones/car-park@2x.png")).toBe(
      "/adventures/zones/car-park@2x.webp",
    );
  });
});

/**
 * 回歸鎖：SVG `<image href>` 不能用 `<picture>`，一旦有人把貼圖 href 改回
 * 「先 PNG、effect 之後再換 webp」，SSR 與首次繪製就會讓 preload scanner
 * 抓走 1.9MB 的 sea.png，webp 變成第二次下載。
 */
describe("宇宙地圖 SVG 貼圖一律直接給 webp", () => {
  const ROOT = join(import.meta.dirname, "..", "..");
  const read = (p: string) => readFileSync(join(ROOT, p), "utf8");

  it("UniverseMap 的海面 href 不留 PNG 路徑", () => {
    const src = read("components/universe/UniverseMap.tsx");
    expect(src).toMatch(/seaDayHref\s*=\s*pngToWebp\(/);
    expect(src).toMatch(/seaNightHref\s*=\s*pngToWebp\(/);
    expect(src).not.toContain("useWebpSupported");
  });

  it("視差雲層 href 不留 PNG 路徑", () => {
    const src = read("components/universe/UniverseMapParallax.tsx");
    expect(src).toMatch(/href=\{pngToWebp\(cloudPath\(/);
    expect(src).not.toContain("useWebpSupported");
  });
});
