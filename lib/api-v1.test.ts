import { describe, expect, it } from "vitest";
import { getStory, storiesByNewest } from "@/data/content";
import {
  apiV1Json,
  apiV1NotFound,
  apiV1StoryCount,
  getChannelMetaApi,
  getStoryApi,
  listStoriesApi,
  pageImageFileName,
  toAbsoluteUrl,
  toStoryDetail,
  toStoryListItem,
} from "@/lib/api-v1";
import { CHANNEL_TITLE } from "@/lib/feed-constants";
import { hasTranscriptVtt } from "@/lib/transcript";
import { visiblePlatforms } from "@/lib/platforms";

const SITE = "https://example.test";

describe("toAbsoluteUrl", () => {
  it("相對路徑加 origin", () => {
    expect(toAbsoluteUrl("/stories/ep-1/01.jpg", SITE)).toBe(
      `${SITE}/stories/ep-1/01.jpg`,
    );
  });

  it("已是絕對 URL 則不變", () => {
    expect(toAbsoluteUrl("https://cdn.test/a.mp3", SITE)).toBe(
      "https://cdn.test/a.mp3",
    );
  });
});

describe("listStoriesApi / toStoryListItem", () => {
  it("長度與目錄一致，且最新在前", () => {
    const list = listStoriesApi(SITE);
    expect(list.length).toBe(apiV1StoryCount());
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].ep).toBeGreaterThanOrEqual(list[list.length - 1].ep);
  });

  it("列表項含絕對 cover／audio，且不含家長欄位", () => {
    const story = storiesByNewest()[0];
    const item = toStoryListItem(story, SITE);
    expect(item.coverUrl).toBe(`${SITE}/stories/${story.slug}/01.jpg`);
    expect(item.audioUrl).toMatch(/^https?:\/\//);
    expect(item.audioUrl).toContain(`/stories/${story.slug}/`);
    expect(item.hasTranscriptVtt).toBe(hasTranscriptVtt(story));
    expect(item).not.toHaveProperty("familyActivity");
    expect(item).not.toHaveProperty("parentGuide");
    expect(item).not.toHaveProperty("episodeFaq");
    expect(item).not.toHaveProperty("captions");
    expect(item).not.toHaveProperty("pageImageUrls");
  });
});

describe("toStoryDetail / getStoryApi", () => {
  it("pageImageUrls 長度等於 pageCount", () => {
    const story = storiesByNewest().find((s) => s.pageCount > 1) ?? storiesByNewest()[0];
    const detail = toStoryDetail(story, SITE);
    expect(detail.pageImageUrls).toHaveLength(story.pageCount);
    expect(detail.pageImageUrls[0]).toBe(
      `${SITE}/stories/${story.slug}/${pageImageFileName(1)}`,
    );
    expect(detail.pageImageUrls[detail.pageImageUrls.length - 1]).toBe(
      `${SITE}/stories/${story.slug}/${pageImageFileName(story.pageCount)}`,
    );
  });

  it("有完整逐字稿時附 transcriptVttUrl", () => {
    const withVtt = storiesByNewest().find(hasTranscriptVtt);
    expect(withVtt).toBeDefined();
    const detail = toStoryDetail(withVtt!, SITE);
    expect(detail.transcriptVttUrl).toBe(
      `${SITE}/story/${withVtt!.slug}/transcript.vtt`,
    );
    expect(detail.hasTranscriptVtt).toBe(true);
  });

  it("未知 slug 回 null", () => {
    expect(getStoryApi("no-such-episode-xyz", SITE)).toBeNull();
  });

  it("已知 slug 可解析（含別名則依 getStory）", () => {
    const story = getStory(storiesByNewest()[0].slug);
    expect(story).toBeDefined();
    const detail = getStoryApi(story!.slug, SITE);
    expect(detail?.slug).toBe(story!.slug);
    expect(detail?.title).toBe(story!.title);
  });

  it("詳情不含 familyActivity／parentGuide／episodeFaq", () => {
    const detail = getStoryApi(storiesByNewest()[0].slug, SITE);
    expect(detail).toBeDefined();
    expect(detail).not.toHaveProperty("familyActivity");
    expect(detail).not.toHaveProperty("parentGuide");
    expect(detail).not.toHaveProperty("episodeFaq");
  });
});

describe("getChannelMetaApi", () => {
  it("對齊頻道常數與可見平台", () => {
    const meta = getChannelMetaApi(SITE);
    expect(meta.title).toBe(CHANNEL_TITLE);
    expect(meta.siteUrl).toBe(SITE);
    expect(meta.feedUrl).toBe(`${SITE}/feed.xml`);
    expect(meta.artworkUrl).toBe(`${SITE}/mascot.png`);
    expect(meta.platforms.length).toBe(visiblePlatforms().length);
    expect(meta.platforms.every((p) => p.label && p.url)).toBe(true);
  });
});

describe("apiV1NotFound", () => {
  it("回 404 與 error=not_found", async () => {
    const res = apiV1NotFound();
    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "not_found" });
  });

  it("404 不進公開快取（新集上線前不該被 CDN 鎖住）", () => {
    expect(apiV1NotFound().headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("apiV1Json", () => {
  it("200 預設長快取", () => {
    expect(apiV1Json({ ok: true }).headers.get("Cache-Control")).toBe(
      "public, max-age=3600, s-maxage=3600",
    );
  });
});
