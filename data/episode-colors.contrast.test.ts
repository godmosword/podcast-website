import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio, parseHex } from "@/lib/contrast";
import { EPISODE_COLORS, episodeColorForSlug } from "./episode-colors";

/**
 * `PlayButton` 的底色是 `color-mix(in srgb, var(--play-bg) 56%, black)`，
 * `--play-bg` 就是單集色，前景固定 `--on-dark`（#ffffff）。
 */
const DARKEN_RATIO = 0.56;

/**
 * 底色之上還疊了 `linear-gradient(180deg, rgba(255,255,255,.18), rgba(0,0,0,.08))`。
 * 漸層會把上半部提亮，所以壓暗後的值必須留餘裕。
 *
 * 餘裕怎麼來的：在 390px 實機量 ep-5（全站最淺的單集色 #f59f00）的 CTA 實際像素，
 * 文字帶（按鈕高度 30–70%）是 4.75→5.89:1，而未疊漸層的底色是 6.01:1。
 * 最壞情況掉約 1.26，取 1.3 當門檻餘裕。
 */
const GRADIENT_HEADROOM = 1.3;

function darkenedBackground(hex: string): string {
  const { r, g, b } = parseHex(hex);
  const mix = (channel: number) =>
    Math.round(channel * DARKEN_RATIO)
      .toString(16)
      .padStart(2, "0");
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function onDarkToken(): string {
  const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
  const match = css.match(/--on-dark:\s*(#[0-9a-fA-F]{3,6})\s*;/);
  if (!match) throw new Error("globals.css 找不到 --on-dark");
  return match[1]!;
}

describe("單集色用在「開始看故事」CTA 時的對比", () => {
  const fg = onDarkToken();

  it("每個單集色壓暗後都留得住漸層餘裕", () => {
    const failures: string[] = [];
    for (const [slug, hex] of Object.entries(EPISODE_COLORS)) {
      const ratio = contrastRatio(fg, darkenedBackground(hex));
      if (ratio < AA_NORMAL_TEXT + GRADIENT_HEADROOM) {
        failures.push(`${slug} ${hex} → ${ratio.toFixed(2)}`);
      }
    }
    expect(
      failures,
      `這些單集色太淺，CTA 白字疊上 gloss 漸層後會掉到 AA 以下：\n${failures.join("\n")}`,
    ).toEqual([]);
  });

  it("沒有登記的集數走預設色，同樣達標", () => {
    const ratio = contrastRatio(
      fg,
      darkenedBackground(episodeColorForSlug("ep-does-not-exist")),
    );
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT + GRADIENT_HEADROOM);
  });
});
