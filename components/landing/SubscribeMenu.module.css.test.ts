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

  it("trigger hover 規則在，dropdown 仍有框", () => {
    expect(css).toMatch(/\.trigger:hover\s*\{[\s\S]*?background:/);
    expect(css).toMatch(/\.dropdown\s*\{[\s\S]*?border:\s*1\.5px solid var\(--line\)/);
  });
});
