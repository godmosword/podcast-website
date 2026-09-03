import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 註解會提到「不可再用」的舊值，negative 斷言必須先剝掉註解。 */
const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * ≤768 底列短標的紅線。
 *
 * 這支測試存在的理由：本輪四條決策原本只活在 CSS 註解裡，全庫沒有任何
 * SegmentNav 測試。而其中兩條（特異性覆寫、字重不可用）是實測踩到才發現的。
 */
describe("SegmentNav.module.css 底列短標（≤768）", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SegmentNav.module.css"),
    "utf8",
  );

  const narrow = (() => {
    const start = css.indexOf("@media (max-width: 768px)");
    expect(start, "缺少 ≤768 區塊").toBeGreaterThan(-1);
    return css.slice(start, css.indexOf("@media (prefers-reduced-motion"));
  })();

  it("短標常駐可見：桌面 tooltip 的五個屬性全部顯式歸零", () => {
    const label = narrow.slice(
      narrow.indexOf(".dotLabel {"),
      narrow.indexOf(".active .dotLabel"),
    );
    // 少覆寫 opacity → 深底上什麼都看不見；少覆寫 background → 奶油 pill 壓深底
    expect(label).toMatch(/opacity:\s*0\.72/);
    expect(label).toMatch(/transform:\s*none/);
    expect(label).toMatch(/padding:\s*0/);
    expect(label).toMatch(/background:\s*none/);
    expect(label).toMatch(/color:\s*var\(--on-dark\)/);
    expect(stripComments(label)).not.toContain("display: none");
  });

  it("字級用 --fs-control，不得用 --fs-meta／--fs-label（DESIGN §278）", () => {
    const label = narrow.slice(
      narrow.indexOf(".dotLabel {"),
      narrow.indexOf(".active .dotLabel"),
    );
    expect(label).toMatch(/font-size:\s*var\(--fs-control\)/);
    expect(stripComments(label)).not.toMatch(/var\(--fs-(meta|label)\)/);
  });

  /**
   * huninn 是單一字重 master（`layout.tsx` 宣告 400–700）＋全域
   * `font-synthesis-weight: none`；四個短標全是 CJK ⇒ 600 與 800 渲染相同。
   * 所以 active 至少要有**兩個會真的渲染**的視覺編碼。
   */
  it("active 有兩個非字重的視覺編碼（形狀＋面積）", () => {
    const activeAfter = narrow.slice(narrow.indexOf(".active.dot::after {"));
    // ① 形狀：頂緣實色指示條
    expect(activeAfter).toMatch(/height:\s*3px/);
    expect(activeAfter).toMatch(/background:\s*var\(--landing-brand/);
    // 漸淡／半透明會讓非文字對比跌破 1.4.11 的 3:1（夜間餘裕僅 0.51）
    expect(activeAfter).toMatch(/opacity:\s*1/);
    // ② 面積：底色塊
    expect(narrow).toMatch(
      /\.active\.dot\s*\{[\s\S]*?background:\s*rgba\(255,\s*255,\s*255/,
    );
  });

  it("字色不得用品牌橘（夜間 #d9701a 對底列僅 ≈3.51:1，違反 1.4.3）", () => {
    const labelBlocks =
      narrow.slice(narrow.indexOf(".dotLabel {"), narrow.indexOf(".active.dot {"));
    expect(stripComments(labelBlocks)).not.toMatch(
      /color:\s*var\(--landing-brand/,
    );
  });

  it("≤768 重寫 .active.dot::after 的 width／height／border-color（特異性）", () => {
    // `.active.dot::after`(0,2,1) > `.dot::after`(0,1,1)，媒體查詢不加權重，
    // 桌面的 width/height: 10px 與 border-color 會漏到手機指示條上
    const activeAfter = narrow.slice(
      narrow.indexOf(".active.dot::after {"),
      narrow.indexOf(".dot:focus-visible"),
    );
    expect(activeAfter).toMatch(/width:\s*auto/);
    expect(activeAfter).toMatch(/height:\s*3px/);
    expect(activeAfter).toMatch(/border-color:\s*transparent/);
  });

  it("焦點環用 --on-dark（日間 --focus-ring 對深底列僅 1.35:1）", () => {
    expect(narrow).toMatch(
      /\.dot:focus-visible\s*\{[\s\S]*?outline:\s*3px solid var\(--on-dark\)/,
    );
  });

  it("等寬四格掛在 li 上（.dot 是 <a>，不是 .list 的 flex 子項）", () => {
    expect(narrow).toMatch(/\.list\s*>\s*li\s*\{[\s\S]*?flex:\s*1 1 0/);
  });

  it("桌面 hover/focus tooltip 規則收在 ≥769（≤768 會是死碼）", () => {
    expect(css).toMatch(
      /@media \(min-width: 769px\)\s*\{[\s\S]*?\.dot:hover \.dotLabel/,
    );
  });
});
