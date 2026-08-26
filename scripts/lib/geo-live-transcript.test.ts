import { describe, expect, it } from "vitest";
import { hasFullTranscript } from "@/lib/transcript";
import { storiesByNewest } from "@/data/content";
import {
  associatedMediaHasVtt,
  rssHasPodcastTranscript,
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

describe("rssHasPodcastTranscript", () => {
  const url =
    "https://podcast-website-mu.vercel.app/story/ep-27/transcript.vtt";

  it("命中 podcast:transcript url", () => {
    const xml = `<item><podcast:transcript url="${url}" type="text/vtt"/></item>`;
    expect(rssHasPodcastTranscript(xml, url)).toBe(true);
  });

  it("最新集無宣告時為 false", () => {
    const xml =
      '<item><link>https://podcast-website-mu.vercel.app/story/ep-27</link></item>';
    expect(rssHasPodcastTranscript(xml, url)).toBe(false);
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
