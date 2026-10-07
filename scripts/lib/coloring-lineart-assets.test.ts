import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import { COLORING_PAGES } from "@/data/coloring-pages";
import {
  COLORING_LINEART_MAX_SIDE,
  evaluateLineArtGate,
} from "./coloring-lineart";
import { REFERENCE_RECIPES } from "./coloring-reference-overrides";

const PUBLIC_DIR = join(process.cwd(), "public");

describe("coloring lineart assets contract", () => {
  test("每頁 line.png 存在、尺寸合格", async () => {
    for (const page of COLORING_PAGES) {
      const path = join(PUBLIC_DIR, page.lineArtSrc.replace(/^\//, ""));
      expect(existsSync(path), path).toBe(true);
      expect(statSync(path).size).toBeGreaterThan(2000);

      const meta = await sharp(path).metadata();
      expect(meta.width ?? 0).toBeGreaterThan(0);
      expect(meta.height ?? 0).toBeGreaterThan(0);
      expect(meta.width ?? 0).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
      expect(meta.height ?? 0).toBeLessThanOrEqual(COLORING_LINEART_MAX_SIDE);
    }
  });

  test("全部線稿過品質 gate（白底、不透明、雙峰、覆蓋率、噪點、漏色；依 kind 分檔）", async () => {
    for (const page of COLORING_PAGES) {
      const path = join(PUBLIC_DIR, page.lineArtSrc.replace(/^\//, ""));
      const buf = await sharp(readFileSync(path)).png().toBuffer();
      const { ok, problems } = await evaluateLineArtGate(buf, page.kind);
      expect(ok, `${page.id}: ${problems.join("; ")}`).toBe(true);
    }
  });

  test("每頁參考彩圖 color.webp 存在、與線稿同比例", async () => {
    for (const page of COLORING_PAGES) {
      const ref = join(PUBLIC_DIR, page.referenceSrc.replace(/^\//, ""));
      expect(existsSync(ref), ref).toBe(true);
      const [color, line] = await Promise.all([
        sharp(ref).metadata(),
        sharp(join(PUBLIC_DIR, page.lineArtSrc.replace(/^\//, ""))).metadata(),
      ]);
      expect(color.format, page.id).toBe("webp");
      expect((color.width ?? 0) / (color.height ?? 1)).toBeCloseTo(
        (line.width ?? 0) / (line.height ?? 1),
        3,
      );
    }
  });

  test("修色配方只指向現有頁面", () => {
    const ids = new Set(COLORING_PAGES.map((p) => p.id));
    for (const id of Object.keys(REFERENCE_RECIPES)) expect(ids.has(id), id).toBe(true);
  });

  test("遊樂園封面 cover.webp 為 1448×1086 webp", async () => {
    const cover = join(PUBLIC_DIR, "games/v2/coloring-book/cover.webp");
    expect(existsSync(cover)).toBe(true);
    expect(statSync(cover).size).toBeGreaterThan(1000);
    const meta = await sharp(cover).metadata();
    expect(meta.format).toBe("webp");
    expect(meta.width).toBe(1448);
    expect(meta.height).toBe(1086);
  });
});
