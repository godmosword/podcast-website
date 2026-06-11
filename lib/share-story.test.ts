import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  lineShareUrl,
  storyLineShareText,
  storyShareUrl,
} from "./share-story";

describe("storyShareUrl", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("組出單集絕對網址", () => {
    expect(storyShareUrl("ep-1")).toBe("https://example.com/story/ep-1");
  });
});

describe("storyLineShareText", () => {
  const prev = process.env.NEXT_PUBLIC_SITE_URL;

  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://example.com";
  });

  afterEach(() => {
    if (prev === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = prev;
  });

  it("含集數、標題、大綱與連結", () => {
    const text = storyLineShareText({
      ep: 3,
      title: "小紅賽車",
      slug: "ep-3",
      summary: "一起比賽吧！",
    });
    expect(text).toContain("EP 3 小紅賽車");
    expect(text).toContain("一起比賽吧！");
    expect(text).toContain("https://example.com/story/ep-3");
  });

  it("無大綱時用預設句", () => {
    const text = storyLineShareText({
      ep: 1,
      title: "測試",
      slug: "test",
    });
    expect(text).toContain("睡前看圖聽故事");
  });
});

describe("lineShareUrl", () => {
  it("編碼為 LINE 分享網址", () => {
    const url = lineShareUrl("你好\nhttps://example.com");
    expect(url).toMatch(/^https:\/\/line\.me\/R\/msg\/text\/\?/);
    expect(decodeURIComponent(url.split("?")[1]!)).toBe(
      "你好\nhttps://example.com",
    );
  });
});
