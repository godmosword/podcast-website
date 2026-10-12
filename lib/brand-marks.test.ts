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

  it("只有 Meta 三家是過渡用的 inline 圖形；Email 是自有圖示", () => {
    const interim = (Object.keys(BRAND_MARKS) as BrandMarkId[]).filter(
      (id) => BRAND_MARKS[id].interim,
    );
    expect(interim.sort()).toEqual(["facebook", "instagram", "threads"]);
    expect(BRAND_MARKS.email.own).toBe(true);
    for (const id of ["apple", "spotify", "kkbox", "youtube"] as const) {
      for (const surface of SURFACES) {
        expect(BRAND_MARKS[id].art[surface].kind, `${id}/${surface}`).toBe("image");
      }
    }
  });
});

describe("BRAND_MARKS 色版", () => {
  it("Spotify：白章用綠、其他淺色底用黑、深色底用白", () => {
    expect(imageSrc("spotify", "white")).toBe("/brand/spotify-icon-green.png");
    expect(imageSrc("spotify", "light")).toBe("/brand/spotify-icon-black.png");
    expect(imageSrc("spotify", "dark")).toBe("/brand/spotify-icon-white.png");
  });

  it("KKBOX：白章用標準青、其他淺色底用黑、深色底用白", () => {
    expect(imageSrc("kkbox", "white")).toBe("/brand/kkbox-logo.svg");
    expect(imageSrc("kkbox", "light")).toBe("/brand/kkbox-logo-black.svg");
    expect(imageSrc("kkbox", "dark")).toBe("/brand/kkbox-logo-white.svg");
  });

  it("Apple、YouTube 三種底都用同一個官方彩色檔", () => {
    for (const surface of SURFACES) {
      expect(imageSrc("apple", surface)).toBe("/brand/apple-podcasts-icon.png");
      expect(imageSrc("youtube", surface)).toBe("/brand/youtube-icon.svg");
    }
  });

  it("Threads、Instagram 深色底改白色版；日間 Threads 黑、Instagram 漸層", () => {
    const tone = (id: BrandMarkId, surface: BrandMarkSurface) => {
      const art = BRAND_MARKS[id].art[surface];
      return art.kind === "inline" ? art.tone : null;
    };
    expect(tone("threads", "white")).toBe("black");
    expect(tone("threads", "light")).toBe("black");
    expect(tone("threads", "dark")).toBe("white");
    expect(tone("instagram", "white")).toBe("gradient");
    expect(tone("instagram", "dark")).toBe("white");
    expect(tone("facebook", "dark")).toBe("brand");
  });
});

describe("brandMarkBox 尺寸下限", () => {
  const box = (id: BrandMarkId) => brandMarkBox(id, BRAND_MARK_SIZE);

  it("全站統一視覺尺寸 30px", () => {
    expect(BRAND_MARK_SIZE).toBe(30);
    for (const id of ["apple", "spotify", "instagram", "threads", "facebook"] as const) {
      expect(box(id), id).toEqual({ width: 30, height: 30 });
    }
  });

  it("各家最小尺寸：Spotify 21、Instagram 29、YouTube 高 20、Facebook 寬 16", () => {
    expect(box("spotify").height).toBeGreaterThanOrEqual(21);
    expect(box("instagram").height).toBeGreaterThanOrEqual(29);
    expect(box("youtube").height).toBeGreaterThanOrEqual(20);
    expect(box("facebook").width).toBeGreaterThanOrEqual(16);
  });

  it("YouTube、KKBOX 依官方檔比例換算，不變形", () => {
    const yt = box("youtube");
    expect(yt.width / yt.height).toBeCloseTo(158 / 110, 2);
    const kk = box("kkbox");
    expect(kk.width).toBe(38);
    expect(kk.width / kk.height).toBeCloseTo(786 / 164, 2);
  });
});
