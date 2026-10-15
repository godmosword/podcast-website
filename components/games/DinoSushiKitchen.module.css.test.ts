import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

function readCss(name: string): string {
  return readFileSync(join(import.meta.dirname, name), "utf8");
}

/** 壽司屋廚房的動畫守門：每個新動畫都要能被「減少動態」關掉、暫停時停住。常駐動態只有迴轉帶（在 DinoSushiShop）。 */
const css = readCss("DinoSushiKitchen.module.css");

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

  it("擠掉的料會飛回托盤；減少動態與 data-reduced 改成淡出，暫停時停住", () => {
    expect(block(".evictFly {")).toMatch(/animation:\s*evictFly/);
    expect(css).toContain("@keyframes evictFly");
    expect(css).toContain("@keyframes evictFade");
    expect(block("@keyframes evictFly {")).toMatch(/transform:/);
    expect(block("@keyframes evictFade {")).not.toMatch(/translate\(var\(--to-/);
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    const reducedBlock = media.slice(0, media.indexOf('.kitchen[data-reduced="true"]'));
    expect(reducedBlock).toMatch(/\.evictFly\s*\{[^}]*animation-name:\s*evictFade/);
    expect(block('.kitchen[data-reduced="true"] .evictFly {')).toMatch(/animation-name:\s*evictFade/);
    expect(css).toContain('.kitchen[data-paused="true"] .evictFly');
  });

  it("料換位置時滑過去；減少動態與 data-reduced 不滑", () => {
    const layer = ".sushiButton > [data-sushi] > span";
    expect(block(`${layer} {`)).toMatch(/transition:[^;]*left 200ms/);
    const media = css.slice(css.indexOf("@media (prefers-reduced-motion: reduce)"));
    expect(media.slice(0, media.indexOf("\n}\n"))).toMatch(new RegExp(`${layer.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{\\s*transition:\\s*none`));
    expect(css).toContain(`.kitchen[data-reduced="true"] ${layer} {\n  transition: none;`);
  });

  it("料位、托盤、給多多吃、刷牙、吃飽了的觸控下限", () => {
    expect(block(".slot,\n.slotEmpty {")).toMatch(/width:\s*64px/);
    expect(block(".slot,\n.slotEmpty {")).toMatch(/height:\s*64px/);
    expect(css).not.toMatch(/--slot:\s*48px/);
    expect(block(".trayButton {")).toMatch(/min-height:\s*64px/);
    expect(block(".trayButton {")).toMatch(/min-width:\s*64px/);
    expect(block(".brushButton {")).toMatch(/width:\s*80px/);
    expect(block(".brushButton {")).toMatch(/height:\s*80px/);
    expect(block(".fullButton {")).toMatch(/min-height:\s*64px/);
    expect(css).toMatch(/min-height:\s*80px/);
    expect(block(".kitchen button {")).toMatch(/touch-action:\s*manipulation/);
    expect(block(".kitchen button {")).toMatch(/user-select:\s*none/);
    expect(css).toMatch(/\(max-width:\s*899px\) and \(orientation:\s*portrait\)/);
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

describe("標題與結算觸控尺寸", () => {
  const view = readCss("DinoSushiView.module.css");
  const end = readCss("GameEndStation.module.css");

  it("開始至少 88、自由做至少 64×120，卡面鈕關掉雙擊放大", () => {
    expect(view).toMatch(/--start-size:\s*88px/g);
    expect(view).not.toMatch(/--start-size:\s*7[26]px/);
    expect(view).toMatch(/\.freeButton\s*\{[^}]*min-height:\s*64px/);
    expect(view).toMatch(/\.freeButton\s*\{[^}]*min-width:\s*120px/);
    expect(view).toMatch(/\.bookButton\s*\{[^}]*width:\s*96px/);
    expect(view).toMatch(/\.bookButton\s*\{[^}]*height:\s*96px/);
    expect(view).toMatch(/\.resultBook\s*\{[^}]*min-height:\s*64px/);
    expect(view).toMatch(/\.titleActions\s*\{[^}]*gap:\s*12px/);
    expect(view).toMatch(/\.surface button,\s*\n\.surface a\s*\{[^}]*touch-action:\s*manipulation/);
    expect(view).toMatch(/user-select:\s*none/);
  });

  it("壽司屋結算：回標題 64、再做一輪 88", () => {
    expect(end).toMatch(/\[data-side="64"\] \.sideBtn[\s\S]*?width:\s*64px/);
    expect(end).toMatch(/\[data-side="64"\] \.sideBtn[\s\S]*?height:\s*64px/);
    expect(end).toMatch(/\[data-main="88"\] \.mainBtn\s*\{[^}]*width:\s*88px/);
    expect(end).toMatch(/\[data-main="88"\] \.mainBtn\s*\{[^}]*height:\s*88px/);
  });
});
