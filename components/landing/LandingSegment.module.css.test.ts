import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1：分區 CTA min-height 56px；換段黏土圓鈕 ≥44px，與 CTA／嘟嘟同一底列。 */
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

  it("換段黏土圓鈕是 ≥44px 可點控制，語彙對齊分區 CTA", () => {
    const skip = extractBlocks(".moreSkip")[0] ?? "";
    expect(skip).not.toMatch(/position:\s*absolute/);
    expect(skip).toMatch(/width:\s*var\(--landing-skip\)/);
    expect(skip).toMatch(/height:\s*var\(--landing-skip\)/);
    expect(skip).toMatch(/min-width:\s*44px/);
    expect(skip).toMatch(/min-height:\s*44px/);
    expect(skip).toMatch(/cursor:\s*pointer/);
    expect(skip).toMatch(/border-radius:\s*50%/);
    expect(skip).toMatch(/background:\s*var\(--landing-brand-ink\)/);
    expect(skip).toMatch(/var\(--gloss\)/);
    expect(skip).toMatch(/var\(--elev-2\)/);
    expect(skip).not.toMatch(/animation:/);
    expect(skip).not.toMatch(/pointer-events:\s*none/);
    expect(skip).not.toMatch(/clip:/);
    expect(skip).not.toMatch(/backdrop-filter/);
    expect(skip).not.toMatch(/background:[^;]*transparent/);
    expect(css).not.toMatch(/\.moreHint\s*\{/);
    expect(css).toMatch(
      /\.moreSkip svg[\s\S]*?animation:\s*moreHintDrift/,
    );
    expect(css).toMatch(
      /\.moreSkip\[data-skip-direction="first"\] svg[\s\S]*?animation-name:\s*moreHintDriftUp/,
    );
    expect(css).toMatch(/@keyframes moreHintDriftUp/);
  });

  it("底列 chrome 與 CTA／圓鈕／嘟嘟佔位同一列", () => {
    const chrome = extractBlocks(".chrome")[0] ?? "";
    const row = extractBlocks(".ctaRow")[0] ?? "";
    const slot = extractBlocks(".duduSlot")[0] ?? "";
    expect(chrome).toMatch(/align-items:\s*flex-end/);
    expect(chrome).toMatch(/justify-content:\s*space-between/);
    expect(row).toMatch(/flex-wrap:\s*nowrap/);
    expect(row).toMatch(/align-items:\s*flex-end/);
    expect(slot).toMatch(/width:\s*var\(--landing-dudu-slot\)/);
    expect(css).toMatch(/--landing-dudu-slot:\s*clamp\(80px,\s*11vw,\s*118px\)/);
    expect(css).toMatch(
      /--landing-dock-bottom:\s*calc\(\s*clamp\(20px,\s*3\.5vh,\s*56px\) \+ var\(--landing-bottom-ui-h\) \+ var\(--safe-bottom\)/,
    );
    const start = css.indexOf("@media (max-width: 768px)");
    expect(start, "缺少 ≤768 區塊").toBeGreaterThan(-1);
    const mobile = stripComments(css.slice(start));
    expect(mobile).not.toMatch(/\.next\s*\{/);
    expect(mobile).not.toMatch(/grid-template-columns:\s*minmax\(0, 1fr\) 80px/);
    expect(mobile).toMatch(
      /\.content\s*\{[\s\S]*?padding-bottom:\s*var\(--landing-dock-bottom\)/,
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

  it("程式換段只動 transform／opacity，reduced-motion 立刻停", () => {
    expect(css).toMatch(/@keyframes landingSegmentEnter/);
    expect(css).toMatch(/@keyframes landingSegmentEnterChrome/);
    expect(css).toMatch(
      /\.panel\[data-landing-phase="leave"\] \.visual[\s\S]*?transition:\s*opacity 120ms ease,\s*transform 120ms ease/,
    );
    expect(css).toMatch(
      /\.panel\[data-landing-phase="enter"\] \.visual[\s\S]*?animation:\s*landingSegmentEnter 280ms/,
    );
    const enterKf = css.match(
      /@keyframes landingSegmentEnter \{[\s\S]*?\n\}/,
    )?.[0];
    expect(enterKf).toMatch(/opacity:\s*0\.4/);
    expect(enterKf).toMatch(/transform:\s*scale\(1\.03\)/);
    expect(enterKf).not.toMatch(/filter|clip-path|width:|height:/);
    const reducedStart = css.indexOf("@media (prefers-reduced-motion: reduce)");
    expect(reducedStart).toBeGreaterThan(-1);
    const reduced = css.slice(reducedStart);
    expect(reduced).toMatch(
      /\[data-landing-phase="enter"\] \.visual[\s\S]*?animation:\s*none/,
    );
  });

  it(".subscribeCta 脫離玻璃：不透明白底＋暖深墨字，無 backdrop／text-shadow／rgba", () => {
    const block = extractBlocks(".subscribeCta")[0] ?? "";
    const hover = extractBlocks(".subscribeCta:hover")[0] ?? "";
    const active = extractBlocks(".subscribeCta:active")[0] ?? "";
    expect(block).toMatch(/min-height:\s*44px/);
    expect(block).toMatch(/font-size:\s*var\(--fs-control\)/);
    expect(block).toMatch(/background:\s*var\(--on-dark\)/);
    expect(block).toMatch(/color:\s*var\(--landing-brand-ink\)/);
    expect(block).toMatch(/box-shadow:\s*var\(--elev-1\)/);
    expect(block).not.toMatch(/--cta-soft-/);
    for (const part of [block, hover, active]) {
      expect(part.length).toBeGreaterThan(0);
      expect(part).not.toMatch(/backdrop-filter/);
      expect(part).not.toMatch(/-webkit-backdrop-filter/);
      expect(part).not.toMatch(/text-shadow/);
      expect(part).not.toMatch(/rgba\(/);
    }
  });

  it("不得用 #segment-stories 解除 titleHidden 或 siteIntro sr-only", () => {
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+\.titleHidden/);
    expect(css).not.toMatch(/:global\(#segment-stories\)\s+:global\(\.sr-only\)/);
  });
});
