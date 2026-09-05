import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("StoryFilter.module.css 桌機目錄網格", () => {
  const css = readFileSync(
    join(import.meta.dirname, "StoryFilter.module.css"),
    "utf8",
  );

  const beforeDesktop = css.slice(0, css.indexOf("@media (min-width: 768px)"));

  it("768 之前的 .catalog／.list 不含網格或 56rem，手機維持直列", () => {
    expect(beforeDesktop).not.toMatch(/\.catalog\s*\{/);
    expect(beforeDesktop).not.toContain("56rem");
    expect(beforeDesktop).not.toContain("data-stories-view");
    expect(beforeDesktop).toMatch(/\.list\s*\{[\s\S]*?flex-direction:\s*column/);
  });

  it("≥768 縮圖兩欄、完整限寬 56rem；≥1280 才三欄", () => {
    const desktop = css.slice(css.indexOf("@media (min-width: 768px)"));
    const wide = css.slice(css.indexOf("@media (min-width: 1280px)"));
    expect(desktop).toMatch(
      /html:not\(\[data-stories-view="list"\]\)[\s\S]*?repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    );
    expect(desktop).toMatch(
      /html\[data-stories-view="list"\][\s\S]*?max-width:\s*56rem/,
    );
    expect(wide).toMatch(/repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
  });
});
