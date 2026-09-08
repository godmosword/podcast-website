import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("FeedbackForm.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "FeedbackForm.module.css"), "utf8");

  it("有信紙標題；textarea 滿欄且 min-height ≥140px；同意列、送出鍵 ≥44px", () => {
    expect(css).toMatch(/\.heading\s*\{[\s\S]*?font-size:\s*var\(--fs-h3\)/);
    expect(css).toMatch(/\.textarea\s*\{[\s\S]*?width:\s*100%/);
    expect(css).toMatch(/\.textarea\s*\{[\s\S]*?min-height:\s*140px/);
    expect(css).toMatch(/\.consent\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.submit\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).toMatch(/\.mailtoButton\s*\{[\s\S]*?min-height:\s*44px/);
    expect(css).not.toMatch(/\.starter\s*\{/);
    expect(css).not.toMatch(/\.textarea\s*\{[\s\S]*?background-image:/);
    expect(css).not.toMatch(/repeating-linear-gradient/);
  });

  it("mailto 備援是文字連結，不是第二顆實心主鈕", () => {
    expect(css).toMatch(/\.mailtoButton\s*\{[\s\S]*?background:\s*transparent/);
    expect(css).toMatch(/\.mailtoButton\s*\{[\s\S]*?text-decoration:\s*underline/);
  });

  it("蜜罐移出畫面，不用 display:none", () => {
    expect(css).toMatch(/\.honeypot\s*\{[\s\S]*?position:\s*absolute/);
    expect(css).toMatch(/\.honeypot\s*\{[\s\S]*?left:\s*-9999px/);
    expect(css).not.toMatch(/\.honeypot\s*\{[\s\S]*?display:\s*none/);
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
