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
    expect(css).toMatch(/\.name\s*\{[\s\S]*?white-space:\s*normal/);
    expect(css).not.toMatch(/white-space:\s*nowrap/);
    expect(css).toMatch(/box-shadow:\s*0 2px 0/);
    expect(css).toMatch(
      /border:\s*3px solid color-mix\(in srgb, var\(--coloring-ink\) 62%, var\(--bg\)\)/,
    );
  });

  it("色票外框日間對白底、夜間對深底都至少 3:1，填色不在這條規則裡", () => {
    const day = mix([52, 48, 43], [255, 255, 255], 0.62);
    const night = mix([240, 234, 216], [20, 19, 18], 0.62);
    expect(contrast(day, [255, 255, 255])).toBeGreaterThanOrEqual(3);
    expect(contrast(night, [20, 19, 18])).toBeGreaterThanOrEqual(3);
    expect(contrast(night, [39, 36, 34])).toBeGreaterThanOrEqual(3);
  });
});

function lin(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(rgb: readonly [number, number, number]): number {
  return 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
}

function contrast(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

function mix(
  ink: readonly [number, number, number],
  bg: readonly [number, number, number],
  inkShare: number,
): [number, number, number] {
  return [
    Math.round(ink[0] * inkShare + bg[0] * (1 - inkShare)),
    Math.round(ink[1] * inkShare + bg[1] * (1 - inkShare)),
    Math.round(ink[2] * inkShare + bg[2] * (1 - inkShare)),
  ];
}
