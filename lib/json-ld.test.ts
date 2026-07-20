import { describe, expect, it, vi } from "vitest";
import { getCharacters } from "@/data/characters";
import { storiesByNewest } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import { hasFullTranscript, hasSceneCaptions } from "@/lib/transcript";
import {
  breadcrumbListJsonLd,
  characterCreativeWorkJsonLd,
  faqPageJsonLd,
  podcastEpisodeJsonLd,
  podcastSeriesJsonLd,
  siteIdentityJsonLd,
} from "./json-ld";

/** 取出 associatedMedia 中的音檔 MediaObject（單一或陣列皆可） */
function audioMedia(associatedMedia: unknown): unknown {
  return Array.isArray(associatedMedia)
    ? associatedMedia.find(
        (m) => (m as Record<string, unknown>).encodingFormat === "audio/mpeg",
      )
    : associatedMedia;
}

describe("siteIdentityJsonLd", () => {
  it("產出 Organization 與 WebSite 全站身分資料", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = siteIdentityJsonLd();

    expect(data["@context"]).toBe("https://schema.org");
    expect(data["@graph"]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          "@type": "Organization",
          "@id": "https://example.com/#organization",
          name: "車車遊樂園",
          url: "https://example.com",
        }),
        expect.objectContaining({
          "@type": "WebSite",
          "@id": "https://example.com/#website",
          name: "車車遊樂園",
          inLanguage: "zh-Hant",
          publisher: { "@id": "https://example.com/#organization" },
        }),
      ]),
    );

    const organization = (data["@graph"] as Record<string, unknown>[]).find(
      (node) => node["@type"] === "Organization",
    );
    expect(organization).not.toHaveProperty("sameAs");

    vi.unstubAllEnvs();
  });
});

describe("podcastSeriesJsonLd", () => {
  it("產出 PodcastSeries 結構化資料", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = podcastSeriesJsonLd();

    expect(data["@type"]).toBe("PodcastSeries");
    expect(data.name).toBe("車車遊樂園");
    expect(data.url).toBe("https://example.com");
    expect(data.webFeed).toBe("https://example.com/feed.xml");
    expect(data.image).toBe("https://example.com/mascot.png");
    expect(data.inLanguage).toBe("zh-Hant");
    expect(data.genre).toBe("兒童");

    vi.unstubAllEnvs();
  });

  it("sameAs 為非空的絕對節目頁 URL 陣列", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = podcastSeriesJsonLd();

    expect(Array.isArray(data.sameAs)).toBe(true);
    const sameAs = data.sameAs as string[];
    expect(sameAs.length).toBeGreaterThan(0);
    for (const url of sameAs) {
      expect(url).toMatch(/^https?:\/\//);
    }

    vi.unstubAllEnvs();
  });
});

describe("podcastEpisodeJsonLd", () => {
  it("產出 PodcastEpisode 結構化資料", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = storiesByNewest()[0];
    const data = podcastEpisodeJsonLd(story);

    expect(data["@type"]).toBe("PodcastEpisode");
    expect(data.name).toBe(story.title);
    expect(data.url).toBe(`https://example.com/story/${story.slug}`);
    expect(data.episodeNumber).toBe(story.ep);
    expect(data.dateModified).toBe(storyDateModified(story));
    expect(data.inLanguage).toBe("zh-Hant");
    expect(audioMedia(data.associatedMedia)).toMatchObject({
      "@type": "MediaObject",
      encodingFormat: "audio/mpeg",
    });
    expect(data.partOfSeries).toMatchObject({
      "@type": "PodcastSeries",
      name: "車車遊樂園",
    });
    expect(data).not.toHaveProperty("transcript");

    vi.unstubAllEnvs();
  });

  it("有完整逐字稿時 associatedMedia 追加 transcript MediaObject", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = {
      ...storiesByNewest()[0],
      slug: "ep-1",
      captions: ["場景短句一", "場景短句二"],
      captionTimes: [0, 2],
    };
    expect(hasFullTranscript(story)).toBe(true);
    expect(hasSceneCaptions(story)).toBe(true);
    const data = podcastEpisodeJsonLd(story);

    expect(Array.isArray(data.associatedMedia)).toBe(true);
    expect(data.associatedMedia).toContainEqual({
      "@type": "MediaObject",
      name: "完整逐字稿",
      contentUrl: "https://example.com/story/ep-1/transcript.vtt",
      encodingFormat: "text/vtt",
      inLanguage: "zh-TW",
    });

    vi.unstubAllEnvs();
  });

  it("僅場景字幕、無 subtitles 側車時不含逐字稿 MediaObject", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = {
      ...storiesByNewest()[0],
      slug: "ep-scene-only-fixture",
      captions: ["場景一", "場景二"],
      captionTimes: [0, 2],
    };
    expect(hasFullTranscript(story)).toBe(false);
    expect(hasSceneCaptions(story)).toBe(true);
    const data = podcastEpisodeJsonLd(story);

    expect(Array.isArray(data.associatedMedia)).toBe(false);
    expect(data.associatedMedia).toMatchObject({
      "@type": "MediaObject",
      encodingFormat: "audio/mpeg",
    });

    vi.unstubAllEnvs();
  });

  it("無字幕也無逐字稿側車時 associatedMedia 只有音檔", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = {
      ...storiesByNewest()[0],
      slug: "ep-scene-only-fixture",
      captions: undefined,
      captionTimes: undefined,
    };
    expect(hasFullTranscript(story)).toBe(false);
    const data = podcastEpisodeJsonLd(story);

    expect(Array.isArray(data.associatedMedia)).toBe(false);
    expect(data.associatedMedia).toMatchObject({
      "@type": "MediaObject",
      encodingFormat: "audio/mpeg",
    });

    vi.unstubAllEnvs();
  });

  it("duration 可解析時加 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "12:34" };
    const data = podcastEpisodeJsonLd(story);
    expect(data.timeRequired).toBe("PT12M34S");
    expect(data.duration).toBe("PT12M34S");
    expect(data).not.toHaveProperty("transcript");
    vi.unstubAllEnvs();
  });

  it("duration H:MM:SS 轉 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "1:02:03" };
    const data = podcastEpisodeJsonLd(story);
    expect(data.timeRequired).toBe("PT1H2M3S");
    vi.unstubAllEnvs();
  });

  it("MM:SS 分鐘超過 59 時正規化為時/分/秒", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "90:00" };
    const data = podcastEpisodeJsonLd(story);
    expect(data.timeRequired).toBe("PT1H30M");
    vi.unstubAllEnvs();
  });

  it("無效 duration 略過 timeRequired", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const story = { ...storiesByNewest()[0], duration: "bad" };
    const data = podcastEpisodeJsonLd(story);
    expect(data).not.toHaveProperty("timeRequired");
    vi.unstubAllEnvs();
  });
});

describe("faqPageJsonLd", () => {
  it("由問答資料產生 FAQPage", () => {
    const data = faqPageJsonLd([
      { question: "適合幾歲？", answer: "適合 3–7 歲親子共聽。" },
      { question: "可以引用嗎？", answer: "可以引用短句並附上原始連結。" },
    ]);

    expect(data["@type"]).toBe("FAQPage");
    expect(data.mainEntity).toEqual([
      {
        "@type": "Question",
        name: "適合幾歲？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "適合 3–7 歲親子共聽。",
        },
      },
      {
        "@type": "Question",
        name: "可以引用嗎？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "可以引用短句並附上原始連結。",
        },
      },
    ]);
  });
});

describe("breadcrumbListJsonLd", () => {
  it("position 從 1 連續，item 為絕對 URL", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const data = breadcrumbListJsonLd([
      { name: "車車遊樂園", url: "/" },
      { name: "全部故事", url: "/stories" },
      { name: "EP 1 測試故事", url: "/story/ep-1" },
    ]);

    expect(data["@type"]).toBe("BreadcrumbList");
    const items = data.itemListElement as Record<string, unknown>[];
    expect(items).toHaveLength(3);
    items.forEach((item, index) => {
      expect(item.position).toBe(index + 1);
      expect(item.item as string).toMatch(/^https:\/\/example\.com\//);
    });
    expect(items[0].item).toBe("https://example.com/");
    expect(items[1].item).toBe("https://example.com/stories");
    expect(items[2].item).toBe("https://example.com/story/ep-1");

    vi.unstubAllEnvs();
  });
});

describe("characterCreativeWorkJsonLd", () => {
  it("用 CreativeWork 標記原創角色，角色本身用 Person", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const characters = getCharacters().slice(0, 2);
    const data = characterCreativeWorkJsonLd(characters);

    expect(data["@type"]).toBe("CreativeWork");
    expect(data.name).toBe("車車遊樂園原創角色");
    expect(data.inLanguage).toBe("zh-Hant");
    expect(data.character).toEqual(
      characters.map((character) =>
        expect.objectContaining({
          "@type": "Person",
          "@id": `https://example.com/characters#${character.id}`,
          name: character.name,
          url: `https://example.com/characters#${character.id}`,
        }),
      ),
    );

    vi.unstubAllEnvs();
  });
});
