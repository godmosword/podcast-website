import { describe, expect, it, vi } from "vitest";
import { getStories } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import { universe } from "@/data/universe";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import { podcastEpisodeJsonLd } from "@/lib/json-ld";
import { storyDetailMetadata } from "@/lib/story-metadata";
import sitemap from "./sitemap";

describe("sitemap freshness", () => {
  it("包含新增 GEO 頁與所有單集頁", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");
    const urls = sitemap().map((entry) => entry.url);

    expect(urls).toContain("https://example.com/for-parents");
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
});
