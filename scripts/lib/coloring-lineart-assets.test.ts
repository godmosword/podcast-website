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

  test("恐龍車多多線稿是大色塊，小格不再鋪滿整頁", async () => {
    const page = COLORING_PAGES.find((item) => item.id === "char-恐龍車多多");
    expect(page).toBeTruthy();
    const path = join(PUBLIC_DIR, page!.lineArtSrc.replace(/^\//, ""));
    const { data, info } = await sharp(path).greyscale().raw().toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;
    const ink = new Uint8Array(width * height);
    for (let i = 0; i < ink.length; i += 1) ink[i] = (data[i] ?? 255) < 128 ? 1 : 0;

    const labels = new Int32Array(ink.length);
    let regions = 0;
    const stack: number[] = [];
    for (let start = 0; start < ink.length; start += 1) {
      if (ink[start] || labels[start]) continue;
      let touchesBorder = false;
      labels[start] = 1;
      stack.push(start);
      while (stack.length > 0) {
        const idx = stack.pop()!;
        const x = idx % width;
        const y = (idx - x) / width;
        if (x === 0 || y === 0 || x === width - 1 || y === height - 1) touchesBorder = true;
        for (const [dx, dy] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ] as const) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
          const next = ny * width + nx;
          if (ink[next] || labels[next]) continue;
          labels[next] = 1;
          stack.push(next);
        }
      }
      if (!touchesBorder) regions += 1;
    }

    // 舊線稿約 156 個內白區；大色塊版本應一眼分得出車身、嘴巴、輪子。
    expect(regions).toBeLessThanOrEqual(50);
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
