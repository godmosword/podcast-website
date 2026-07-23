import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 手機宇宙地圖：裝飾標題 pill 視覺隱藏（語意標題在頁面 sr-only h1）。 */
describe("UniverseMap.module.css mobile chrome", () => {
  const css = readFileSync(
    join(import.meta.dirname, "UniverseMap.module.css"),
    "utf8",
  );

  it("≤480px 以 sr-only 手法隱藏 .titleSign", () => {
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.titleSign\s*\{[\s\S]*?clip:\s*rect\(0,\s*0,\s*0,\s*0\)/,
    );
    expect(css).toMatch(
      /@media\s*\(max-width:\s*480px\)\s*\{[\s\S]*?\.titleSign\s*\{[\s\S]*?width:\s*1px/,
    );
  });
});

/** 首訪底部提示（2A）：screen-space 定位、pointer-events、不蓋 MapControls。 */
describe("UniverseMap.module.css tap hint", () => {
  const css = readFileSync(
    join(import.meta.dirname, "UniverseMap.module.css"),
    "utf8",
  );

  it(".tapHint 為 screen-space 底部置中（absolute + bottom + translateX）", () => {
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?position:\s*absolute/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?bottom:\s*calc\(16px \+ var\(--safe-bottom\)\)/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?left:\s*50%/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?transform:\s*translateX\(-50%\)/);
  });

  it(".tapHint pointer-events 僅自身；z-index 低於 MapControls（5）", () => {
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?pointer-events:\s*auto/);
    expect(css).toMatch(/\.tapHint\s*\{[\s\S]*?z-index:\s*4/);
  });

  it(".tapHintClose 觸控目標 ≥48px；動效僅 transform/opacity + reduced-motion", () => {
    expect(css).toMatch(/\.tapHintClose\s*\{[\s\S]*?min-width:\s*48px/);
    expect(css).toMatch(/\.tapHintClose\s*\{[\s\S]*?min-height:\s*48px/);
    expect(css).toMatch(/@keyframes tapHintEnter[\s\S]*?opacity:\s*1/);
    expect(css).toMatch(/@keyframes tapHintEnter[\s\S]*?transform:\s*translateX\(-50%\)/);
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*?\.tapHint\s*\{[\s\S]*?animation:\s*none/,
    );
  });
});
