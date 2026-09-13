import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio } from "@/lib/contrast";

const css = readFileSync(join(import.meta.dirname, "globals.css"), "utf8");

/**
 * 只讀 `:root` 區塊裡的字面 hex。`color-mix()`／`var()` 衍生值不在這裡驗——
 * 那些要嘛在夜間區塊（已另行實測），要嘛得先跑 CSS 引擎才解得出來。
 */
function rootToken(name: string): string {
  const root = css.slice(0, css.indexOf('[data-theme="night"]'));
  const match = root.match(
    new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`),
  );
  if (!match) throw new Error(`:root 找不到字面 hex 的 --${name}`);
  return match[1]!;
}

describe("globals.css 日間色彩對比門檻", () => {
  it("--support-fg 對 --support-from／--support-to 皆達 AA 內文", () => {
    const fg = rootToken("support-fg");
    for (const stop of ["support-from", "support-to"]) {
      const ratio = contrastRatio(fg, rootToken(stop));
      expect(ratio, `--support-fg on --${stop} = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
        AA_NORMAL_TEXT,
      );
    }
  });

  it("--ink 與 --ink-soft 對 --bg／--card 皆達 AA 內文", () => {
    for (const ink of ["ink", "ink-soft"]) {
      for (const surface of ["bg", "card"]) {
        const ratio = contrastRatio(rootToken(ink), rootToken(surface));
        expect(
          ratio,
          `--${ink} on --${surface} = ${ratio.toFixed(2)}`,
        ).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
      }
    }
  });

  it("--accent-ink 對 --card 達 AA 內文（--accent 本身刻意不當文字色）", () => {
    const ratio = contrastRatio(rootToken("accent-ink"), rootToken("card"));
    expect(ratio, `--accent-ink on --card = ${ratio.toFixed(2)}`).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});
