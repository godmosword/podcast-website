import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** D7：手繪裝飾動效契約。 */
describe("decor.module.css", () => {
  const css = readFileSync(
    join(import.meta.dirname, "decor.module.css"),
    "utf8",
  );

  it("doodleDraw 以 stroke-dashoffset 描邊進場", () => {
    expect(css).toMatch(/\.doodleDraw path[\s\S]*stroke-dashoffset/);
    expect(css).toMatch(/@keyframes doodle-draw/);
  });

  it("roughShift 輪替 rough-1/2/3 濾鏡", () => {
    expect(css).toMatch(/@keyframes rough-filter-shift[\s\S]*#rough-1/);
    expect(css).toMatch(/#rough-2/);
    expect(css).toMatch(/#rough-3/);
  });

  it("prefers-reduced-motion 關閉 doodleDraw 與 roughShift", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.doodleDraw path[\s\S]*animation:\s*none/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.roughShift[\s\S]*animation:\s*none/,
    );
  });
});
