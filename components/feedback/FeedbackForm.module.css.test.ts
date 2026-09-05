import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FeedbackForm.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "FeedbackForm.module.css"), "utf8");

  it("textarea 滿欄且 min-height ≥120px；同意列與送出鍵 ≥44px", () => {
    expect(css).toMatch(/\.textarea\s*\{[\s\S]*?width:\s*100%/);
    expect(css).toMatch(/\.textarea\s*\{[\s\S]*?min-height:\s*120px/);
    expect(css).toMatch(/\.consent\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.submit\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("動畫只動 transform／opacity，reduced-motion 全關", () => {
    expect(css).toMatch(
      /\.submit:active:not\(:disabled\)\s*\{[\s\S]*?transform:\s*scale\(0\.98\)/,
    );
    expect(css).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?\.submit:active[\s\S]*?transform:\s*none/,
    );
  });
});
