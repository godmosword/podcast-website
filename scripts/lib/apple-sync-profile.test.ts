import { describe, expect, it } from "vitest";
import {
  applyTagInference,
  applyVehicleInference,
  inferThemeTags,
  inferVehicle,
} from "./apple-sync-profile";
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

describe("inferVehicle", () => {
  it("EP8：怪獸卡車（標題）", () => {
    expect(
      inferVehicle(
        "怪獸卡車輕輕開｜學會顧及別人的感受",
        "大聲又勇敢的怪獸卡車 Monster Truck，顧及螢火蟲的感受。",
        [],
      ),
    ).toBe("怪獸卡車");
  });

  it("EP9：恐龍車（標題）", () => {
    expect(
      inferVehicle(
        "恐龍車多多的大黃牙｜睡前刷牙任務",
        "愛吃糖的恐龍車多多總是不刷牙。",
        [],
      ),
    ).toBe("恐龍車");
  });

  it("EP12：警車（標題優先，不被摘要玩笑誤判為救護車）", () => {
    expect(
      inferVehicle(
        "警車與巴士合作救援｜幫媽媽寶寶平安到醫院",
        "搞笑事件：救護車、警車他配起來都一樣欸，傻傻分不清楚",
        ["警車故事", "巴士故事"],
      ),
    ).toBe("警車");
  });
});

describe("applyVehicleInference", () => {
  it("仍為「其他」時自動補車種", () => {
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
    };
    const next = applyVehicleInference(
      story,
      story.title,
      "大聲又勇敢的怪獸卡車。",
      [],
      "其他",
      false,
    );
    expect(next.vehicle).toBe("怪獸卡車");
    expect(next.emoji).toBe("🚚");
  });

  it("已有非預設車種不覆寫", () => {
    const story = {
      slug: "ep-7",
      ep: 7,
      title: "小橘高鐵晚到了",
      date: "2026-06-03",
      vehicle: "高鐵",
      emoji: "🚄",
      color: "#7048e8",
      audio: "audio.mp3",
      pageCount: 1,
    };
    const next = applyVehicleInference(
      story,
      story.title,
      story.title,
      [],
      "其他",
      false,
    );
    expect(next.vehicle).toBe("高鐵");
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
