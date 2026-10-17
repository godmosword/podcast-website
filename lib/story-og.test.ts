import { describe, expect, it } from "vitest";
import { storiesByNewest } from "@/data/content";
import {
  createStoryOgImage,
  storyOgContentType,
  storyOgImagePath,
  storyOgCastLine,
  storyOgImageSize,
} from "./story-og";

describe("story og", () => {
  it("exports 1200×630 PNG metadata", () => {
    expect(storyOgImageSize).toEqual({ width: 1200, height: 630 });
    expect(storyOgContentType).toBe("image/png");
  });

  it("storyOgImagePath 指向動態 route", () => {
    expect(storyOgImagePath("ep-18")).toBe("/story/ep-18/opengraph-image");
  });

  it("createStoryOgImage 回傳非空 PNG", async () => {
    const story = storiesByNewest()[0];
    const res = await createStoryOgImage(story);
    expect(res).toBeTruthy();
    const buf = await (res as Response).arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(1000);
  });

  it("分享圖角色名單不放主持人，讓位給該集主角", () => {
    expect(storyOgCastLine("ep-13")).toBe("香香 · 阿酷");
    expect(storyOgCastLine("ep-1")).toBe("沃特");
    expect(storyOgCastLine("ep-15")).toBe("鈴鈴 · 多多 · 小紅");
  });
});
