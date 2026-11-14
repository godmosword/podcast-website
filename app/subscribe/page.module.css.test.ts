import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("subscribe page.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "page.module.css"), "utf8");
  const globals = readFileSync(join(import.meta.dirname, "..", "globals.css"), "utf8");

  it("用到的 --space-* 都是 globals.css 定義過的（不存在的 token 會讓整條宣告失效）", () => {
    // 去掉註解再找，註解裡會提到曾經寫錯的 token 名稱。
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    const used = new Set([...code.matchAll(/var\((--space-[a-z0-9-]+)\)/g)].map((m) => m[1]));
    expect(used.size).toBeGreaterThan(0);
    for (const token of used) {
      expect(globals, `${token} 沒有定義`).toMatch(new RegExp(`${token}:\\s`));
    }
  });

  it("不用 class 子字串選擇器（dev 與 production 的 class 命名不同，正式站會選不到）", () => {
    const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
    expect(code).not.toMatch(/\[class\*=/);
  });

  it("≥980 兩欄：大圖在左欄跨列，標題與表單在右欄，頁尾橫跨", () => {
    const desktop = css.slice(css.indexOf("@media (min-width: 980px)"));
    expect(desktop).toMatch(/\.main > header:not\(\.header\)\s*\{[^}]*grid-column:\s*1;/);
    expect(desktop).toMatch(/\.header\s*\{[^}]*grid-column:\s*2;/);
    expect(desktop).toMatch(/\.formSection\s*\{[^}]*grid-column:\s*2;/);
    expect(desktop).toMatch(/\.main > footer\s*\{[^}]*grid-column:\s*1 \/ -1;/);
  });
});
