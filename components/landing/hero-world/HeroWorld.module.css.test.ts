import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HERO_STAGE_ASPECT } from "./art-direction";

/** 註解會提到已經作廢的舊值，negative 斷言必須先剝掉註解。 */
const stripComments = (input: string) => input.replace(/\/\*[\s\S]*?\*\//g, "");

/**
 * 直式手機的構圖紅線。
 *
 * 這支測試存在的理由：`.stage` 曾經是 `width: 134%; right: -17%`，配上
 * `.hero { overflow: hidden }` 等於在 390px 上左右各裁掉 66px，再加相機
 * scale 1.15 又切掉約 13% 的水平視野，整座島的兩端都看不到。使用者是在
 * 實機上發現的，而不是任何測試發現的。
 *
 * 語意層的保證（島有沒有真的被切到）由 `scripts/qa-hero-framing.mjs` 用
 * 3D 投影量測；這支只守住「CSS 不准再用負 offset 把 stage 撐出畫面」。
 */
describe("HeroWorld.module.css 直式手機 stage", () => {
  const css = readFileSync(join(import.meta.dirname, "HeroWorld.module.css"), "utf8");

  const narrow = (() => {
    const start = css.indexOf("@media (max-width: 768px)");
    expect(start, "缺少 ≤768 區塊").toBeGreaterThan(-1);
    const end = css.indexOf("@media", start + 1);
    return stripComments(css.slice(start, end === -1 ? undefined : end));
  })();

  const stage = (() => {
    const start = narrow.indexOf(".stage {");
    expect(start, "≤768 區塊缺少 .stage").toBeGreaterThan(-1);
    return narrow.slice(start, narrow.indexOf("}", start) + 1);
  })();

  it("不用超過視窗寬度的 stage 撐大場景", () => {
    const width = /width:\s*([\d.]+)%/.exec(stage);
    expect(width, ".stage 必須顯式宣告 width").not.toBeNull();
    expect(Number(width?.[1])).toBeLessThanOrEqual(100);
  });

  it("不用負 offset 把 stage 推出畫面（overflow:hidden 會直接裁掉島的兩端）", () => {
    expect(stage).not.toMatch(/(?:left|right):\s*-/);
  });

  it("stage 的長寬比與 art-direction 同源，poster 與 canvas 才不會交接跳構圖", () => {
    const ratio = /aspect-ratio:\s*([\d.]+)\s*\/\s*([\d.]+)/.exec(stage);
    expect(ratio, ".stage 必須用 aspect-ratio 綁住高度").not.toBeNull();
    const declared = Number(ratio?.[1]) / Number(ratio?.[2]);
    expect(declared).toBeCloseTo(HERO_STAGE_ASPECT.mobile, 3);
  });

  it("hero 仍然裁切溢出，所以上面兩條才是紅線", () => {
    const hero = css.slice(css.indexOf(".hero {"), css.indexOf("}", css.indexOf(".hero {")));
    expect(hero).toMatch(/overflow:\s*hidden/);
  });

  it("直向視差改兩列 grid，場景列才有完整高度", () => {
    expect(narrow).toMatch(/\[data-stage="parallax"\]\s*\{[^}]*display:\s*grid/);
    expect(narrow).toMatch(/grid-template-rows:\s*auto minmax\(0,\s*1fr\)/);
  });
});
