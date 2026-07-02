import { describe, expect, it } from "vitest";
import { pngToWebp, resolveTextureHref } from "./png-to-webp";

describe("pngToWebp", () => {
  it("將 .png 副檔名換成 .webp", () => {
    expect(pngToWebp("/adventures/map/sea.png")).toBe("/adventures/map/sea.webp");
    expect(pngToWebp("/adventures/zones/car-park@2x.png")).toBe(
      "/adventures/zones/car-park@2x.webp",
    );
  });
});

describe("resolveTextureHref", () => {
  it("WebP 支援時回 webp 路徑", () => {
    expect(resolveTextureHref("/adventures/map/sea.png", true)).toBe(
      "/adventures/map/sea.webp",
    );
  });

  it("不支援時維持 PNG", () => {
    expect(resolveTextureHref("/adventures/map/sea.png", false)).toBe(
      "/adventures/map/sea.png",
    );
  });
});
