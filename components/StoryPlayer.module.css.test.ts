import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("StoryPlayer 字幕帶（桌機橫向）", () => {
  const css = readFileSync(join(import.meta.dirname, "StoryPlayer.module.css"), "utf8");
  const tsx = readFileSync(join(import.meta.dirname, "StoryPlayer.tsx"), "utf8");
  const start = css.indexOf("@media (min-width: 768px) and (min-height: 700px) and (orientation: landscape)");
  const block = css.slice(start, css.indexOf("\n}\n", start));

  it("只在夠高的橫向視窗讓出字幕帶（手機橫放、矮筆電不讓）", () => {
    expect(start).toBeGreaterThan(-1);
    expect(block).toMatch(/\.stage\s*\{[^}]*bottom:\s*calc\([^;]*var\(--caption-band, 0px\)\)/);
  });

  it("三種字級各有字幕帶高度，字幕關掉（off）就不讓", () => {
    for (const size of ["sm", "md", "lg"]) {
      expect(block).toMatch(new RegExp(`\\.player\\[data-captions="${size}"\\]\\s*\\{[^}]*--caption-band:\\s*\\d+px`));
    }
    expect(block).not.toMatch(/data-captions="off"\]\s*\{[^}]*--caption-band/);
    // 字幕框往下移 10px，只在有字幕帶時
    expect(block).toMatch(/\.player:not\(\[data-captions="off"\]\) \.captionWrap\s*\{[^}]*- 10px\)/);
    expect(tsx).toMatch(/data-captions=\{subtitlesOn && !hasEnded && hasCaptionContent \? captionSize : "off"\}/);
  });
});
