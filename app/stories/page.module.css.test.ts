import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("stories/page.module.css 桌機欄寬", () => {
  const css = readFileSync(join(import.meta.dirname, "page.module.css"), "utf8");

  it("基礎欄寬仍是 640；≥768 才放到 1100", () => {
    const base = css.slice(0, css.indexOf("@media (min-width: 768px)"));
    expect(base).toMatch(/\.main\s*\{[\s\S]*?max-width:\s*640px/);
    expect(base).not.toContain("1100px");

    const desktop = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(desktop).toMatch(/\.main\s*\{[\s\S]*?max-width:\s*1100px/);
  });

  it("桌機不把 hero 與標題並排成頁首列", () => {
    expect(css).not.toContain("headerBand");
    expect(css).not.toMatch(/minmax\(220px,\s*300px\)/);
  });

  it("頁面順序：標題 → 最新一集與列表 → 品牌大圖（deferred）→ 頁尾，且最新一集封面優先下載", () => {
    const tsx = readFileSync(join(import.meta.dirname, "page.tsx"), "utf8");
    const order = ["<StoriesIndexHeader", "<HomeSectionList", "<SiteHeader deferred", "<SiteFooter"].map(
      (needle) => tsx.indexOf(needle),
    );
    expect(order.every((i) => i > -1)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    expect(tsx).toMatch(/latestPriority:\s*true/);
  });
});
