import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1：Landing 往下箭點觸控區 ≥44px；CTA 玻璃 ghost min-height 56px。 */
describe("LandingSegment.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "LandingSegment.module.css"),
    "utf8",
  );

  it("往下箭點 44×44", () => {
    expect(css).toMatch(/\.next\s*\{[\s\S]*?width:\s*44px/);
    expect(css).toMatch(/\.next\s*\{[\s\S]*?height:\s*44px/);
  });

  it("CTA min-height 56px", () => {
    expect(css).toMatch(/\.cta\s*\{[\s\S]*?min-height:\s*56px/);
  });

  it("CTA 不用橘色漸層 pill", () => {
    const ctaBlock = css.match(/\.cta\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(ctaBlock).not.toMatch(/linear-gradient/);
    expect(ctaBlock).not.toMatch(/--landing-cta-from/);
  });

  it("往下箭無 nudge 動畫", () => {
    expect(css).not.toMatch(/@keyframes nudge/);
    const nextBlock = css.match(/\.next\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(nextBlock).not.toMatch(/animation:/);
  });

  it("CTA 用深色玻璃底", () => {
    const ctaBlock = css.match(/\.cta\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(ctaBlock).toMatch(/rgba\(0,\s*0,\s*0,\s*0\.38\)/);
    expect(ctaBlock).not.toMatch(/rgba\(255,\s*255,\s*255,\s*0\.16\)/);
  });

  it("CTA 字色用品牌黃、有白邊", () => {
    const ctaBlock = css.match(/\.cta\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(ctaBlock).toMatch(/color:\s*var\(--c-yellow\)/);
    expect(ctaBlock).toMatch(/border:\s*1px\s+solid/);
  });

  it("CTA 字級為標題階、不用內文／標籤字", () => {
    const ctaBlock = css.match(/\.cta\s*\{[\s\S]*?\}/)?.[0] ?? "";
    expect(ctaBlock).toMatch(/font-size:\s*var\(--fs-h2\)/);
    expect(ctaBlock).not.toMatch(/--fs-body/);
    expect(css).not.toMatch(/\.cta\s*\{[^}]*font-size:\s*var\(--fs-label\)/);
    expect(css).not.toMatch(/\.cta\s*\{[^}]*font-size:\s*var\(--fs-control\)/);
  });

  it("深色玻璃 CTA／往下箭 focus 用 var(--on-dark) outline", () => {
    expect(css).toMatch(/\.cta:focus-visible/);
    expect(css).toMatch(/\.next:focus-visible/);
    expect(css).toMatch(
      /\.cta:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
    expect(css).toMatch(
      /\.next:focus-visible[\s\S]*?outline:\s*3px\s+solid\s+var\(--on-dark\)/,
    );
  });

  it("首段標題可見 lockup，不得解除 siteIntro 的 sr-only", () => {
    expect(css).toMatch(
      /:global\(#segment-stories\)\s+\.titleHidden\s*\{[\s\S]*?position:\s*static/,
    );
    expect(css).not.toMatch(
      /:global\(#segment-stories\)\s+:global\(\.sr-only\)/,
    );
  });
});
