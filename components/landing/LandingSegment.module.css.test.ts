import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** UX-P1-1：Landing 往下箭點觸控區 ≥44px。 */
describe("LandingSegment.module.css touch targets", () => {
  const css = readFileSync(
    join(import.meta.dirname, "LandingSegment.module.css"),
    "utf8",
  );

  it("往下箭點 44×44", () => {
    expect(css).toMatch(/\.next\s*\{[\s\S]*?width:\s*44px/);
    expect(css).toMatch(/\.next\s*\{[\s\S]*?height:\s*44px/);
  });
});
