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
    // 規則特異性 (0,3,1) > @media 內的 .bar { background: transparent } (0,1,0)，
    // 媒體查詢不加權重；不限斷點就會在懸浮膠囊外畫出一條橫貫視窗的色帶。
    const nightOpen = css.indexOf('.bar[data-menu-open="true"] {');
    const before = css.slice(0, nightOpen);
    expect(before).toContain("@media (max-width: 979px)");
    // 桌面版微暗改套在膠囊本體
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

  it("極窄容器不得把觸發器變成 icon-only（DESIGN §99 禁止）", () => {
    // 「選單」文字只在 240px 以下讓位，300px 收的是品牌字標
    expect(css).toMatch(
      /@container nav-inner \(max-width: 240px\)\s*\{[\s\S]*?\.menuBtnText/,
    );
    // 只檢查 300px 區塊自身的內容（[^}] 不跨出該區塊）
    const block300 = /@container nav-inner \(max-width: 300px\)\s*\{([^@]*?)\n\}/.exec(
      css,
    );
    expect(block300).toBeTruthy();
    expect(block300![1]).toContain("brandText");
    expect(block300![1]).not.toContain("menuBtnText");
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
    // panel 之後、</header> 之前必須先關掉 .inner 的 <div>
    expect(tsx.slice(panel, innerClose)).toContain("</div>");
  });

  it("品牌與桌面主列點擊都要關閉抽屜（client navigation 會保留 instance）", () => {
    const brand = tsx.slice(tsx.indexOf("className={styles.brand}"));
    expect(brand.slice(0, 200)).toContain("onClick={closeAll}");
    const navLink = tsx.slice(tsx.indexOf("styles.navLink}"));
    expect(navLink.slice(0, 300)).toContain("onClick={closeAll}");
  });

  it("頂欄常駐列不得再有「留言」pill（它已移入抽屜「給爸媽」組）", () => {
    const navCss = readFileSync(
      join(import.meta.dirname, "SiteNavBar.module.css"),
      "utf8",
    );
    expect(navCss).not.toContain("feedback");
    // 頂欄 actions 內只剩訂閱
    const actions = tsx.slice(
      tsx.indexOf("className={styles.actions}"),
      tsx.indexOf("className={styles.panel}"),
    );
    expect(actions).toContain("SubscribeMenu");
    // 去掉註解後，actions 內不得再有任何 <a>／feedback 參照
    const code = actions.replace(/\{\/\*[\s\S]*?\*\/\}/g, "");
    expect(code).not.toContain("feedback");
    expect(code).not.toContain("<a");
  });
});
