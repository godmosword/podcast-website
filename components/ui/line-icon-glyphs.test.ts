import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 介面圖示一律用共用的線性 Icon（漢堡抽屜那一套），不用文字符號：
 * 「▾」「✕」「×」「↗」在不同手機字型上大小、粗細、高低都不一樣，旁邊的線條圖示一比就不同套。
 * 2026-10-10 線性圖示統一第一批：頂欄下拉、關閉鍵、外部連結。
 */
const ROOT = join(import.meta.dirname, "..", "..");
const read = (path: string) =>
  readFileSync(join(ROOT, path), "utf8")
    // 註解裡提到符號不算
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");

const CASES: readonly { file: string; glyphs: readonly string[]; icon: string }[] = [
  { file: "components/landing/SubscribeMenu.tsx", glyphs: ["▾"], icon: "chevron-down" },
  { file: "components/games/BlockDropHud.tsx", glyphs: ["✕"], icon: "close" },
  { file: "components/games/CandyMatchPropBar.tsx", glyphs: ["✕"], icon: "close" },
  { file: "lib/gamekit/react/TutorialOverlay.tsx", glyphs: ["✕"], icon: "close" },
  { file: "components/universe/UniverseMap.tsx", glyphs: ["✕", "×"], icon: "close" },
  { file: "components/for-parents/PlayMapCityWall.tsx", glyphs: ["✕"], icon: "close" },
  { file: "components/universe/ZoneSheet.tsx", glyphs: ["↗"], icon: "external" },
  { file: "components/universe/HotspotLayer.tsx", glyphs: ["↗"], icon: "external" },
  { file: "app/for-parents/play-map/[placeId]/page.tsx", glyphs: ["↗"], icon: "external" },
];

describe("介面圖示不用文字符號", () => {
  for (const { file, glyphs, icon } of CASES) {
    it(`${file}：用 Icon「${icon}」，不用 ${glyphs.join(" ")}`, () => {
      const code = read(file);
      for (const glyph of glyphs) expect(code).not.toContain(glyph);
      // name="close"，或 name={條件 ? "external" : "chevron-right"}
      expect(code).toMatch(new RegExp(`name=(\\{[^}]*)?"${icon}"`));
    });
  }

  it("地圖熱點的連結標記：只有離站（http 開頭）才用外部連結，站內用向右箭頭", () => {
    for (const file of ["components/universe/HotspotLayer.tsx", "components/universe/ZoneSheet.tsx"]) {
      const code = read(file);
      expect(code, file).toMatch(/\/\^https\?:\/\.test\([^)]*\.href\) \? "external" : "chevron-right"/);
    }
  });

  it("頂欄下拉箭頭打開時轉 180°，減少動態時不轉場", () => {
    const css = readFileSync(join(ROOT, "components/landing/SubscribeMenu.module.css"), "utf8");
    expect(css).toMatch(/\.trigger\[aria-expanded="true"\] \.chevron\s*\{[^}]*transform:\s*rotate\(180deg\)/);
    const reduced = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(reduced).toMatch(/\.chevron\s*\{[^}]*transition:\s*none/);
  });

  it("頂欄下拉箭頭不加寬按鈕：14px 並以負外距抵掉圖示留白（320 寬時「留言」才不壓到漢堡）", () => {
    const tsx = read("components/landing/SubscribeMenu.tsx");
    expect(tsx).toContain('<Icon name="chevron-down" size={14} className={styles.chevron} />');
    const css = readFileSync(join(ROOT, "components/landing/SubscribeMenu.module.css"), "utf8");
    expect(css).toMatch(/\.chevron\s*\{[^}]*margin-inline:\s*-3px/);
  });
});
