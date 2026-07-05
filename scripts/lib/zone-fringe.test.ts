import { describe, expect, it } from "vitest";
import { despillMagentaEdges, isMagentaFringe } from "./zone-fringe";

describe("isMagentaFringe", () => {
  it("抓 magenta 與混色帶，不抓中性／綠色", () => {
    expect(isMagentaFringe(230, 60, 220)).toBe(true); // 飽和 magenta
    expect(isMagentaFringe(180, 100, 170)).toBe(true); // 抗鋸齒混色帶
    expect(isMagentaFringe(60, 180, 60)).toBe(false); // 綠色本體
    expect(isMagentaFringe(240, 240, 240)).toBe(false); // 近白
  });
});

describe("despillMagentaEdges", () => {
  const W = 6;
  const H = 6;
  const C = 4;

  function makeImage(): Uint8Array {
    const data = new Uint8Array(W * H * C);
    const set = (x: number, y: number, r: number, g: number, b: number, a: number) => {
      const i = (y * W + x) * C;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = a;
    };
    // 中央 4x4 不透明；外圈透明
    for (let y = 1; y < 5; y++) {
      for (let x = 1; x < 5; x++) set(x, y, 200, 120, 190, 255); // 偏 magenta
    }
    // 內部像素（不貼透明邊）保持原色
    set(2, 2, 200, 120, 190, 255);
    return data;
  }

  it("貼透明邊的偏 magenta 像素 R/B 夾向 G，內部像素不動", () => {
    const data = makeImage();
    const touched = despillMagentaEdges(data, W, H, C);
    expect(touched).toBeGreaterThan(0);
    const px = (x: number, y: number) => {
      const i = (y * W + x) * C;
      return [data[i], data[i + 1], data[i + 2]];
    };
    // 邊緣 (1,1) 貼透明 → despill 後 min(r,b) === g
    const [er, eg, eb] = px(1, 1);
    expect(Math.min(er!, eb!)).toBe(eg);
    // 內部 (2,2) 四鄰皆不透明且 a=255 → 不動
    expect(px(2, 2)).toEqual([200, 120, 190]);
  });
});
