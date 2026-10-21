import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 選縣市面板是頁面層元件，不是 Leaflet overlay：不得借用 --map-chip*，
 * 也不得使用 backdrop-filter／CSS blur()（iOS 合成成本過高，本頁曾因此 OOM）。
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

  it("縣市鈕、我附近／全台、關閉鈕維持 44px 以上觸控尺寸", () => {
    expect(css).toMatch(/\.city\s*\{[^}]*min-height:\s*44px/s);
    expect(css).toMatch(/\.option\s*\{[^}]*min-height:\s*48px/s);
    expect(css).toMatch(/\.close\s*\{[^}]*height:\s*44px/s);
  });

  it("遮罩疊在導覽列與詳情 sheet 之上", () => {
    expect(css).toMatch(/\.backdrop\s*\{[^}]*position:\s*fixed[^}]*z-index:\s*1100/s);
  });

  it("手機是底部 sheet；≥980 改貼在觸發鈕下方", () => {
    expect(css).toMatch(/\.panel\s*\{[^}]*bottom:\s*0/s);
    expect(css).toMatch(
      /@media\s*\(min-width:\s*980px\)\s*\{[\s\S]*\.panel\s*\{[^}]*top:\s*var\(--anchor-top/,
    );
  });

  it("選中態用實心 --pm-selected，前景用 --card（日夜都過 AA）", () => {
    expect(css).toMatch(
      /\.city\[aria-pressed="true"\],\s*\.option\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--pm-selected\)[^}]*color:\s*var\(--card\)/s,
    );
  });

  it("選中規則寫在 empty 之後，0 筆的縣市被選中時仍是實心", () => {
    expect(css.indexOf('.city[aria-pressed="true"]')).toBeGreaterThan(
      css.indexOf('.city[data-status="empty"] {'),
    );
  });

  it("0 筆狀態用虛線框雙重編碼，不靠 opacity 降階", () => {
    expect(css).toMatch(/\.city\[data-status="empty"\]\s*\{[^}]*border-style:\s*dashed/s);
    expect(css).not.toMatch(/\.city\[data-status[^}]*opacity/s);
  });

  it("有命中的數量用 --ink，不降成 --ink-soft", () => {
    expect(css).toMatch(/\.cityCount\s*\{[^}]*color:\s*var\(--ink\)/s);
  });

  it("位置鈕是圓角矩形，不是 pill", () => {
    expect(css).toMatch(/\.city\s*\{[^}]*border-radius:\s*var\(--radius-sm\)/s);
  });

  it("reduced-motion 關掉滑入動畫", () => {
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.panel\s*\{[^}]*animation:\s*none/,
    );
  });
});
