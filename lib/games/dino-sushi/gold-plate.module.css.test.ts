import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const css = readFileSync(join(import.meta.dirname, "gold-plate.module.css"), "utf8");

describe("gold-plate.module.css 金盤光澤", () => {
  it("光澤層用盤子圖當遮罩，Safari 有 -webkit- 前綴，contain 對齊 object-fit", () => {
    for (const prop of ["mask-image: var(--plate-mask)", "mask-size: contain", "mask-position: center", "mask-repeat: no-repeat"]) {
      expect(css).toContain(`  ${prop};`);
      expect(css).toContain(`-webkit-${prop};`);
    }
  });

  it("每個動畫都在減少動態與暫停清單裡", () => {
    const animated = [...css.matchAll(/\n\.([a-z]+)[^{]*\{[^}]*animation:\s*[a-zA-Z]/g)].map((m) => m[1]);
    expect(new Set(animated)).toEqual(new Set(["shine", "star"]));
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    for (const name of animated) {
      expect(media).toMatch(new RegExp(`\\.${name}[^{]*\\{[^}]*animation: none`));
      expect(css).toContain(`:global([data-reduced="true"]) .${name}`);
      expect(css).toContain(`:global([data-paused="true"]) .${name}`);
    }
    expect(css).toContain("animation-play-state: paused");
  });
});
