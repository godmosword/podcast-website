import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1／UX-P1-4：播放器定時選項與進度條命中區 ≥44px。 */
describe("StoryPlayer.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "StoryPlayer.module.css"),
    "utf8",
  );

  it("進度條 --seek-hit 為 44px", () => {
    expect(css).toMatch(/--seek-hit:\s*44px/);
    expect(css).not.toMatch(/--seek-hit:\s*(?:2\d|3[0-2])px/);
  });

  it("睡前定時選項 min-height 44px", () => {
    expect(css).toMatch(/\.timerOpt\s*\{[\s\S]*?min-height:\s*44px/);
  });
});
