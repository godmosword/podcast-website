import { describe, expect, it } from "vitest";
import { applyTagInference, inferThemeTags } from "./apple-sync-profile";
import { parseItunesKeywords } from "./apple-rss";

describe("parseItunesKeywords", () => {
  it("解析逗號分隔關鍵字", () => {
    expect(parseItunesKeywords("親子共讀,睡前故事,情緒教育")).toEqual([
      "親子共讀",
      "睡前故事",
      "情緒教育",
    ]);
  });
});

describe("inferThemeTags", () => {
  it("EP8：RSS 情緒教育 + 摘要勇敢／感受", () => {
    const tags = inferThemeTags(
      "怪獸卡車輕輕開｜學會顧及別人的感受",
      "大聲又勇敢的怪獸卡車，顧及螢火蟲的感受，情緒教育。",
      ["親子共讀", "睡前故事", "情緒教育"],
    );
    expect(tags).toContain("情緒");
    expect(tags).toContain("勇氣");
    expect(tags.length).toBeLessThanOrEqual(3);
  });

  it("EP9：刷牙關鍵字 + 想辦法", () => {
    const tags = inferThemeTags(
      "恐龍車多多的大黃牙｜睡前刷牙任務",
      "我們一起想辦法來幫多多完成睡前刷牙任務吧！",
      ["兒童故事", "兒童刷牙", "蛀牙故事"],
    );
    expect(tags).toContain("好習慣");
    expect(tags).toContain("解決問題");
  });

  it("EP7：冷靜與解決問題", () => {
    const tags = inferThemeTags(
      "小橘高鐵晚到了｜遇到改變也不慌張",
      "Bonbon和馬米學會先冷靜、想辦法解決，換條路也能順利抵達。",
      ["睡前故事", "高鐵故事"],
    );
    expect(tags).toEqual(["冷靜", "解決問題", "成長"]);
  });
});

describe("applyTagInference", () => {
  it("已有 tags 不覆寫", () => {
    const story = {
      slug: "ep-7",
      ep: 7,
      title: "test",
      date: "2026-06-03",
      vehicle: "高鐵",
      emoji: "🚄",
      color: "#7048e8",
      audio: "audio.mp3",
      pageCount: 1,
      tags: ["冷靜", "解決問題", "成長"],
    };
    const next = applyTagInference(story, story.title, "冷靜", [], false);
    expect(next.tags).toEqual(["冷靜", "解決問題", "成長"]);
  });

  it("空 tags 時自動補上", () => {
    const story = {
      slug: "ep-8",
      ep: 8,
      title: "怪獸卡車輕輕開｜學會顧及別人的感受",
      date: "2026-06-05",
      vehicle: "其他",
      emoji: "🚗",
      color: "#7048e8",
      audio: "audio.mp3",
      pageCount: 1,
      tags: [],
    };
    const next = applyTagInference(
      story,
      story.title,
      "大聲又勇敢的怪獸卡車，顧及螢火蟲的感受。",
      ["情緒教育"],
      false,
    );
    expect(next.tags?.length).toBeGreaterThan(0);
  });
});
