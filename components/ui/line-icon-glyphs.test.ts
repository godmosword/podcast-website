import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 介面圖示一律用共用的線性 Icon（漢堡抽屜那一套），不用文字符號：
 * 「▾」「✕」「×」「↗」在不同手機字型上大小、粗細、高低都不一樣，旁邊的線條圖示一比就不同套。
 * 2026-10-10 線性圖示統一第一批：頂欄下拉、關閉鍵、外部連結。
 * 第二批：返回「←」、前往「→」、下拉「▾」與勾選「✓」、展開收合「▸▾」。
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

/** 第二批：每個檔案不再出現的符號，與改用的共用圖示。 */
const BATCH_2: readonly { file: string; glyphs: string; icons: readonly string[] }[] = [
  { file: "app/about/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/feedback/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/for-parents/dashboard/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/for-parents/page.tsx", glyphs: "→", icons: ["arrow-right", "external"] },
  { file: "app/for-parents/play-map/page.tsx", glyphs: "→", icons: ["arrow-right"] },
  { file: "app/for-parents/play-map/[placeId]/page.tsx", glyphs: "←→", icons: ["arrow-left", "chevron-right"] },
  { file: "app/for-parents/play-map/[placeId]/page.module.css", glyphs: "→", icons: [] },
  { file: "app/for-parents/play-map/collections/page.tsx", glyphs: "←→", icons: ["arrow-left", "arrow-right"] },
  { file: "app/for-parents/play-map/collections/[collectionSlug]/page.tsx", glyphs: "←→", icons: ["arrow-left", "arrow-right"] },
  { file: "app/legal/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/not-found.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/story/[slug]/page.tsx", glyphs: "←→▸▾", icons: ["arrow-left", "arrow-right", "chevron-right"] },
  { file: "app/story/[slug]/page.module.css", glyphs: "▸▾", icons: [] },
  { file: "app/studio/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/studio/feedback/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/topic/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "app/topic/[tag]/page.tsx", glyphs: "←→", icons: ["arrow-left", "arrow-right"] },
  { file: "app/vehicles/[vehicle]/page.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "components/FilterSelect.tsx", glyphs: "▾✓", icons: ["chevron-down", "check"] },
  { file: "components/characters/CharacterEpisodeSelect.tsx", glyphs: "▾", icons: ["chevron-down"] },
  { file: "components/LatestHero.tsx", glyphs: "→", icons: ["arrow-right"] },
  { file: "components/errors/SegmentNotFound.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "components/for-parents/ParentArticleView.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "components/for-parents/ParentSectionPage.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "components/for-parents/ParentCoListenSection.tsx", glyphs: "→▸▾", icons: ["arrow-right", "chevron-right"] },
  { file: "components/for-parents/ParentCoListenSection.module.css", glyphs: "▸▾", icons: [] },
  { file: "components/for-parents/PlayMapCollectionCard.tsx", glyphs: "→", icons: ["arrow-right"] },
  { file: "components/games/GamePlayChromeSlot.tsx", glyphs: "←", icons: ["arrow-left"] },
  { file: "components/landing/LandingSegment.tsx", glyphs: "→", icons: ["arrow-right", "chevron-down"] },
  { file: "components/landing/hero-world/HeroWorld.tsx", glyphs: "→", icons: ["arrow-right"] },
  { file: "components/story/ShowNotes.tsx", glyphs: "▸▾", icons: ["chevron-right"] },
  { file: "components/story/ShowNotes.module.css", glyphs: "▸▾", icons: [] },
];

/** 原本各自畫一份、現在改用共用 Icon 的地方：那份路徑不再出現在元件裡。 */
const MERGED_SVGS: readonly { file: string; icon: string; path: string }[] = [
  { file: "components/ShareButton.tsx", icon: "link", path: "M10 13a5 5 0 0 0 7.54.54" },
  { file: "components/universe/MapControls.tsx", icon: "home", path: "M3 11.5 12 4l9 7.5" },
  { file: "components/landing/LandingSegment.tsx", icon: "chevron-down", path: "M7 9.5 L12 14.5 L17 9.5" },
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

  for (const { file, glyphs, icons } of BATCH_2) {
    it(`${file}：不用 ${[...glyphs].join(" ")}${icons.length ? `，改用 Icon「${icons.join("」「")}」` : ""}`, () => {
      const code = read(file);
      for (const glyph of glyphs) expect(code).not.toContain(glyph);
      for (const icon of icons) expect(code).toMatch(new RegExp(`name=(\\{[^}]*)?"${icon}"`));
    });
  }

  for (const { file, icon, path } of MERGED_SVGS) {
    it(`${file}：用共用 Icon「${icon}」，不再自己畫一份`, () => {
      const code = read(file);
      expect(code).not.toContain(path);
      expect(code).toContain(`<Icon name="${icon}"`);
    });
  }

  it("「回第一個專區」在停掉漂移動畫時（按住、鍵盤聚焦）仍朝上", () => {
    const css = readFileSync(join(ROOT, "components/landing/LandingSegment.module.css"), "utf8");
    expect(css).toMatch(
      /\.moreSkip\[data-skip-direction="first"\]:active svg,\s*\.moreSkip\[data-skip-direction="first"\]:focus-visible svg\s*\{[^}]*transform:\s*rotate\(180deg\)/,
    );
  });

  it("展開收合：三處都用 chevron-right 配 icon-disclosure，打開時轉 90°、減少動態時不轉場", () => {
    for (const file of [
      "app/story/[slug]/page.tsx",
      "components/story/ShowNotes.tsx",
      "components/for-parents/ParentCoListenSection.tsx",
    ]) {
      expect(read(file), file).toMatch(/<Icon name="chevron-right" size=\{\d+\} className=\{?[`"]icon-lead icon-disclosure/);
    }
    const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
    expect(css).toMatch(/details\[open\] > summary \.icon-disclosure\s*\{[^}]*transform:\s*rotate\(90deg\)/);
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.icon-disclosure\s*\{[^}]*transition:\s*none/,
    );
  });

  it("故事頁沒有人用的 .expandable 樣式已刪除", () => {
    const css = readFileSync(join(ROOT, "app/story/[slug]/page.module.css"), "utf8");
    expect(css).not.toContain(".expandable");
  });

  it("文字旁的箭頭用全域 icon-lead／icon-trail 對齊字的中線", () => {
    const css = readFileSync(join(ROOT, "app/globals.css"), "utf8");
    expect(css).toMatch(/\.icon-lead,\s*\.icon-trail\s*\{[^}]*flex:\s*none;[^}]*vertical-align:\s*-0\.15em/);
    expect(css).toMatch(/\.icon-lead\s*\{[^}]*margin-inline-end:\s*0\.3em/);
    expect(css).toMatch(/\.icon-trail\s*\{[^}]*margin-inline-start:\s*0\.3em/);
  });
});
