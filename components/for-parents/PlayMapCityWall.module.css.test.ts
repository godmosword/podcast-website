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

  it("色深靠 --tile-density 階梯", () => {
    expect(css).toMatch(/--tile-density/);
  });

  it("選中態用實心底，不把文字疊在浮動的密度底色上", () => {
    // --accent-ink 疊在最深的密度底上只有 3.71:1，而 axe 掃不到這個組合
    // （預設狀態沒有磚被選中）。實心底把選中態與密度階梯解耦。
    expect(css).toMatch(
      /\.tile\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--accent-ink\)/s,
    );
    // (?<![-\w]) 避免把 border-color 誤判成 color。
    expect(css).not.toMatch(
      /\.tile\[aria-pressed="true"\]\s*\{[^}]*(?<![-\w])color:\s*var\(--accent-ink\)/s,
    );
  });

  it("夜間的實心選中底另給深色前景（--accent-ink 在夜間是淺色）", () => {
    expect(css).toMatch(
      /\[data-theme="night"\]\)?\s*\.tile\[aria-pressed="true"\]\s*\{[^}]*color:\s*var\(--bg\)/s,
    );
  });

  it("三種磚狀態各有可分辨的視覺，不只靠色深", () => {
    expect(css).toMatch(
      /\.tile\[data-status="empty"\]\s*\{[^}]*border-color/s,
    );
    expect(css).toMatch(
      /\.tile\[data-status="uncatalogued"\]\s*\{[^}]*border-style:\s*dashed/s,
    );
  });

  it("磚狀態不靠 opacity 降階，避免連文字對比一起吃掉", () => {
    expect(css).not.toMatch(/\.tile\[data-status[^}]*opacity/s);
  });

  it("命中數不用 --ink-soft，那在最深的著色磚上過不了 AA", () => {
    expect(css).toMatch(/\.tileCount\s*\{[^}]*color:\s*var\(--ink\)/s);
  });

  it("手機選定縣市後磚牆收合，桌面不收合", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*\.wall\[data-selected="true"\][\s\S]*display:\s*none/,
    );
  });
});
