import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 兒童色票：色塊外緣至少 48px，相鄰間距至少 8px，排不下換行。 */
describe("ColoringPalette.module.css", () => {
  const css = readFileSync(join(import.meta.dirname, "ColoringPalette.module.css"), "utf8");

  it("色塊維持 48px，間距用 8px token，允許換行", () => {
    expect(css).toMatch(/\.wrap\s*\{[\s\S]*?flex-wrap:\s*wrap/);
    expect(css).toMatch(/\.wrap\s*\{[\s\S]*?gap:\s*var\(--space-2\)/);
    expect(css).toMatch(/\.swatch\s*\{[\s\S]*?min-width:\s*48px/);
    expect(css).toMatch(/\.swatch\s*\{[\s\S]*?min-height:\s*48px/);
    expect(css).toMatch(/\.swatch\s*\{[\s\S]*?width:\s*48px/);
    expect(css).toMatch(/\.swatch\s*\{[\s\S]*?height:\s*48px/);
    expect(css).toMatch(/\.name\s*\{[\s\S]*?font-size:\s*var\(--fs-meta\)/);
    expect(css).toMatch(/\.name\s*\{[\s\S]*?color:\s*var\(--ink\)/);
    expect(css).toMatch(/box-shadow:\s*0 2px 0/);
  });
});
