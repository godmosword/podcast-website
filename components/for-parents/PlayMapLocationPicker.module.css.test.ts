import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 位置選擇器是頁面層元件，不是 Leaflet overlay：不得借用 --map-chip*，
 * 也不得使用 backdrop-filter／CSS blur()（iOS 合成成本過高，本頁曾因此 OOM）。
 * 以下契約由原縣市色塊圖（PlayMapCityWall）逐條移植。
 */
describe("PlayMapLocationPicker.module.css 契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "PlayMapLocationPicker.module.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("不借用地圖 overlay 的 map-chip token", () => {
    expect(css).not.toMatch(/--map-chip/);
  });

  it("不使用 backdrop-filter 與 CSS blur()", () => {
    expect(css).not.toMatch(/backdrop-filter/);
    expect(css).not.toMatch(/\bblur\(/);
  });

  it("縣市鈕、收合鍵與「我附近」維持 44px 觸控尺寸", () => {
    for (const selector of ["city", "collapsedChip", "nearMe"]) {
      expect(css).toMatch(
        new RegExp(`\\.${selector}\\s*\\{[^}]*min-height:\\s*44px`, "s"),
      );
    }
  });

  it("選中態用實心底，前景用 --card（日夜都過 AA）", () => {
    expect(css).toMatch(
      /\.city\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--accent-ink\)[^}]*color:\s*var\(--card\)/s,
    );
  });

  it("選中規則寫在 empty 之後，0 筆的縣市被選中時仍是實心", () => {
    expect(css.indexOf('.city[aria-pressed="true"] {')).toBeGreaterThan(
      css.indexOf('.city[data-status="empty"] {'),
    );
  });

  it("0 筆狀態用虛線框雙重編碼，不靠 opacity 降階", () => {
    expect(css).toMatch(
      /\.city\[data-status="empty"\]\s*\{[^}]*border-style:\s*dashed/s,
    );
    expect(css).not.toMatch(/\.city\[data-status[^}]*opacity/s);
  });

  it("有命中的數量用 --ink，不降成 --ink-soft", () => {
    expect(css).toMatch(/\.cityCount\s*\{[^}]*color:\s*var\(--ink\)/s);
  });

  it("位置鈕是圓角矩形，不是條件列的 pill", () => {
    expect(css).toMatch(/\.city\s*\{[^}]*border-radius:\s*var\(--radius-sm\)/s);
  });

  it("手機選定縣市後收合，桌面不收合", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*639px\)\s*\{[\s\S]*\.picker\[data-selected="true"\] \.regions[\s\S]*display:\s*none/,
    );
  });
});
