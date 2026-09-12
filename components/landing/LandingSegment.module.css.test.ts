import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1：分區 CTA min-height 56px；換段雙折線 44px 可點、不進 CTA 底列。 */
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

  it("換段雙折線是 44px 可點控制，無玻璃底板", () => {
    const skip = extractBlocks(".moreSkip")[0] ?? "";
    expect(skip).toMatch(/position:\s*absolute/);
    expect(skip).toMatch(/width:\s*44px/);
    expect(skip).toMatch(/height:\s*44px/);
    expect(skip).toMatch(/min-width:\s*44px/);
    expect(skip).toMatch(/min-height:\s*44px/);
    expect(skip).toMatch(/cursor:\s*pointer/);
    expect(skip).not.toMatch(/animation:/);
    expect(skip).not.toMatch(/pointer-events:\s*none/);
    expect(skip).not.toMatch(/clip:/);
    expect(skip).not.toMatch(/backdrop-filter/);
    expect(skip).not.toMatch(/var\(--gloss\)/);
    expect(css).not.toMatch(/\.moreHint\s*\{/);
    expect(css).toMatch(
      /\.moreSkip svg[\s\S]*?animation:\s*moreHintDrift/,
    );
    expect(css).toMatch(
      /\.moreSkip\[data-skip-direction="first"\] svg[\s\S]*?animation-name:\s*moreHintDriftUp/,
    );
    expect(css).toMatch(/@keyframes moreHintDriftUp/);
  });

  it("≤768 底列只留 CTA，不抬 CTA", () => {
    const start = css.indexOf("@media (max-width: 768px)");
    expect(start, "缺少 ≤768 區塊").toBeGreaterThan(-1);
    const mobile = stripComments(css.slice(start));
    expect(mobile).not.toMatch(/\.next\s*\{/);
    expect(mobile).toMatch(
      /\.content\s*\{[\s\S]*?grid-template-columns:\s*minmax\(0, 1fr\) 80px/,
    );
    expect(mobile).toMatch(
      /\.content\s*\{[\s\S]*?padding-bottom:\s*calc\(var\(--safe-bottom\) \+ 6px\)/,
    );
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

  it("沒有實體 .next 箭點，也不用 nudge 關鍵幀名", () => {
    expect(css).not.toMatch(/@keyframes nudge/);
    expect(css).not.toMatch(/\.next\s*\{/);
    expect(css).toMatch(/@keyframes moreHintDrift/);
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

  it("分區 CTA／換段 skip focus 用 var(--on-dark) outline", () => {
    expect(css).toMatch(/\.cta:focus-visible/);
    expect(css).toMatch(/\.moreSkip:focus-visible/);
    expect(css).toMatch(
      /\.cta:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
    expect(css).toMatch(
      /\.moreSkip:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
  });

  it("不得用 #segment-stories 解除 titleHidden 或 siteIntro sr-only", () => {
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+\.titleHidden/);
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+:global\(\.sr-only\)/);
  });
});
