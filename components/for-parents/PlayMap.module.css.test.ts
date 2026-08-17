import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 頁面層不得再借用地圖 overlay 的 --map-chip*。
 * 允許：mapHint、viewport search、leaflet 縮放鍵、cluster。
 */
describe("PlayMap.module.css map-chip 用量", () => {
  const css = readFileSync(
    join(import.meta.dirname, "PlayMap.module.css"),
    "utf8",
  ).replace(/\/\*[\s\S]*?\*\//g, "");

  it("只在指定的三個地圖 overlay 家族使用 map-chip token", () => {
    const rules = css.split("}").filter((rule) => rule.includes("--map-chip"));
    const selectors = rules.map((rule) =>
      (rule.split("{")[0] ?? "").trim().replace(/\s+/g, " "),
    );
    expect(selectors.length).toBeGreaterThanOrEqual(3);
    for (const selector of selectors) {
      expect(selector).toMatch(
        /mapHint|viewportSearchButton|leaflet-control-zoom|playMapClusterButton/,
      );
    }
  });

  it("意圖 chip 維持 48px，既有 44px chip 不減", () => {
    expect(css).toMatch(/\.intentChip\s*\{[^}]*min-height:\s*48px/);
    expect(css).toMatch(/\.chip\s*\{[^}]*min-height:\s*44px/);
  });

  it("快捷列維持單列並可在窄螢幕橫向捲動", () => {
    expect(css).toMatch(
      /\.intentGrid\s*\{[^}]*display:\s*flex[^}]*flex-wrap:\s*nowrap/s,
    );
    expect(css).toMatch(
      /\.intentGrid\s*\{[^}]*overflow-x:\s*auto/s,
    );
    expect(css).toMatch(/\.intentGrid \.intentChip\s*\{[^}]*flex:\s*0 0 auto/s);
  });

  it("卡片與 marker 的 correlated／selected 狀態有可見且不同的層級", () => {
    expect(css).toMatch(/\.cardCorrelated\s*\{[^}]*box-shadow:/s);
    expect(css).toMatch(/\.cardSelected\s*\{[^}]*inset/s);
    expect(css).toMatch(
      /:global\(\.playMapMarkerButton\[data-hovered="true"\]\)\s*\{[^}]*scale\(1\.08\)/s,
    );
    expect(css).toMatch(
      /:global\(\.playMapMarkerButton\[aria-pressed="true"\]\)\s*\{[^}]*translateY\(-3px\)/s,
    );
  });

  /*
   * 針的水滴造型與 glyph 抵銷必須共用同一個旋轉來源，避免日後只改到
   * 基礎宣告時，選中態或 reduced-motion 狀態靜默遺失抵銷。
   */
  it("剪影 holder 以 SSOT 反轉抵銷水滴旋轉", () => {
    expect(css).toMatch(
      /:global\(\.playMapMarkerHost\)\s*\{[^}]*--pin-rot:\s*-45deg/,
    );
    expect(css).toMatch(
      /:global\(\.playMapPin\)\s*\{[^}]*transform:\s*rotate\(var\(--pin-rot\)\)/,
    );
    expect(css).toMatch(
      /:global\(\.playMapPinGlyph\)\s*\{[^}]*transform:\s*rotate\(calc\(-1 \* var\(--pin-rot\)\)\)/,
    );
    expect(css).not.toMatch(/rotate\(-45deg\)|rotate\(45deg\)/);
  });

  it("mobile results sheet 保留三段高度、獨立捲動與拖曳觸控區", () => {
    expect(css).toMatch(/\.resultsSheet\s*\{[^}]*position:\s*absolute/s);
    expect(css).toMatch(/\.resultsSheet\s*\{[^}]*height:\s*18%/s);
    expect(css).toMatch(/\.resultsSheetHalf\s*\{[^}]*height:\s*50%/s);
    expect(css).toMatch(/\.resultsSheetExpanded\s*\{[^}]*height:\s*86%/s);
    expect(css).toMatch(
      /\.resultsSheetScroll\s*\{[^}]*overflow-y:\s*auto[^}]*overscroll-behavior:\s*contain/s,
    );
    expect(css).toMatch(
      /\.resultsSheetHandle\s*\{[^}]*touch-action:\s*none/s,
    );
    expect(css).toMatch(
      /\.resultsSheet\[data-dragging="true"\]\s*\{[^}]*transition:\s*none/s,
    );
  });

  it("mobile handle 加寬置中，卡片導航只視覺降噪而不移除 DOM", () => {
    expect(css).toMatch(
      /\.resultsSheetHandle\s*\{[^}]*width:\s*72px[^}]*justify-self:\s*center/s,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*979px\)\s*\{[^}]*\.cardsPanel \.cardActions\s*\{[^}]*display:\s*none/s,
    );
  });
});
