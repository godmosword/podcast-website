import { describe, expect, it, vi } from "vitest";
import type { Story } from "@/data/content";
import { storiesByNewest } from "@/data/content";
import {
  CHANNEL_OWNER_EMAIL,
  CHANNEL_PODCAST_GUID,
} from "@/lib/feed-constants";
import { buildRssFeed } from "./feed";

function storyFixture(partial: Partial<Story> & Pick<Story, "slug">): Story {
  const base = storiesByNewest()[0];
  return { ...base, ...partial };
}

describe("buildRssFeed", () => {
  it("產生含 channel 與各集 item 的 RSS", () => {
    const xml = buildRssFeed(storiesByNewest());
    expect(xml).toContain('<?xml version="1.0"');
    expect(xml).toContain("<channel>");
    expect(xml).toContain("車車遊樂園");
    expect(xml).toContain("<enclosure");
    expect(xml).toContain('length="0"');
    expect(xml).toContain("/story/ep-6");
    expect(xml).toContain("audio/mpeg");
  });

  it("含 podcast namespace 與 channel 標籤", () => {
    const xml = buildRssFeed(storiesByNewest());
    expect(xml).toContain('xmlns:podcast="https://podcastindex.org/namespace/1.0"');
    expect(xml).toContain("<itunes:type>episodic</itunes:type>");
    expect(xml).toContain("<itunes:owner>");
    expect(xml).toContain("Bonbon &amp; 馬米");
    expect(xml).toContain(`<itunes:email>${CHANNEL_OWNER_EMAIL}</itunes:email>`);
    expect(xml).toContain(`<podcast:guid>${CHANNEL_PODCAST_GUID}</podcast:guid>`);
    expect(CHANNEL_OWNER_EMAIL).not.toContain("TODO");
    expect(CHANNEL_PODCAST_GUID).not.toContain("TODO");
  });

  it("每集含 itunes:episodeType full", () => {
    const xml = buildRssFeed(storiesByNewest());
    const count = (xml.match(/<itunes:episodeType>full<\/itunes:episodeType>/g) ?? [])
      .length;
    expect(count).toBe(storiesByNewest().length);
  });

  it("有 VTT 的集含 podcast:transcript", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const withVtt = storyFixture({
      slug: "ep-test-vtt",
      ep: 99,
      title: "VTT 測試",
      captions: ["a", "b"],
      captionTimes: [0, 2],
    });
    const xml = buildRssFeed([withVtt]);
    expect(xml).toContain(
      '<podcast:transcript url="https://example.com/story/ep-test-vtt/transcript.vtt" type="text/vtt" language="zh-TW"/>',
    );
    vi.unstubAllEnvs();
  });

  it("有 familyActivity 的集數 description 附「聽完聊一聊」", () => {
    const withActivity = storyFixture({
      slug: "ep-test-activity",
      ep: 97,
      title: "活動測試",
      familyActivity: {
        question: "你看過挖土機嗎？",
        activity: "一起數數看今天遇到幾台車。",
      },
    });
    const xml = buildRssFeed([withActivity]);
    expect(xml).toContain("🏡 聽完聊一聊：你看過挖土機嗎？");
    expect(xml).toContain("延伸小活動：一起數數看今天遇到幾台車。");
    // 不得破壞既有 Podcasting 2.0 標籤
    expect(xml).toContain("<itunes:episodeType>full</itunes:episodeType>");
  });

  it("無 familyActivity 的集數 description 無「聽完聊一聊」痕跡", () => {
    const without = storyFixture({
      slug: "ep-test-no-activity",
      ep: 96,
      title: "無活動測試",
      familyActivity: undefined,
    });
    const xml = buildRssFeed([without]);
    expect(xml).not.toContain("聽完聊一聊");
  });

  it("有 zoneId 的集數 description 附樂園地圖深連結", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const withZone = storyFixture({
      slug: "ep-test-zone",
      ep: 95,
      title: "地圖測試",
      zoneId: "car-park",
    });
    const xml = buildRssFeed([withZone]);
    expect(xml).toContain(
      "📍 在樂園地圖上看：https://example.com/adventures?zone=car-park",
    );
    vi.unstubAllEnvs();
  });

  it("無 zoneId 的集數 description 無地圖深連結", () => {
    const without = storyFixture({
      slug: "ep-test-no-zone",
      ep: 94,
      title: "無地圖測試",
      zoneId: undefined,
    });
    const xml = buildRssFeed([without]);
    expect(xml).not.toContain("/adventures?zone=");
  });

  it("captions 與 captionTimes 不一致時不輸出 transcript", () => {
    const mismatch = storyFixture({
      slug: "ep-test-mismatch",
      ep: 98,
      title: "不一致",
      captions: ["a", "b"],
      captionTimes: [0],
    });
    const xml = buildRssFeed([mismatch]);
    expect(xml).not.toContain("podcast:transcript");
  });
});
