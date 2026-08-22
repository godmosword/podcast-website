import { describe, expect, it } from "vitest";
import { coloringCompletionCopy, coloringCompletionTone } from "./completion";

describe("coloring completion feedback", () => {
  it("不使用百分比，從創作操作逐步提供柔性提示", () => {
    expect(coloringCompletionTone({ operations: 0, colors: 0 })).toBe("start");
    expect(coloringCompletionCopy({ operations: 0, colors: 0 }).detail).toContain("隨時");
    expect(coloringCompletionTone({ operations: 2, colors: 1 })).toBe("growing");
    expect(coloringCompletionTone({ operations: 3, colors: 3 })).toBe("rich");
    expect(coloringCompletionCopy({ operations: 5, colors: 1 }).label).toContain("快完成");
  });
});
