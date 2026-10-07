import { describe, expect, test } from "vitest";
import {
  alignmentCost,
  applyRecipe,
  findAlignment,
  labelRegions,
  paletteRgb,
  renderReference,
  sampleRegionColors,
  snapToPalette,
} from "./coloring-reference";

const SIZE = 16;
const WHITE = [255, 255, 255] as const;
const INK = [0, 0, 0] as const;

/** 16×16 線稿：第 8 欄一條直線，左右各一塊。 */
function splitLine(): Uint8Array {
  const rgb = new Uint8Array(SIZE * SIZE * 3);
  for (let p = 0; p < SIZE * SIZE; p++) rgb.set(p % SIZE === 8 ? INK : WHITE, p * 3);
  return rgb;
}

/** 左半紅、右半藍的「原圖」。 */
function splitSource(): Uint8Array {
  const rgb = new Uint8Array(SIZE * SIZE * 3);
  for (let p = 0; p < SIZE * SIZE; p++)
    rgb.set(p % SIZE < 8 ? [230, 60, 50] : [40, 150, 220], p * 3);
  return rgb;
}

describe("labelRegions", () => {
  test("線把畫面切成兩塊，線本身標 -1", () => {
    const regions = labelRegions(splitLine(), SIZE);
    expect(regions.count).toBe(2);
    expect(regions.label[8]).toBe(-1);
    expect(regions.label[0]).not.toBe(regions.label[15]);
  });
});

describe("sampleRegionColors / findAlignment", () => {
  test("對齊時每塊取到原圖對應色", () => {
    const regions = labelRegions(splitLine(), SIZE);
    const { alignment } = findAlignment(regions, splitSource());
    const colors = sampleRegionColors(regions, splitSource(), alignment);
    expect(snapToPalette(colors[regions.label[0]!]!)).toBe("red");
    expect(snapToPalette(colors[regions.label[15]!]!)).toBe("blue");
  });

  test("對位成本：對齊的原圖比顛倒的原圖低", () => {
    const regions = labelRegions(splitLine(), SIZE);
    const flipped = new Uint8Array(splitSource()).reverse();
    const identity = { scale: 1, dx: 0, dy: 0 };
    expect(alignmentCost(regions, splitSource(), identity)).toBeLessThanOrEqual(
      alignmentCost(regions, flipped, identity),
    );
  });
});

describe("snapToPalette", () => {
  test.each([
    [[240, 228, 200], "white"],
    [[30, 45, 110], "blue"],
    [[50, 50, 55], "black"],
    [[150, 150, 150], "gray"],
    [[170, 120, 80], "brown"],
    [[220, 180, 40], "yellow"],
    [[80, 170, 60], "green"],
    [[240, 170, 170], "pink"],
  ] as const)("%j → %s", (rgb, expected) => {
    expect(snapToPalette(rgb)).toBe(expected);
  });
});

describe("applyRecipe", () => {
  const regions = labelRegions(splitLine(), SIZE);
  const base = Array.from({ length: regions.count }, () => "red" as const);

  test("remap 後再逐點修色，不改動原陣列", () => {
    const next = applyRecipe(base, regions, {
      remap: { red: "yellow" },
      paint: [{ at: [0.95, 0.5], color: "sky" }],
    });
    expect(next[regions.label[0]!]).toBe("yellow");
    expect(next[regions.label[15]!]).toBe("sky");
    expect(base[0]).toBe("red");
  });

  test("點落在線上時就近找區塊", () => {
    const next = applyRecipe(base, regions, { paint: [{ at: [8 / 15, 0.5], color: "pink" }] });
    expect(next).toContain("pink");
  });

  test("兩點同區塊要不同色就擋下", () => {
    expect(() =>
      applyRecipe(base, regions, {
        paint: [
          { at: [0.1, 0.1], color: "sky" },
          { at: [0.2, 0.9], color: "green" },
        ],
      }),
    ).toThrow(/同一區塊/);
  });
});

describe("renderReference", () => {
  test("區塊填色、線保持黑色", () => {
    const line = splitLine();
    const regions = labelRegions(line, SIZE);
    const colors = Array.from({ length: regions.count }, () => "green" as const);
    const out = renderReference(line, regions, colors);
    expect([...out.slice(0, 3)]).toEqual([...paletteRgb("green")]);
    expect([...out.slice(8 * 3, 8 * 3 + 3)]).toEqual([0, 0, 0]);
  });
});
