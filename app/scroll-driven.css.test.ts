import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** D5：scroll-driven 進場契約。 */
describe("scroll-driven.css", () => {
  const css = readFileSync(
    join(import.meta.dirname, "scroll-driven.css"),
    "utf8",
  );

  it("僅在 @supports 內啟用 view() 時間軸", () => {
    expect(css).toMatch(
      /@supports \(animation-timeline: view\(\)\)[\s\S]*animation-timeline:\s*view\(\)/,
    );
  });

  it("scrollEnter 預設不藏內容（無靜態 opacity:0）", () => {
    const baseBlock = css.split("@supports")[0] ?? "";
    expect(baseBlock).not.toMatch(/\.scrollEnter\s*\{[^}]*opacity:\s*0/);
  });

  it("支援時關閉 popIn 避免雙重動畫", () => {
    expect(css).toMatch(
      /@supports[\s\S]*\.popIn\s*\{[\s\S]*animation:\s*none/,
    );
  });

  it("prefers-reduced-motion 關閉 scrollEnter", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.scrollEnter[\s\S]*animation:\s*none/,
    );
  });
});
