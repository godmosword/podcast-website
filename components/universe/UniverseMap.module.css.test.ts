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
