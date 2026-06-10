import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_COLORS,
  PLATFORM_MARKS,
  PLATFORM_MARK_TILE,
} from "./brand-assets";

const BRAND_DIR = join(process.cwd(), "public/brand");

describe("brand assets compliance", () => {
  it("uses KKBOX official blue not legacy hex", () => {
    expect(BRAND_COLORS.kkbox).toBe("#09CEF6");
    expect(BRAND_COLORS.kkbox).not.toBe("#0073E6");
  });

  it("registers official asset files on disk", () => {
    for (const mark of Object.values(PLATFORM_MARKS)) {
      const file = join(BRAND_DIR, mark.src.replace("/brand/", ""));
      expect(readFileSync(file).byteLength).toBeGreaterThan(0);
    }
  });

  it("apple mark is official badge svg not purple tile", () => {
    expect(PLATFORM_MARKS.apple.src).toContain("apple-podcasts-listen-badge");
    const svg = readFileSync(
      join(BRAND_DIR, "apple-podcasts-listen-badge-zh-hant.svg"),
      "utf8",
    );
    expect(svg).toContain("<svg");
    expect(svg).toContain('viewBox="0 0 164.8566 40"');
    expect(svg).not.toContain("circle cx=\"12\"");
  });

  it("kkbox svg contains brand standard color", () => {
    const svg = readFileSync(join(BRAND_DIR, "kkbox-logo.svg"), "utf8");
    expect(svg.toLowerCase()).toContain("#09cef6");
  });

  it("spotify mark uses official png not hand-drawn path", () => {
    expect(PLATFORM_MARKS.spotify.src).toMatch(/spotify-icon-green\.png$/);
  });

  it("uses a single shared tile size for all platforms", () => {
    expect(PLATFORM_MARK_TILE.widthPx).toBeGreaterThanOrEqual(44);
    expect(PLATFORM_MARK_TILE.heightPx).toBeGreaterThanOrEqual(44);
    expect(PLATFORM_MARK_TILE.imageMaxHeightPx).toBeLessThan(
      PLATFORM_MARK_TILE.heightPx,
    );
  });
});
