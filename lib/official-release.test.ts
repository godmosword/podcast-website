import { afterEach, describe, expect, it, vi } from "vitest";
import { getCatalogStories, getStories } from "@/data/content";
import { CHANNEL_PODCAST_GUID } from "@/lib/feed-constants";
import {
  filterReleased,
  frozenEpisodeGuid,
  officialReleaseManifest,
} from "./official-release";

describe("official release manifest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("清單是已核准的子集，同步進來的新集要另外核准才上官網", () => {
    const manifest = officialReleaseManifest();
    const catalog = getCatalogStories().map((story) => story.slug);
    expect(manifest.humanApproved).toBe(true);
    expect(manifest.qualityCheck.status).toBe("not-run");
    expect(manifest.stories.every((slug) => catalog.includes(slug))).toBe(true);
    expect(getStories().map((story) => story.slug).sort()).toEqual([...catalog].sort());

    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    expect(getStories().map((story) => story.slug).sort()).toEqual(
      [...manifest.stories].sort(),
    );
  });

  it("官網濾掉清單外的 slug，current 不過濾", () => {
    const items = [{ slug: "ep-1" }, { slug: "ep-does-not-exist" }];
    expect(filterReleased(items, "stories")).toHaveLength(2);
    vi.stubEnv("NEXT_PUBLIC_SITE_EDITION", "official");
    expect(filterReleased(items, "stories").map((item) => item.slug)).toEqual(["ep-1"]);
  });

  it("單集 GUID 凍結在官網網址，不跟執行網址走", () => {
    expect(frozenEpisodeGuid("ep-4")).toBe("https://carcarplayground.com/story/ep-4");
    expect(frozenEpisodeGuid("racecar")).toBe("https://carcarplayground.com/story/ep-3");
  });

  it("頻道 GUID 維持既有 UUID", () => {
    expect(CHANNEL_PODCAST_GUID).toBe("2ee84390-ddf1-5c7a-9009-6e959b528a81");
  });
});
