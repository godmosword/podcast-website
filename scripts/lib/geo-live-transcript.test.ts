import { describe, expect, it } from "vitest";
import { hasFullTranscript } from "@/lib/transcript";
import { storiesByNewest } from "@/data/content";
import {
  associatedMediaHasVtt,
  firstRssItemXml,
  isDirectHttp404,
  rssHasPodcastTranscript,
  rssItemDeclaresPodcastTranscript,
  transcriptLiveMode,
} from "./geo-live-transcript";

describe("transcriptLiveMode", () => {
  it("有側車 → require，無側車 → forbid", () => {
    expect(transcriptLiveMode(true)).toBe("require");
    expect(transcriptLiveMode(false)).toBe("forbid");
  });

  it("對齊目前最新集 hasFullTranscript（MVP 無字幕則 forbid）", () => {
    const latest = storiesByNewest()[0];
    expect(latest).toBeDefined();
    expect(transcriptLiveMode(hasFullTranscript(latest!))).toBe(
      hasFullTranscript(latest!) ? "require" : "forbid",
    );
  });
});

describe("firstRssItemXml / rssItemDeclaresPodcastTranscript", () => {
  const latestUrl =
    "https://example.com/story/ep-27/transcript.vtt";
  const olderUrl =
    "https://example.com/story/ep-26/transcript.vtt";
  const feed = `<?xml version="1.0"?>
<rss><channel>
<item><title>最新</title><link>https://example.com/story/ep-27</link></item>
<item><title>舊集</title><podcast:transcript url="${olderUrl}" type="text/vtt"/></item>
</channel></rss>`;

  it("只取第一個 item", () => {
    const item = firstRssItemXml(feed);
    expect(item).toContain("ep-27");
    expect(item).not.toContain("ep-26");
  });

  it("forbid：舊集有 transcript、最新集沒有 → 最新 item 未宣告", () => {
    const item = firstRssItemXml(feed)!;
    expect(rssItemDeclaresPodcastTranscript(item)).toBe(false);
    expect(rssHasPodcastTranscript(item, latestUrl)).toBe(false);
  });

  it("forbid：最新 item 用錯誤 URL 宣告 transcript → 仍算有宣告", () => {
    const xml = `<item><podcast:transcript url="${olderUrl}" type="text/vtt" language="zh-TW"/></item>`;
    expect(rssItemDeclaresPodcastTranscript(xml)).toBe(true);
    expect(rssHasPodcastTranscript(xml, latestUrl)).toBe(false);
  });

  it("require：最新 item 含正確 URL", () => {
    const xml = `<item><podcast:transcript url="${latestUrl}" type="text/vtt"/></item>`;
    expect(rssHasPodcastTranscript(xml, latestUrl)).toBe(true);
    expect(rssItemDeclaresPodcastTranscript(xml)).toBe(true);
  });

  it("沒有 item 回 null", () => {
    expect(firstRssItemXml("<rss></rss>")).toBeNull();
  });
});

describe("associatedMediaHasVtt", () => {
  const contentUrl =
    "https://podcast-website-mu.vercel.app/story/ep-27/transcript.vtt";

  it("陣列中的 text/vtt MediaObject", () => {
    expect(
      associatedMediaHasVtt(
        [
          { encodingFormat: "audio/mpeg", contentUrl: "https://x/a.mp3" },
          { encodingFormat: "text/vtt", contentUrl },
        ],
        contentUrl,
      ),
    ).toBe(true);
  });

  it("只有音檔時為 false", () => {
    expect(
      associatedMediaHasVtt({
        encodingFormat: "audio/mpeg",
        contentUrl: "https://x/a.mp3",
      }),
    ).toBe(false);
  });

  it("contentUrl 不符則 false", () => {
    expect(
      associatedMediaHasVtt(
        { encodingFormat: "text/vtt", contentUrl: "https://x/other.vtt" },
        contentUrl,
      ),
    ).toBe(false);
  });
});

describe("isDirectHttp404", () => {
  const requested =
    "https://podcast-website-mu.vercel.app/story/ep-27/transcript.vtt";

  it("同 pathname 的 404 通過", () => {
    expect(isDirectHttp404(requested, requested, 404)).toBe(true);
  });

  it("跟隨 redirect 到泛用 404 頁不通過", () => {
    expect(
      isDirectHttp404(
        requested,
        "https://podcast-website-mu.vercel.app/404",
        404,
      ),
    ).toBe(false);
  });

  it("200 不通過", () => {
    expect(isDirectHttp404(requested, requested, 200)).toBe(false);
  });
});
