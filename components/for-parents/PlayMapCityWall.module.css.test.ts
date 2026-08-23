import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 縣市磚牆是頁面層元件，不是 Leaflet overlay，因此不得借用地圖 chrome 的
 * --map-chip*；也不得使用 backdrop-filter／CSS blur()（iOS 合成成本過高，
 * 本頁曾因此 OOM，柔化一律走 SVG feGaussianBlur）。
 */
describe("PlayMapCityWall.module.css 契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "PlayMapCityWall.module.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("不借用地圖 overlay 的 map-chip token", () => {
    expect(css).not.toMatch(/--map-chip/);
  });

  it("不使用 backdrop-filter 與 CSS blur()", () => {
    expect(css).not.toMatch(/backdrop-filter/);
    expect(css).not.toMatch(/\bblur\(/);
  });

  it("磚與收合鍵維持觸控尺寸", () => {
    expect(css).toMatch(/\.tile\s*\{[^}]*min-height:\s*52px/s);
    expect(css).toMatch(/\.collapsedChip\s*\{[^}]*min-height:\s*48px/s);
  });

  it("色深靠 --tile-density 階梯，選中態文字用 accent-ink 而非 accent", () => {
    expect(css).toMatch(/--tile-density/);
    expect(css).toMatch(
      /\.tile\[aria-pressed="true"\]\s*\{[^}]*color:\s*var\(--accent-ink\)/s,
    );
  });

  it("三種磚狀態各有可分辨的視覺，不只靠色深", () => {
    expect(css).toMatch(/\.tile\[data-status="empty"\]\s*\{[^}]*opacity/s);
    expect(css).toMatch(
      /\.tile\[data-status="uncatalogued"\]\s*\{[^}]*border-style:\s*dashed/s,
    );
  });

  it("手機選定縣市後磚牆收合，桌面不收合", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*\.wall\[data-selected="true"\][\s\S]*display:\s*none/,
    );
  });
});
