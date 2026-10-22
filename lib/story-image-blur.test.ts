import { describe, expect, it } from "vitest";
import { getStoryBlurDataUrl } from "./story-image-blur";

describe("story-image-blur (D1)", () => {
  it("已知封面路徑回傳 data URL", () => {
    const blur = getStoryBlurDataUrl("/stories/ep-1/01.jpg");
    expect(blur).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("未知路徑回傳 undefined", () => {
    expect(getStoryBlurDataUrl("/stories/missing/01.jpg")).toBeUndefined();
  });
});
