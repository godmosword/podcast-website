import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import sharp from "sharp";
import { COLORING_PAGES } from "@/data/coloring-pages";
import {
  COLORING_LINEART_MAX_SIDE,
  evaluateLineArtGate,
} from "./coloring-lineart";

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

  test("全 8 頁過品質 gate（白底、不透明、雙峰、覆蓋率、噪點、漏色；依 kind 分檔）", async () => {
    for (const page of COLORING_PAGES) {
      const path = join(PUBLIC_DIR, page.lineArtSrc.replace(/^\//, ""));
      const buf = await sharp(readFileSync(path)).png().toBuffer();
      const { ok, problems } = await evaluateLineArtGate(buf, page.kind);
      expect(ok, `${page.id}: ${problems.join("; ")}`).toBe(true);
    }
  });

  test("遊樂園封面 cover.webp 存在", () => {
    const cover = join(PUBLIC_DIR, "games/v2/coloring-book/cover.webp");
    expect(existsSync(cover)).toBe(true);
    expect(statSync(cover).size).toBeGreaterThan(1000);
  });
});
