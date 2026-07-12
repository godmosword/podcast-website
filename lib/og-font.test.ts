import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { loadOgFont, OG_FONT_FAMILY, ogFontOptions } from "./og-font";

const FONT_PATH = join(process.cwd(), "app/fonts/noto-sans-tc-og.ttf");

describe("og-font", () => {
  it("bundled TTF 存在且非空", () => {
    const stat = readFileSync(FONT_PATH);
    expect(stat.byteLength).toBeGreaterThan(100_000);
  });

  it("loadOgFont 回傳非空 buffer（不依賴網路）", async () => {
    const buf = await loadOgFont();
    expect(buf.byteLength).toBeGreaterThan(100_000);
  });

  it("ogFontOptions 提供 400／700 兩組", async () => {
    const buf = await loadOgFont();
    const opts = ogFontOptions(buf);
    expect(opts).toHaveLength(2);
    expect(opts.every((o) => o.name === OG_FONT_FAMILY)).toBe(true);
    expect(opts.map((o) => o.weight)).toEqual([400, 700]);
  });

  it("OG 模組不得再 fetch fonts.gstatic.com", () => {
    const storyOg = readFileSync(join(process.cwd(), "lib/story-og.tsx"), "utf8");
    const ogFont = readFileSync(join(process.cwd(), "lib/og-font.ts"), "utf8");
    expect(storyOg).not.toContain("fonts.gstatic.com");
    expect(ogFont).not.toContain("fonts.gstatic.com");
  });
});
