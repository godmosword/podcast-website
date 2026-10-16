import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND_MARKS, type BrandMarkId } from "./brand-marks";
import { visiblePlatforms } from "./platforms";

/** 品牌硬規則（lib/BRAND-ASSETS-HARD-RULES.md）的程式守門。 */
const ROOT = join(import.meta.dirname, "..");

function sourceFiles(dir: string): string[] {
  return readdirSync(join(ROOT, dir)).flatMap((name) => {
    const path = join(ROOT, dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(relative(ROOT, path));
    return /\.(tsx?|css)$/.test(name) && !/\.test\.tsx?$/.test(name) ? [path] : [];
  });
}

const RUNTIME = [...sourceFiles("components"), ...sourceFiles("app")].map((path) => ({
  path: relative(ROOT, path),
  text: readFileSync(path, "utf8"),
}));

describe("品牌硬規則", () => {
  it("不再有手繪平台圖示或 BrandSvg", () => {
    const hits = RUNTIME.filter(({ text }) => /PLATFORM_ICON_PATHS|BrandSvg|connect-icons/.test(text));
    expect(hits.map((h) => h.path)).toEqual([]);
  });

  it("不得拿平台／社群資料的品牌色當底色", () => {
    const pattern =
      /background(?:Color)?\s*:\s*(?:\w+\.)?(?:p|platform|s|social|item)\.(?:color|background)\b/;
    const hits = RUNTIME.filter(({ text }) => pattern.test(text));
    expect(hits.map((h) => h.path)).toEqual([]);
  });

  it("元件不引用 Apple 徽章（同頁不得同時出現徽章與圖示）", () => {
    const hits = RUNTIME.filter(({ text }) => text.includes("apple-podcasts-listen-badge"));
    expect(hits.map((h) => h.path)).toEqual([]);
  });

  it("頻道與其他平台並列時 Apple Podcasts 排第一", () => {
    expect(visiblePlatforms()[0]?.label).toBe("Apple Podcasts");
  });

  it("硬規則檔存在，SOURCES.md 登記了每個用到的官方檔", () => {
    const rules = readFileSync(join(ROOT, "lib/BRAND-ASSETS-HARD-RULES.md"), "utf8");
    expect(rules).toMatch(/查證日：2026-10-12/);
    const sources = readFileSync(join(ROOT, "public/brand/SOURCES.md"), "utf8");
    for (const id of Object.keys(BRAND_MARKS) as BrandMarkId[]) {
      for (const art of Object.values(BRAND_MARKS[id].art)) {
        if (art.kind !== "image") continue;
        expect(sources, art.src).toContain(art.src.replace("/brand/", ""));
      }
    }
  });
});
