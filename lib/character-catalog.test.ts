import { describe, expect, it } from "vitest";
import { getStories } from "@/data/content";
import {
  CATALOG_EPISODE_TITLE_MAX,
  catalogEpisodeLabel,
  catalogEpisodeTitle,
  catalogEpisodesFor,
  sortCatalogCharacters,
} from "./character-catalog";
import { getCharacters } from "@/data/characters";

describe("catalogEpisodeTitle", () => {
  it("每集簡述都不超過 10 個字", () => {
    for (const story of getStories()) {
      const title = catalogEpisodeTitle(story.title, story.slug);
      expect(
        [...title].length,
        `${story.slug}「${title}」`,
      ).toBeLessThanOrEqual(CATALOG_EPISODE_TITLE_MAX);
      expect(title.length).toBeGreaterThan(0);
    }
  });

  it("主標已夠短就直接用", () => {
    expect(catalogEpisodeTitle("守信用的鈴鈴清潔車", "ep-4")).toBe(
      "守信用的鈴鈴清潔車",
    );
    expect(catalogEpisodeTitle("恐龍車多多的大黃牙｜睡前刷牙故事", "ep-9")).toBe(
      "恐龍車多多的大黃牙",
    );
    expect(catalogEpisodeTitle("刷牙故事｜恐龍車多多的大黃牙", "ep-9")).toBe(
      "刷牙故事",
    );
  });

  it("過長主標改用手寫簡述", () => {
    expect(catalogEpisodeTitle("小紅賽車不是第一名也沒關係", "ep-3")).toBe(
      "不是第一名",
    );
    expect(
      catalogEpisodeTitle("小紅賽車進雪山隧道的闖關任務｜生活探索故事", "ep-25"),
    ).toBe("雪山隧道闖關");
  });
});

describe("catalogEpisodesFor", () => {
  it("依集數排序並略過無效 slug", () => {
    const episodes = catalogEpisodesFor(["ep-15", "missing", "ep-4"]);
    expect(episodes.map((episode) => episode.slug)).toEqual(["ep-4", "ep-15"]);
    expect(catalogEpisodeLabel(episodes[0])).toBe("EP 4 守信用的鈴鈴清潔車");
    expect(catalogEpisodeLabel(episodes[1])).toBe("EP 15 恐龍車多多洗手故事");
  });
});

describe("sortCatalogCharacters", () => {
  const entry = (id: string, appearsIn: string[]) => ({ id, appearsIn });

  it("主持人排最前，其他依首次出場集數，同集維持原順序", () => {
    const sorted = sortCatalogCharacters([
      entry("late", ["ep-24"]),
      entry("mami", ["ep-1"]),
      entry("early", ["ep-24", "ep-3"]),
      entry("tie-a", ["ep-7"]),
      entry("bong-bong", ["ep-1"]),
      entry("tie-b", ["ep-7"]),
      entry("no-story", []),
    ]);
    expect(sorted.map((c) => c.id)).toEqual([
      "bong-bong",
      "mami",
      "early",
      "tie-a",
      "tie-b",
      "late",
      "no-story",
    ]);
  });

  it("不改動傳入的陣列", () => {
    const input = [entry("late", ["ep-24"]), entry("early", ["ep-3"])];
    sortCatalogCharacters(input);
    expect(input.map((c) => c.id)).toEqual(["late", "early"]);
  });

  it("真實名冊：Bonbon、馬米開頭，之後首次出場集數不倒退", () => {
    const sorted = sortCatalogCharacters(getCharacters());
    expect(sorted.slice(0, 2).map((c) => c.id)).toEqual(["bong-bong", "mami"]);
    const firstEps = sorted
      .slice(2)
      .map((c) => catalogEpisodesFor(c.appearsIn)[0]?.ep ?? Infinity);
    expect(firstEps).toEqual([...firstEps].sort((a, b) => a - b));
    expect(sorted).toHaveLength(getCharacters().length);
  });
});
