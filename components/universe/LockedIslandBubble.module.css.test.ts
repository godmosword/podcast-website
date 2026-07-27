import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * 鎖島泡泡契約：硬白底 + var(--ink) 在夜間是近白字壓白底（看不見）；
 * 且不反縮放時字級會隨鏡頭跳動。兩者皆為正式站回饋（2026-07-27）。
 */
describe("LockedIslandBubble.module.css 可讀性契約", () => {
  const css = readFileSync(
    join(import.meta.dirname, "LockedIslandBubble.module.css"),
    "utf8",
  );
  const bubbleBlock = css.slice(css.indexOf(".bubble {"), css.indexOf(".bubble::after"));

  it("底／字／邊走 --map-chip*（日夜不反轉）", () => {
    expect(bubbleBlock).toMatch(/background:\s*var\(--map-chip\)/);
    expect(bubbleBlock).toMatch(/color:\s*var\(--map-chip-ink\)/);
    expect(bubbleBlock).toMatch(/border:[^;]*var\(--map-chip-line\)/);
  });

  it("不使用夜間會翻色的 --ink／白底", () => {
    expect(bubbleBlock).not.toMatch(/var\(--ink\)/);
    expect(bubbleBlock).not.toMatch(/rgba\(255,\s*255,\s*255/);
  });

  it("反縮放吃舞台 --map-scale，且動畫 keyframes 也維持反縮放", () => {
    expect(bubbleBlock).toMatch(/scale\(calc\(1 \/ var\(--map-scale, 1\)\)\)/);
    const popBlock = css.slice(css.indexOf("@keyframes bubblePop"));
    const scaleCalls = popBlock.match(/var\(--map-scale, 1\)/g) ?? [];
    expect(scaleCalls.length).toBeGreaterThanOrEqual(4);
  });
});
