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
        /viewportSearchButton|leaflet-control-zoom|playMapSpatialClusterButton/,
      );
    }
  });

  it("更多條件 chip 維持 44px 觸控尺寸，選中用 --pm-selected", () => {
    expect(css).toMatch(/\.chip\s*\{[^}]*min-height:\s*44px/);
    expect(css).toMatch(/\.chipCompact\s*\{[^}]*min-height:\s*44px/);
    expect(css).not.toMatch(/\.chipCompact\s*\{[^}]*min-height:\s*36px/);
    expect(css).toMatch(/\.chip\[aria-pressed="true"\]\s*\{[^}]*background:\s*var\(--pm-selected\)/s);
    expect(css).toMatch(/@media \(min-width: 640px\)[\s\S]*\.chipMore\s*\{[^}]*display:\s*none/);
  });

  it("舊快捷列與左欄位置選擇器的版型已移除（改成情境卡＋位置列）", () => {
    expect(css).not.toMatch(/\.intentChip|\.intentGrid|\.controlBar|\.locationSlot|\.browse\b/);
  });

  it("頁首：h1 是小字 eyebrow，主標「今天想怎麼玩？」用 display 字", () => {
    expect(css).toMatch(/\.headline\s*\{[^}]*font-family:\s*var\(--font-stack-display\)/s);
    expect(css).toMatch(/\.title\s*\{[^}]*font-size:\s*var\(--fs-label\)/s);
  });

  it("marker 的 correlated／selected 狀態有可見且不同的層級（卡片見 PlayMapCard.module.css）", () => {
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

  it("並排版型只在 data-split=\"true\" 生效，名單滿版不被 64dvh 夾住", () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*980px\)\s*\{[\s\S]*?\.root\[data-split="true"\] \.content/,
    );
    expect(css).toMatch(/\.root\[data-split="true"\] \.cardsPanel/);
    expect(css).toMatch(/\.root\[data-split="false"\] \.cardGrid/);
  });

  it("名單模式桌面三欄，900–979 維持兩欄（不另開 900 斷點）", () => {
    expect(css).toMatch(
      /@media\s*\(min-width:\s*980px\)\s*\{[\s\S]*?\.root\[data-split="false"\] \.cardGrid\s*\{[^}]*repeat\(3/,
    );
    expect(css).not.toMatch(/@media\s*\(min-width:\s*900px\)/);
  });

  it("手機卡片不再藏導航（D3：名單一下就能導航）", () => {
    expect(css).not.toMatch(/\.cardActions/);
    expect(css).not.toMatch(/\.cardNav[^{]*\{[^}]*display:\s*none/s);
  });

  it("選完縣市捲到名單欄頂端時避開置頂導覽列", () => {
    expect(css).toMatch(/\.content\s*\{[^}]*scroll-margin-top:\s*var\(--nav-h\)/s);
  });

  it("不使用 backdrop-filter 與 CSS blur()", () => {
    expect(css).not.toMatch(/backdrop-filter|\bblur\(/);
  });
});
