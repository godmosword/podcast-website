import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1：Landing 往下箭點觸控區 ≥44px；分區 CTA min-height 56px。 */
describe("LandingSegment.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "LandingSegment.module.css"),
    "utf8",
  );

  /** 去註解後以 `}` 切 block——`[\s\S]*?` 會跨越 `}`，整檔比對會誤命中。 */
  const stripComments = (text: string) =>
    text.replace(/\/\*[\s\S]*?\*\//g, "");

  const extractBlocks = (selector: string): string[] => {
    const stripped = stripComments(css);
    const needle = `${selector} {`;
    const blocks: string[] = [];
    let pos = 0;
    while (true) {
      const start = stripped.indexOf(needle, pos);
      if (start === -1) break;
      const end = stripped.indexOf("}", start);
      blocks.push(stripped.slice(start, end + 1));
      pos = end + 1;
    }
    return blocks;
  };

  it("往下箭點 44×44", () => {
    expect(css).toMatch(/\.next\s*\{[\s\S]*?width:\s*44px/);
    expect(css).toMatch(/\.next\s*\{[\s\S]*?height:\s*44px/);
  });

  it("CTA min-height 56px", () => {
    const base = extractBlocks(".cta")[0] ?? "";
    expect(base).toMatch(/min-height:\s*56px/);
  });

  it("CTA 不用橘色漸層 pill", () => {
    const ctaBlock = extractBlocks(".cta")[0] ?? "";
    expect(ctaBlock).not.toMatch(/linear-gradient/);
    expect(ctaBlock).not.toMatch(/--landing-cta-from/);
  });

  it("往下箭無 nudge 動畫", () => {
    expect(css).not.toMatch(/@keyframes nudge/);
    const nextBlock = css.match(/\.next\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(nextBlock).not.toMatch(/animation:/);
  });

  it("分區 CTA 為不透明暖深墨板＋白字＋黏土 gloss／elev-2", () => {
    const ctaBlock = extractBlocks(".cta")[0] ?? "";
    expect(ctaBlock).toMatch(/min-height:\s*56px/);
    expect(ctaBlock).toMatch(/font-size:\s*var\(--fs-h2\)/);
    expect(ctaBlock).toMatch(
      /border:\s*2px\s+solid\s+color-mix\(in srgb,\s*var\(--on-dark\)\s+88%/,
    );
    expect(ctaBlock).toMatch(/background:\s*var\(--landing-brand-ink\)/);
    expect(ctaBlock).toMatch(/color:\s*var\(--on-dark\)/);
    expect(ctaBlock).toMatch(/var\(--gloss\)/);
    expect(ctaBlock).toMatch(/var\(--elev-2\)/);
    expect(ctaBlock).toMatch(/white-space:\s*nowrap/);
    expect(ctaBlock).not.toMatch(/linear-gradient/);
    expect(ctaBlock).not.toMatch(/--landing-cta-from/);
    expect(ctaBlock).not.toMatch(/backdrop-filter/);
    expect(ctaBlock).not.toMatch(/--c-yellow/);
    expect(ctaBlock).not.toMatch(/text-shadow/);
  });

  it("所有 .cta／:hover／:active／:focus-visible block 禁玻璃 ghost 語言", () => {
    const selectors = [
      ".cta",
      ".cta:hover",
      ".cta:active",
      ".cta:focus-visible",
    ] as const;
    for (const sel of selectors) {
      const blocks = extractBlocks(sel);
      expect(blocks.length).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(block).not.toMatch(/backdrop-filter/);
        expect(block).not.toMatch(/-webkit-backdrop-filter/);
        expect(block).not.toMatch(/--c-yellow/);
        expect(block).not.toMatch(/text-shadow/);
        expect(block).not.toMatch(/^\s*opacity:/m);
        if (/background:/.test(block)) {
          expect(block).toMatch(/--landing-brand-ink/);
          expect(block).not.toMatch(/background:[^;]*transparent/);
          expect(block).not.toMatch(/background:[^;]*rgba\(/);
        }
      }
    }
  });

  it("CTA 字級為標題階、不用內文／標籤字", () => {
    const ctaBlock = extractBlocks(".cta")[0] ?? "";
    expect(ctaBlock).toMatch(/font-size:\s*var\(--fs-h2\)/);
    expect(ctaBlock).not.toMatch(/--fs-body/);
    expect(css).not.toMatch(/\.cta\s*\{[^}]*font-size:\s*var\(--fs-label\)/);
    expect(css).not.toMatch(/\.cta\s*\{[^}]*font-size:\s*var\(--fs-control\)/);
  });

  it("分區 CTA／往下箭 focus 用 var(--on-dark) outline", () => {
    expect(css).toMatch(/\.cta:focus-visible/);
    expect(css).toMatch(/\.next:focus-visible/);
    expect(css).toMatch(
      /\.cta:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
    expect(css).toMatch(
      /\.next:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
  });

  it("不得用 #segment-stories 解除 titleHidden 或 siteIntro sr-only", () => {
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+\.titleHidden/);
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+:global\(\.sr-only\)/);
  });
});
