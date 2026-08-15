import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 頁面層不得再借用地圖 overlay 的 --map-chip*。
 * 允許：mapHint、leaflet 縮放鍵、cluster。
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
        /mapHint|leaflet-control-zoom|playMapClusterButton/,
      );
    }
  });

  it("意圖 chip 維持 48px，既有 44px chip 不減", () => {
    expect(css).toMatch(/\.intentChip\s*\{[^}]*min-height:\s*48px/);
    expect(css).toMatch(/\.chip\s*\{[^}]*min-height:\s*44px/);
  });

  /*
   * 針的水滴造型靠 .playMapPin 的 rotate(-45deg)，子元素會一起轉。
   * glyph 換成有方向性的剪影後，少了這個抵銷，七個母題會整組歪 45 度。
   */
  it("剪影 holder 反轉抵銷水滴旋轉", () => {
    expect(css).toMatch(
      /:global\(\.playMapPin\)\s*\{[^}]*transform:\s*rotate\(-45deg\)/,
    );
    expect(css).toMatch(
      /:global\(\.playMapPinGlyph\)\s*\{[^}]*transform:\s*rotate\(45deg\)/,
    );
  });
});
