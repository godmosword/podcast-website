import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** D14：IconButton 觸控與 focus 契約。 */
describe("IconButton.module.css", () => {
  const css = readFileSync(
    join(import.meta.dirname, "IconButton.module.css"),
    "utf8",
  );

  it("預設觸控區 ≥44px", () => {
    expect(css).toMatch(/\.root\s*\{[\s\S]*?min-width:\s*44px/);
    expect(css).toMatch(/\.root\s*\{[\s\S]*?min-height:\s*44px/);
  });

  it("focus-visible 使用 focus-ring", () => {
    expect(css).toMatch(/\.root:focus-visible\s*\{[\s\S]*?outline:\s*3px solid var\(--focus-ring\)/);
  });

  it("prefers-reduced-motion 關閉按壓位移", () => {
    expect(css).toContain("prefers-reduced-motion: reduce");
  });
});
