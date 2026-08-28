import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("SiteNavBar.module.css 行動漢堡", () => {
  const css = readFileSync(
    join(import.meta.dirname, "SiteNavBar.module.css"),
    "utf8",
  );

  it("漢堡鈕無底板與邊框，觸控區仍 44px", () => {
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?width:\s*44px/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?height:\s*44px/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?border:\s*0/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?background:\s*transparent/);
    expect(css).toMatch(/\.menuBtn\s*\{[\s\S]*?appearance:\s*none/);
  });
});
