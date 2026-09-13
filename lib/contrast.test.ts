import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance } from "./contrast";

describe("parseHex", () => {
  it("接受 6 碼與 3 碼、有無 # 皆可", () => {
    expect(parseHex("#ff8c2b")).toEqual({ r: 255, g: 140, b: 43 });
    expect(parseHex("ff8c2b")).toEqual({ r: 255, g: 140, b: 43 });
    expect(parseHex("#FFF")).toEqual({ r: 255, g: 255, b: 255 });
  });

  it("格式不合丟例外（不靜默回黑色）", () => {
    expect(() => parseHex("#12345")).toThrow();
    expect(() => parseHex("rgb(1,2,3)")).toThrow();
    expect(() => parseHex("#gggggg")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("黑為 0、白為 1", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });
});

describe("contrastRatio", () => {
  it("黑白為 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  });

  it("同色為 1:1", () => {
    expect(contrastRatio("#7a7268", "#7a7268")).toBeCloseTo(1, 10);
  });

  it("與參數順序無關", () => {
    expect(contrastRatio("#f0744a", "#ffffff")).toBeCloseTo(
      contrastRatio("#ffffff", "#f0744a"),
      10,
    );
  });

  it("對得上外部工具的已知值", () => {
    // WebAIM contrast checker 的參考值
    expect(contrastRatio("#ffffff", "#767676")).toBeCloseTo(4.54, 2);
    expect(contrastRatio("#ffffff", "#0000ff")).toBeCloseTo(8.59, 2);
    expect(contrastRatio("#000000", "#ffff00")).toBeCloseTo(19.56, 2);
  });
});
