import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SubscribeMenu.module.css trigger 去框", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SubscribeMenu.module.css"),
    "utf8",
  );

  const triggerBlock = css.slice(
    css.indexOf(".trigger {"),
    css.indexOf(".trigger:active"),
  );

  it("trigger 無 border／box-shadow／實心底，字色 inherit", () => {
    expect(triggerBlock).toMatch(/background:\s*transparent/);
    expect(triggerBlock).toMatch(/color:\s*inherit/);
    expect(triggerBlock).toMatch(/border:\s*0/);
    expect(triggerBlock).toMatch(/box-shadow:\s*none/);
    expect(triggerBlock).not.toContain("--landing-nav-cta-fg");
    expect(triggerBlock).not.toContain("--landing-nav-cta-bg");
  });

  it("trigger 維持 44px；字級／字重與 SiteNavBar .navLink 同級", () => {
    expect(triggerBlock).toMatch(/min-height:\s*44px/);
    // 舊契約鎖 800＋--fs-meta，那正是「同一列三種字級兩種字重」的來源。
    expect(triggerBlock).toMatch(/font-weight:\s*700/);
    expect(triggerBlock).toMatch(/font-size:\s*var\(--fs-body\)/);
  });

  it("≥480px 不得二次覆寫字級（覆寫會讓 base 修正在桌面失效）", () => {
    const block = css.slice(css.indexOf("@media (min-width: 480px)"));
    const trigger = block.slice(0, block.indexOf("@media", 1));
    expect(trigger).toMatch(/\.trigger/);
    expect(trigger).not.toMatch(/font-size:/);
  });

  it("夜間下拉底與漢堡抽屜同底（不得留在偏藍的 --card）", () => {
    // 兩者都是頂欄浮層；抽屜暖化後下拉若留 --card(#2c3450 靛藍)，
    // 同一列會出現兩個浮層兩種底色。快照拍不到（下拉要點開才出現）。
    const start = css.indexOf('html[data-theme="night"]) .dropdown {');
    expect(start).toBeGreaterThan(-1);
    const block = css.slice(start, css.indexOf("}", start));
    expect(block).toMatch(/background:\s*var\(--nav-panel-bg\)/);
  });

  /**
   * ≤480 錨點契約。缺陷：`.wrap { position: relative }` 讓 240px 的下拉錨定
   * 在 67px 寬的觸發鍵上，左緣在 390/375/360 溢出 −23／−31／−38px。
   * `min-width: min(240px, calc(100vw - 24px))` 要 264px 以下才生效，攔不住。
   */
  it("≤480px 下拉改錨定 .inner（.wrap 轉 static），且 right 顯式留邊", () => {
    const start = css.indexOf("@media (max-width: 480px)");
    expect(start, "缺少 ≤480 區塊").toBeGreaterThan(-1);
    const block = css.slice(start);
    expect(block).toMatch(/\.wrap\s*\{[\s\S]*?position:\s*static/);
    // containing block 是 padding box，right: 0 會貼死螢幕右緣（同 .panel 滿版成因）
    expect(block).toMatch(/\.dropdown\s*\{[\s\S]*?right:\s*calc\(16px \+ var\(--safe-right\)\)/);
  });

  it("≥481 不得被波及：基礎 .wrap 仍是 relative", () => {
    const base = css.slice(0, css.indexOf("@media (max-width: 480px)"));
    expect(base).toMatch(/\.wrap\s*\{[\s\S]*?position:\s*relative/);
  });

  it("trigger hover 規則在，dropdown 仍有框", () => {
    expect(css).toMatch(/\.trigger:hover\s*\{[\s\S]*?background:/);
    expect(css).toMatch(/\.dropdown\s*\{[\s\S]*?border:\s*1\.5px solid var\(--line\)/);
  });
});
