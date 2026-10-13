import { describe, expect, test } from "vitest";
import { pickPaletteHex } from "./reference-pick";
import { COLORING_PALETTE } from "./tools";
import {
  LEGACY_COLORING_PALETTE,
  LEGACY_TO_CURRENT_HEX,
  recolorLegacyPixel,
} from "./palette-migration";

describe("舊色→新色", () => {
  test("十二色都有對照，白不變，舊紅對到粉彩紅而不是咖啡", () => {
    expect(Object.keys(LEGACY_TO_CURRENT_HEX)).toHaveLength(12);
    expect(LEGACY_TO_CURRENT_HEX["#ffffff"]).toBe("#ffffff");
    expect(LEGACY_TO_CURRENT_HEX["#e85d4c"]).toBe("#e7a8a0");
    expect(LEGACY_TO_CURRENT_HEX["#e85d4c"]).not.toBe(
      COLORING_PALETTE.find((swatch) => swatch.id === "brown")!.hex,
    );
  });

  test("舊的純色像素換成同 id 的新色後，nearestSwatch 指回那一色", () => {
    for (const legacy of LEGACY_COLORING_PALETTE) {
      const [r, g, b] = recolorLegacyPixel(...legacy.rgb);
      const expected = LEGACY_TO_CURRENT_HEX[legacy.hex];
      expect([r, g, b]).toEqual([
        COLORING_PALETTE.find((swatch) => swatch.hex === expected)!.rgba[0],
        COLORING_PALETTE.find((swatch) => swatch.hex === expected)!.rgba[1],
        COLORING_PALETTE.find((swatch) => swatch.hex === expected)!.rgba[2],
      ]);
      const data = new Uint8ClampedArray(4);
      data.set([r, g, b, 255]);
      expect(pickPaletteHex(data, 1, 1, 0, 0)).toBe(expected);
    }
  });

  test("再跑一次不會把粉彩又對去別的舊色", () => {
    for (const legacy of LEGACY_COLORING_PALETTE) {
      const once = recolorLegacyPixel(...legacy.rgb);
      const twice = recolorLegacyPixel(...once);
      expect(twice).toEqual(once);
    }
  });

  test("線條與離色票很遠的像素留著", () => {
    expect(recolorLegacyPixel(0, 0, 0)).toEqual([0, 0, 0]);
    expect(recolorLegacyPixel(10, 80, 200)).toEqual([10, 80, 200]);
  });
});
