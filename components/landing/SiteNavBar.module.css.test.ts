import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SiteNavBar.module.css 漢堡與抽屜", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SiteNavBar.module.css"),
    "utf8",
  );

  it("漢堡鈕無底板與邊框，觸控區仍 44px", () => {
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?min-width:\s*44px/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?height:\s*44px/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?border:\s*0/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?background:\s*transparent/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?appearance:\s*none/);
  });

  it("桌面不得再隱藏漢堡或抽屜（家長項只在抽屜，隱藏＝入口消失）", () => {
    const desktopBlock = css.slice(css.indexOf("@media (min-width: 980px)"));
    expect(desktopBlock).not.toMatch(/\.menuBtn\s*\{[^}]*display:\s*none/);
    expect(desktopBlock).not.toMatch(/\.panel\s*\{[^}]*display:\s*none/);
  });

  it("抽屜關閉時以 display:none 隱藏，而非只用 opacity", () => {
    expect(css).toMatch(/\.panel\[data-open="false"\]\s*\{[\s\S]*?display:\s*none/);
  });

  it("桌面面板錨定膠囊本體：.inner 必須 position: relative", () => {
    expect(css).toMatch(/\.inner\s*\{[\s\S]*?position:\s*relative/);
  });

  it(".inner 以 flex-start 對齊，.actions 以 margin-left: auto 靠右", () => {
    expect(css).toMatch(/\.inner\s*\{[\s\S]*?justify-content:\s*flex-start/);
    expect(css).toMatch(/\.actions\s*\{[\s\S]*?margin-left:\s*auto/);
  });

  it("landing 桌面 pointer-events 需一併還原給 .panel（它是 .inner 的兄弟節點）", () => {
    expect(css).toMatch(/\.bar \.panel\s*\{[\s\S]*?pointer-events:\s*auto/);
  });

  it("目前頁與 hover 不共用同一底色（色彩不得為唯一編碼）", () => {
    expect(css).toMatch(
      /\.menuLink\[aria-current="page"\]\s*\{[\s\S]*?box-shadow:\s*inset/,
    );
  });

  it("已退役的 themeDesktop 不留死碼（主題切換改在抽屜底部）", () => {
    expect(css).not.toContain("themeDesktop");
  });

  it("夜間 data-menu-open 微暗必須分斷點，否則會蓋掉桌面 .bar 的 transparent", () => {
    const nightOpen = css.indexOf('.bar[data-menu-open="true"] {');
    const before = css.slice(0, nightOpen);
    expect(before).toContain("@media (max-width: 979px)");
    expect(css).toMatch(
      /@media \(min-width: 980px\)[\s\S]*?\.bar\[data-menu-open="true"\] \.inner/,
    );
  });

  it("桌面主列目前頁不得與 hover 共用同一底色", () => {
    expect(css).toMatch(
      /\.navLink\[aria-current="page"\]\s*\{[\s\S]*?box-shadow:\s*inset/,
    );
    expect(css).not.toContain(".navLinkActive");
  });

  it("≥980 時桌面仍顯示 .homeAction（兩斷點同構）", () => {
    expect(css).toMatch(/\.homeAction\s*\{/);
    const desktopBlock = css.slice(css.indexOf("@media (min-width: 980px)"));
    expect(desktopBlock).not.toMatch(
      /\.actions\s+\.homeAction\s*\{[\s\S]*?display:\s*none/,
    );
  });

  it("已移除 .desktopNav（兒童三入口改抽屜）", () => {
    expect(css).not.toContain(".desktopNav");
  });

  it("≥980 膠囊 .inner max-width 為 960px", () => {
    const desktopBlock = css.slice(css.indexOf("@media (min-width: 980px)"));
    expect(desktopBlock).toMatch(/\.inner\s*\{[\s\S]*?max-width:\s*960px/);
  });

  it("極窄容器不得把觸發器變成 icon-only（DESIGN §99 禁止）", () => {
    expect(css).toMatch(
      /@container nav-inner \(max-width: 240px\)\s*\{[\s\S]*?\.menuBtnText/,
    );
    const block420 = /@container nav-inner \(max-width: 420px\)\s*\{([^@]*?)\n\}/.exec(
      css,
    );
    expect(block420).toBeTruthy();
    expect(block420![1]).toContain("brandText");
    expect(block420![1]).toContain("clip: rect");
    expect(block420![1]).not.toContain("display: none");
    expect(block420![1]).not.toContain("menuBtnText");
  });
});

describe("SiteNavBar.tsx 結構契約", () => {
  const tsx = readFileSync(
    join(import.meta.dirname, "SiteNavBar.tsx"),
    "utf8",
  );

  it("panel 必須巢狀在 .inner 之內，否則桌面會退回 .bar 全寬下拉", () => {
    const innerOpen = tsx.indexOf("className={styles.inner}");
    const panel = tsx.indexOf("className={styles.panel}");
    const innerClose = tsx.indexOf("</header>");
    expect(innerOpen).toBeGreaterThan(-1);
    expect(panel).toBeGreaterThan(innerOpen);
    expect(panel).toBeLessThan(innerClose);
    expect(tsx.slice(panel, innerClose)).toContain("</div>");
  });

  it("已移除 PRIMARY_ORDER 與 aria-label=\"主要分區\"（T3 再補 SiteNavBar.test）", () => {
    expect(tsx).not.toContain("PRIMARY_ORDER");
    expect(tsx).not.toContain('aria-label="主要分區"');
    expect(tsx).not.toContain("desktopNav");
  });

  it("品牌、首頁與留言點擊都要關閉抽屜", () => {
    const brand = tsx.slice(tsx.indexOf("className={styles.brand}"));
    expect(brand.slice(0, 200)).toContain("onClick={closeAll}");

    const navLink = tsx.slice(tsx.indexOf("styles.navLink}"));
    expect(navLink.slice(0, 300)).toContain("onClick={closeAll}");

    const homeAction = tsx.slice(tsx.indexOf("styles.homeAction"));
    expect(homeAction.slice(0, 300)).toContain("onClick={closeAll}");

    const actions = tsx.slice(
      tsx.indexOf("className={styles.actions}"),
      tsx.indexOf("className={styles.panel}"),
    );
    expect(actions).toContain("renderFeedbackLink");
    expect(actions).toContain("feedbackItem");
    expect(actions).toContain("feedbackItem.label");
    expect(actions).toContain("SubscribeMenu");
  });
});
