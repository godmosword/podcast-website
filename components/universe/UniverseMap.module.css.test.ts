import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 手機宇宙地圖：裝飾標題 pill 視覺隱藏（語意標題在頁面 sr-only h1）。 */
describe("UniverseMap.module.css mobile chrome", () => {
  const css = readFileSync(
    join(import.meta.dirname, "UniverseMap.module.css"),
    "utf8",
  );

  it("≤480px 以 sr-only 手法隱藏 .titleSign", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.titleSign\s*\{[\s\S]*?clip:\s*rect\(0,\s*0,\s*0,\s*0\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.titleSign\s*\{[\s\S]*?width:\s*1px/,
    );
  });
});

/** 註解會提到「舊值不可再用」的 hex／關鍵字，negative 斷言必須先剝掉，
 * 否則說明文字本身會讓測試失敗（同 `.cursor/hooks/block-fable.mjs` 舊坑）。 */
const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

/** 首訪底部提示（2A）：screen-space 定位、pointer-events、不蓋 MapControls。 */
describe("UniverseMap.module.css tap hint", () => {
  const css = readFileSync(
    join(import.meta.dirname, "UniverseMap.module.css"),
    "utf8",
  );

  it(">480px 為 screen-space 底部置中（absolute + bottom + translateX）", () => {
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?position:\s*absolute/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?bottom:\s*calc\(16px \+ var\(--safe-bottom\)\)/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?left:\s*50%/);
    // 水平位移走 --tap-hint-x；**fallback 必須是 -50%**——那是 >480 仍置中的
    // 唯一保證（≤480 才覆寫成 0px 走左錨）
    expect(css).toMatch(
      /\.tapHint\s*\{[\s\S]*?transform:\s*translateX\(var\(--tap-hint-x,\s*-50%\)\)/,
    );
  });

  /**
   * ≤480 的底部帶仍有 IslandPickerStrip（z 6）與 MapControls（184px 高、
   * z 5）；提示是 z 4，留在底部無論抬多高都被蓋住。
   * 這組守住「改頂部錨定」不被後人改回底部。
   */
  const narrowBlock = (() => {
    const anchor = css.indexOf("@media (max-width: 480px)", css.indexOf(".tapHint {"));
    return anchor === -1 ? "" : css.slice(anchor, css.indexOf("@keyframes tapHintEnter"));
  })();

  it("≤480px 改頂部錨定，並夾住寬度不出界", () => {
    // 由 --sky-* 推導，天象位置一改提示自動跟著讓開（不得寫死像素）
    expect(narrowBlock).toMatch(
      /top:\s*calc\(var\(--sky-top[^)]*\)\s*\+\s*var\(--sky-size[^)]*\)\s*\+\s*24px\)/,
    );
    expect(narrowBlock).toMatch(/\.tapHint\s*\{[\s\S]*?bottom:\s*auto/);
    // `--nav-h` 已含一次 safe-top，`.map` 又在頂欄之下 → 這裡再加會雙重計算，
    // 瀏海機上提示被推低 47–59px，桌機模擬看不出來
    expect(stripComments(narrowBlock)).not.toContain("--safe-top");
    // 左錨避開右上日／月；水平位移走變數，故毋須複製 @keyframes
    expect(narrowBlock).toMatch(/left:\s*calc\(12px \+ var\(--safe-left\)\)/);
    expect(narrowBlock).toMatch(/--tap-hint-x:\s*0px/);
    // 不可用 100vw：含捲軸寬且吃不到 safe inset
    expect(narrowBlock).toMatch(/max-width:\s*calc\(100% - 24px[^)]*var\(--safe-left\)[\s\S]*?var\(--safe-right\)\)/);
    expect(stripComments(narrowBlock)).not.toContain("100vw");
    // max-width 配 nowrap 等於白設（min-width: auto 被 min-content 撐住）
    expect(narrowBlock).toMatch(/\.tapHintText\s*\{[\s\S]*?white-space:\s*normal/);
    // 入場方向跟著錨點翻轉（keyframes 的 from 取自本規則）
    expect(narrowBlock).toMatch(/transform:\s*translateX\(var\(--tap-hint-x\)\)\s*translateY\(-8px\)/);
  });

  it("≤480 覆寫必須排在 .tapHint 基礎規則之後（媒體查詢不加權重）", () => {
    // 兩處同為 (0,1,0)，靠 source order 決勝；寫進本檔上方那個 480 區塊會失效
    const base = css.indexOf(".tapHint {");
    const override = css.indexOf("@media (max-width: 480px)", base);
    expect(base).toBeGreaterThan(-1);
    expect(override).toBeGreaterThan(base);
  });

  it("色票走 --map-chip*，不得手抄 hex（DESIGN §101／§227）", () => {
    const block = css.slice(css.indexOf(".tapHint {"), css.indexOf(".tapHintText"));
    expect(block).toMatch(/background:\s*var\(--map-chip\)/);
    expect(block).toMatch(/border:\s*2px solid var\(--map-chip-line\)/);
    expect(block).toMatch(/color:\s*var\(--map-chip-ink\)/);
    expect(stripComments(block)).not.toMatch(/#(fff8ea|f0b64e|7a5410)/i);
    // 夜間輪廓：對齊 MapControls .btn 的深藍外陰影，否則在深靛夜海上少一層分離
    expect(block).toMatch(/rgba\(24,\s*40,\s*70,\s*0\.24\)/);

    // 關閉鍵同屬提示，不可繞過色票（現值與 --map-chip-ink 相同，未來改色才不漂移）
    const closeBlock = css.slice(
      css.indexOf(".tapHintClose {"),
      css.indexOf(".tapHintClose:hover"),
    );
    expect(closeBlock).toMatch(/color:\s*var\(--map-chip-ink\)/);
    expect(stripComments(closeBlock)).not.toMatch(/#7a5410/i);
  });

  it(".tapHint pointer-events 僅自身；z-index 低於 MapControls（5）", () => {
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?pointer-events:\s*auto/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?z-index:\s*4/);
  });

  it(".tapHintClose 觸控目標 ≥48px；動效僅 transform/opacity + reduced-motion", () => {
    expect(css).toMatch(/\.tapHintClose\s*\{[\s\S]*?min-width:\s*48px/);
    expect(css).toMatch(/\.tapHintClose\s*\{[\s\S]*?min-height:\s*48px/);
    expect(css).toMatch(/@keyframes tapHintEnter[\s\S]*?opacity:\s*1/);
    // keyframes 與 reduced-motion 共用同一式子，故不必為左錨複製一份
    expect(css).toMatch(
      /@keyframes tapHintEnter[\s\S]*?transform:\s*translateX\(var\(--tap-hint-x,\s*-50%\)\)/,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?transform:\s*translateX\(var\(--tap-hint-x,\s*-50%\)\)/,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.tapHint\s*\{[\s\S]*?animation:\s*none/,
    );
  });
});
