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

  it("v0.2：不再有麥克筆式粗糙外框濾鏡", () => {
    // RoughFrame／SvgDefs 已於遊樂園 v0.2 收斂時整條移除（DESIGN.md「不靠麥克筆描邊」）
    expect(css).not.toMatch(/rough/i);
  });

  it("prefers-reduced-motion 關閉 doodleDraw", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.doodleDraw path[\s\S]*animation:\s*none/,
    );
  });
});
