// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DuoDuoArt } from "./duoduo-art";
import { SPIKE_LENGTH, spikePath } from "./duoduo-geometry";
import { DUODUO_INK, DUODUO_PALETTE, DUODUO_STROKE, DUODUO_VIEWBOX } from "./duoduo-palette";
import { DuoDuoSheet } from "./duoduo-sheet";

const root = join(import.meta.dirname, "../../..");

describe("多多角色", () => {
  test("視圖比例寫進廚房與結算", () => {
    const ratio = `${DUODUO_VIEWBOX.width} / ${DUODUO_VIEWBOX.height}`;
    const kitchen = readFileSync(join(root, "components/games/DinoSushiKitchen.module.css"), "utf8");
    const view = readFileSync(join(root, "components/games/DinoSushiView.module.css"), "utf8");
    expect(kitchen).toContain(ratio);
    expect(view).toContain(ratio);
  });

  test("風格聖經記下描邊色與主線寬", () => {
    const bible = readFileSync(join(root, "docs/STYLE-BIBLE.md"), "utf8");
    expect(bible).toContain(DUODUO_INK);
    expect(bible).toContain(String(DUODUO_STROKE));
    expect(bible).toContain(DUODUO_PALETTE.green.base);
    expect(bible).toContain(DUODUO_PALETTE.mouth);
  });

  test("背刺一樣長", () => {
    const a = spikePath({ x: 10, y: 20, deg: -90 });
    const b = spikePath({ x: 40, y: 30, deg: -40 });
    expect(a).not.toBe(b);
    expect(SPIKE_LENGTH).toBe(16);
  });

  test("張嘴沒有牙齦紅，角色表畫得出三角度、六表情、三姿勢", () => {
    const open = render(<DuoDuoArt mouth="open" face="idle" animate={false} />);
    const html = open.container.innerHTML;
    expect(html).not.toContain("#8a2a2a");
    expect(html).not.toContain("#ff6b6b");
    expect(html).toContain(DUODUO_INK);
    open.unmount();

    const sheet = render(<DuoDuoSheet />);
    expect(sheet.container.querySelectorAll("svg")).toHaveLength(12);
    const text = sheet.container.textContent ?? "";
    expect(text).toContain("正面");
    expect(text).toContain("想睡");
    expect(text).toContain("吃東西");
  });
});
