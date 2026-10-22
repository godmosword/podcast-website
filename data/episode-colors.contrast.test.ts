import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AA_NORMAL_TEXT, contrastRatio } from "@/lib/contrast";
import { EPISODE_TINTS } from "./episode-colors";

function rootHex(name: string): string {
  const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
  const root = css.slice(0, css.indexOf('[data-theme="night"]'));
  const match = root.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,8})\\s*;`));
  if (!match) throw new Error(`globals.css 找不到 --${name}`);
  return match[1]!;
}

describe("主按鈕與每集墊色", () => {
  it("開始看故事綁深墨主鈕，不再用單集色壓暗", () => {
    const css = readFileSync(
      join(process.cwd(), "components", "PlayButton.module.css"),
      "utf8",
    );
    expect(css).toContain("var(--cta-solid-bg)");
    expect(css).toContain("var(--cta-solid-fg)");
    expect(css).not.toContain("--play-bg");
    const ratio = contrastRatio(rootHex("on-dark"), rootHex("landing-brand-ink"));
    expect(ratio).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
  });

  it("六色墊色上的深墨字達 AA（chip／淡底用）", () => {
    const ink = rootHex("marker-ink");
    const failures: string[] = [];
    for (const tint of EPISODE_TINTS) {
      const ratio = contrastRatio(ink, tint);
      if (ratio < AA_NORMAL_TEXT) failures.push(`${tint} ${ratio.toFixed(2)}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
});
