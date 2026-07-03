import { describe, expect, it, vi } from "vitest";
import { getCharacters } from "@/data/characters";
import { storiesByNewest } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import {
  characterCreativeWorkJsonLd,
  faqPageJsonLd,
  podcastEpisodeJsonLd,
  podcastSeriesJsonLd,
  siteIdentityJsonLd,
} from "./json-ld";

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
    expect(data.associatedMedia).toMatchObject({
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
