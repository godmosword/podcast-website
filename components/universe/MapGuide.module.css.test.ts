import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 手機宇宙地圖：探險小抄視覺隱藏、DOM／a11y 文案保留。 */
describe("MapGuide.module.css mobile chrome", () => {
  const css = readFileSync(
    join(import.meta.dirname, "MapGuide.module.css"),
    "utf8",
  );

  it("≤480px 以 sr-only 手法隱藏 .guide（保留 markup 給 aria-describedby）", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.guide\s*\{[\s\S]*?clip:\s*rect\(0,\s*0,\s*0,\s*0\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.guide\s*\{[\s\S]*?position:\s*absolute/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.guide\s*\{[\s\S]*?width:\s*1px/,
    );
  });

  it("僅 pointer:fine 顯示鍵盤提示，≤480px 維持 display:none", () => {
    expect(css).toMatch(
      /@media\s*\(pointer:\s*fine\)\s*\{[\s\S]*?\.keyboardHint\s*\{[\s\S]*?display:\s*block/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.keyboardHint[\s\S]*?display:\s*none/,
    );
  });
});
