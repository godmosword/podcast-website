import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** 壽司屋廚房的動畫守門：每個新動畫都要能被「減少動態」關掉、暫停時停住。常駐動態只有迴轉帶（在 DinoSushiShop）。 */
const css = readFileSync(join(import.meta.dirname, "DinoSushiKitchen.module.css"), "utf8");

const ANIMATED = [
  '.servingSushi[data-phase="open"]',
  '.duoArt [data-part="cheeks"] > g',
  '.duoArt [data-part="puff-cloud"]',
  '.duoArt [data-part="sweet-stars"] > path',
  ".plates[data-land]",
];

function block(start: string): string {
  const i = css.indexOf(start);
  expect(i, `缺少 ${start}`).toBeGreaterThan(-1);
  return css.slice(i, css.indexOf("}", i));
}

describe("DinoSushiKitchen.module.css 動畫", () => {
  it.each(ANIMATED)("%s 有動畫，且 reduced-motion、data-reduced、data-paused 都管得到", (sel) => {
    expect(css).toContain(`${sel} {`);
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(media.slice(0, media.indexOf("\n}\n")), "prefers-reduced-motion").toContain(sel);
    expect(css).toContain(`.kitchen[data-reduced="true"] ${sel}`);
    expect(css).toContain(`.kitchen[data-paused="true"] ${sel}`);
  });

  it("新動畫都是有限次數（沒有 infinite）", () => {
    for (const sel of ANIMATED) expect(block(`${sel} {`)).not.toMatch(/infinite/);
  });

  it("多多外層不掛 CSS drop-shadow（表情動畫時整張濾鏡重算）", () => {
    expect(block(".duoArt > svg {")).not.toMatch(/filter:/);
  });

  it("提示光暈在減少動態與 data-reduced 時停住，靜止亮框還在", () => {
    expect(block(".kitchen [data-hint=\"true\"] {")).toMatch(/animation:\s*sushiGlow/);
    expect(block(".kitchen [data-hint=\"true\"] {")).toMatch(/box-shadow:/);
    const media = css.slice(
      css.indexOf("@media (prefers-reduced-motion: reduce)"),
      css.indexOf('.kitchen[data-reduced="true"]'),
    );
    expect(media).toMatch(/\.kitchen \[data-hint="true"\]\s*\{[^}]*animation:\s*none/);
    expect(css).toContain('.kitchen[data-reduced="true"] [data-hint="true"]');
    expect(block('.kitchen[data-reduced="true"] [data-hint="true"],')).toMatch(/animation:\s*none/);
  });
});
