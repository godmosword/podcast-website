import { describe, expect, it, vi } from "vitest";
import { getStories } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import { listPlaygrounds } from "@/data/playgrounds";
import { universe } from "@/data/universe";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import { podcastEpisodeJsonLd } from "@/lib/json-ld";
import {
  collectionPath,
  listCollectionDefinitions,
} from "@/lib/playground-collections";
import { storyDetailMetadata } from "@/lib/story-metadata";
import { playgroundDetailPath } from "@/lib/playground-detail";
import sitemap from "./sitemap";

describe("sitemap freshness", () => {
  it("包含新增 GEO 頁與所有單集頁", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://example.com/for-parents");
    expect(urls).toContain("https://example.com/for-parents/play-map");
    expect(urls).toContain("https://example.com/subscribe");
    expect(urls).toContain("https://example.com/characters");
    for (const story of getStories()) {
      expect(urls).toContain(`https://example.com/story/${story.slug}`);
    }

    vi.unstubAllEnvs();
  });

  it("開放島在 sitemap 內、非開放島不在（status 改 open 即自動跟上）", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(universe.zones.some((z) => z.status === "open")).toBe(true);
    expect(universe.zones.some((z) => z.status !== "open")).toBe(true);

    for (const zone of universe.zones) {
      const url = `https://example.com/adventures/${zone.id}`;
      if (zone.status === "open") {
        expect(urls).toContain(url);
        const entry = entries.find((item) => item.url === url);
        expect(entry?.lastModified).toBe(STATIC_PAGE_MODIFIED_DATES["/adventures"]);
        expect(entry?.changeFrequency).toBe("monthly");
        expect(entry?.priority).toBe(0.65);
      } else {
        expect(urls).not.toContain(url);
      }
    }

    vi.unstubAllEnvs();
  });

  it("單集 sitemap lastModified、metadata、JSON-LD dateModified 一致", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const entries = sitemap();

    for (const story of getStories()) {
      const modified = storyDateModified(story);
      const entry = entries.find(
        (item) => item.url === `https://example.com/story/${story.slug}`,
      );
      const metadata = storyDetailMetadata(story);
      const jsonLd = podcastEpisodeJsonLd(story);

      expect(entry?.lastModified, story.slug).toBe(modified);
      expect(metadata.other?.dateModified, story.slug).toBe(modified);
      expect(jsonLd.dateModified, story.slug).toBe(modified);
    }

    vi.unstubAllEnvs();
  });

  it("包含所有景點 detail canonical，且不宣稱內容修改時間", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const entries = sitemap();
    const playgrounds = listPlaygrounds();
    const detailEntries = entries.filter((entry) =>
      playgrounds.some(
        (place) =>
          entry.url ===
          `https://example.com${playgroundDetailPath(place.id)}`,
      ),
    );

    expect(detailEntries).toHaveLength(playgrounds.length);
    expect(new Set(detailEntries.map((entry) => entry.url)).size).toBe(
      playgrounds.length,
    );
    for (const place of playgrounds) {
      const entry = entries.find(
        (item) => item.url === `https://example.com${playgroundDetailPath(place.id)}`,
      );
      expect(entry, place.id).toBeDefined();
      expect(entry, place.id).not.toHaveProperty("lastModified");
      expect(entry, place.id).not.toHaveProperty("changeFrequency");
    }

    const closed = playgrounds.find((place) => place.status === "temporarily-closed");
    expect(
      entries.some(
        (entry) =>
          entry.url ===
          `https://example.com${playgroundDetailPath(closed!.id)}`,
      ),
    ).toBe(true);

    vi.unstubAllEnvs();
  });

  it("只包含 collection index 與 20 筆 launch collection URLs", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const entries = sitemap();
    const collectionDefinitions = listCollectionDefinitions();
    const collectionUrls = entries
      .filter((entry) =>
        entry.url.startsWith(
          "https://example.com/for-parents/play-map/collections",
        ),
      )
      .map((entry) => entry.url);

    expect(collectionDefinitions).toHaveLength(20);
    expect(collectionUrls).toHaveLength(21);
    expect(collectionUrls).toContain(
      "https://example.com/for-parents/play-map/collections",
    );
    expect(new Set(collectionUrls).size).toBe(21);

    for (const definition of collectionDefinitions) {
      const entry = entries.find(
        (item) =>
          item.url ===
          `https://example.com${collectionPath(definition.slug)}`,
      );
      expect(entry, definition.slug).toBeDefined();
      expect(entry, definition.slug).not.toHaveProperty("lastModified");
      expect(entry, definition.slug).not.toHaveProperty("changeFrequency");
    }

    expect(
      collectionUrls.some((url) => url.includes("rainy-day")),
    ).toBe(false);
    expect(
      collectionUrls.some((url) => url.includes("?")),
    ).toBe(false);
    expect(collectionUrls).not.toContain(
      "https://example.com/for-parents/play-map/collections/changhua-free",
    );
    expect(collectionUrls).not.toContain(
      "https://example.com/for-parents/play-map/collections/chiayi-county-indoor",
    );
    expect(collectionUrls).not.toContain(
      "https://example.com/for-parents/play-map/collections/chiayi-city-indoor",
    );
    expect(collectionUrls).toContain(
      "https://example.com/for-parents/play-map/collections/chiayi-city",
    );
    expect(collectionUrls).toContain(
      "https://example.com/for-parents/play-map/collections/chiayi-county",
    );

    vi.unstubAllEnvs();
  });
});
