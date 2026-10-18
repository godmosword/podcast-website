import { describe, expect, it } from "vitest";
import { getStories } from "@/data/content";
import { storyCoverPath } from "@/lib/story-utils";
import { getStoryBlurDataUrl } from "./story-image-blur";

describe("story-image-blur (D1)", () => {
  it("已知封面路徑回傳 data URL", () => {
    const blur = getStoryBlurDataUrl("/stories/ep-1/01.jpg");
    expect(blur).toMatch(/^data:image\/jpeg;base64,/);
  });

  it("未知路徑回傳 undefined", () => {
    expect(getStoryBlurDataUrl("/stories/missing/01.jpg")).toBeUndefined();
  });

  it("每一集封面都有 blur，避免下一集縮圖先空白", () => {
    for (const story of getStories()) {
      const src = storyCoverPath(story.slug);
      expect(getStoryBlurDataUrl(src), `${story.slug} 缺 ${src}`).toMatch(
        /^data:image\/jpeg;base64,/,
      );
    }
  });
});
