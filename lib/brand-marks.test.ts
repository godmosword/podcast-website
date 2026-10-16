import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_MARKS,
  BRAND_MARK_SIZE,
  brandMarkBox,
  type BrandMarkId,
  type BrandMarkSurface,
} from "./brand-marks";

const PUBLIC = join(import.meta.dirname, "..", "public");
const SURFACES: BrandMarkSurface[] = ["white", "light", "dark"];

function imageSrc(id: BrandMarkId, surface: BrandMarkSurface): string | null {
  const art = BRAND_MARKS[id].art[surface];
  return art.kind === "image" ? art.src : null;
}

describe("BRAND_MARKS 官方檔", () => {
  it("每個圖片標誌都指向 public/brand/ 內存在的檔案", () => {
    for (const id of Object.keys(BRAND_MARKS) as BrandMarkId[]) {
      for (const surface of SURFACES) {
        const src = imageSrc(id, surface);
        if (!src) continue;
        expect(src, `${id}/${surface}`).toMatch(/^\/brand\//);
        expect(existsSync(join(PUBLIC, src)), `${id}/${surface} → ${src}`).toBe(true);
      }
    }
  });

  it("平台與社群標誌都是官方圖檔；只有 Email 是自有圖示", () => {
    const interim = (Object.keys(BRAND_MARKS) as BrandMarkId[]).filter(
      (id) => BRAND_MARKS[id].interim,
    );
    expect(interim).toEqual([]);
    expect(BRAND_MARKS.email.own).toBe(true);
    for (const id of ["apple", "spotify", "kkbox", "youtube", "instagram", "threads", "facebook"] as const) {
      for (const surface of SURFACES) {
        expect(BRAND_MARKS[id].art[surface].kind, `${id}/${surface}`).toBe("image");
      }
    }
  });
});

describe("BRAND_MARKS 色版", () => {
  it("Spotify：白與淺色底用官方綠標、深色底用白標", () => {
    expect(imageSrc("spotify", "white")).toBe("/brand/spotify-icon-green.png");
    expect(imageSrc("spotify", "light")).toBe("/brand/spotify-icon-green.png");
    expect(imageSrc("spotify", "dark")).toBe("/brand/spotify-icon-white.png");
  });

  it("KKBOX：白章用標準青、其他淺色底用黑、深色底用白", () => {
    expect(imageSrc("kkbox", "white")).toBe("/brand/kkbox-logo.svg");
    expect(imageSrc("kkbox", "light")).toBe("/brand/kkbox-logo-black.svg");
    expect(imageSrc("kkbox", "dark")).toBe("/brand/kkbox-logo-white.svg");
  });

  it("Apple 三種底都用官方圖示；YouTube 用完整字標，深色底換白字檔", () => {
    for (const surface of SURFACES) {
      expect(imageSrc("apple", surface)).toBe("/brand/apple-podcasts-icon.png");
    }
    expect(imageSrc("youtube", "white")).toBe("/brand/youtube-logo.svg");
    expect(imageSrc("youtube", "light")).toBe("/brand/youtube-logo.svg");
    expect(imageSrc("youtube", "dark")).toBe("/brand/youtube-logo-dark.svg");
  });

  it("Instagram、Facebook 用官方檔；Threads 淺色黑、深色白", () => {
    for (const surface of SURFACES) {
      expect(imageSrc("instagram", surface)).toBe("/brand/instagram-glyph-gradient.png");
      expect(imageSrc("facebook", surface)).toBe("/brand/facebook-logo-primary.png");
    }
    expect(imageSrc("threads", "white")).toBe("/brand/threads-logo-black.svg");
    expect(imageSrc("threads", "light")).toBe("/brand/threads-logo-black.svg");
    expect(imageSrc("threads", "dark")).toBe("/brand/threads-logo-white.svg");
  });
});

describe("brandMarkBox 尺寸下限", () => {
  const box = (id: BrandMarkId) => brandMarkBox(id, BRAND_MARK_SIZE);

  it("全站統一視覺尺寸 30px", () => {
    expect(BRAND_MARK_SIZE).toBe(30);
    for (const id of ["apple", "spotify", "instagram", "facebook"] as const) {
      expect(box(id), id).toEqual({ width: 30, height: 30 });
    }
  });

  it("各家最小尺寸：Spotify 21、Instagram 29、YouTube 高 20、Facebook 寬 16", () => {
    expect(box("spotify").height).toBeGreaterThanOrEqual(21);
    expect(box("instagram").height).toBeGreaterThanOrEqual(29);
    expect(box("youtube").height).toBeGreaterThanOrEqual(20);
    expect(box("facebook").width).toBeGreaterThanOrEqual(16);
  });

  it("YouTube、KKBOX、Threads 依官方檔比例換算，不變形", () => {
    const yt = box("youtube");
    expect(yt.width).toBe(108);
    expect(yt.height).toBeGreaterThanOrEqual(20);
    expect(yt.width / yt.height).toBeCloseTo(492 / 110, 2);
    const kk = box("kkbox");
    expect(kk.width).toBe(38);
    expect(kk.width / kk.height).toBeCloseTo(786 / 164, 2);
    const threads = box("threads");
    expect(threads.width).toBe(27);
    expect(threads.width / threads.height).toBeCloseTo(977 / 1082, 2);
  });
});
