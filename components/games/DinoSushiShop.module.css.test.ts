import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(import.meta.dirname, "DinoSushiShop.module.css"), "utf8");

describe("DinoSushiShop.module.css 每輪氣氛", () => {
  it("晴天、傍晚、下雪只改圓窗濾鏡和牆面罩，圓蓋掀開只動 transform", () => {
    expect(css).toContain('.wall[data-sky="sunny"]');
    expect(css).toContain('.wall[data-sky="evening"]');
    expect(css).toContain('.wall[data-sky="snow"]');
    expect(css).toContain('.window[data-sky="sunny"] img');
    expect(css).toContain('.window[data-sky="evening"] img');
    expect(css).toContain('.window[data-sky="snow"] img');
    expect(css).toContain('.lantern[data-tone="gold"] img');
    expect(css).toContain("@keyframes domeLift");
    expect(css).toMatch(/\.dome\[data-open="true"\]\s*\{[^}]*animation:\s*domeLift/);
    expect(css).toMatch(/@keyframes domeLift\s*\{[^}]*transform:/);
  });

  it("減少動態直接掀開，暫停時停住", () => {
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(media).toMatch(/\.dome\[data-open="true"\]\s*\{[^}]*animation:\s*none/);
    expect(media).toMatch(/transform:\s*translateY\(-78%\)/);
    expect(css).toContain(':global([data-reduced="true"]) .dome[data-open="true"]');
    expect(css).toContain(':global([data-paused="true"]) .dome[data-open="true"]');
    expect(css).toContain("animation-play-state: paused");
  });
});
