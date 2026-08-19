import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 頁面層不得再借用地圖 overlay 的 --map-chip*。
 * 允許：viewport search、leaflet 縮放鍵、cluster。
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
        /viewportSearchButton|leaflet-control-zoom|playMapClusterButton/,
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

  it("地圖針改圓形容器，剪影正向不再靠旋轉抵銷", () => {
    expect(css).toMatch(
      /:global\(\.playMapPin\)\s*\{[^}]*border-radius:\s*50%/s,
    );
    expect(css).toMatch(
      /:global\(\.playMapPinGlyph\)\s*\{[^}]*width:\s*18px/s,
    );
    expect(css).not.toMatch(/--pin-rot/);
  });

  it("不再保留 mobile results sheet 三段高度", () => {
    expect(css).not.toMatch(/\.resultsSheet\b/);
  });

  it("手機地圖模式改全幅，不跟篩選列搶高度", () => {
    expect(css).toMatch(
      /\.root\[data-mobile-map="true"\] \.mapShell\s*\{[^}]*100dvh/s,
    );
  });

  it("卡片導航只視覺降噪而不移除 DOM", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*979px\)\s*\{[^}]*\.cardsPanel \.cardActions\s*\{[^}]*display:\s*none/s,
    );
  });
});
