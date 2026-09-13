import { describe, expect, it } from "vitest";
import { splitStoryTitle, storyDisplayTitle, storySubtitle } from "./story-title";

describe("splitStoryTitle", () => {
  it("以全形直線切段並去空白", () => {
    expect(
      splitStoryTitle("大黃卡車的運送任務｜六根大木頭怎麼搬？｜工程車生活探索故事"),
    ).toEqual({
      head: "大黃卡車的運送任務",
      rest: ["六根大木頭怎麼搬？", "工程車生活探索故事"],
    });
  });

  it("容忍半形直線與多餘空白", () => {
    expect(splitStoryTitle(" 高鐵小橘晚到了 | 遇到改變也不慌張 ")).toEqual({
      head: "高鐵小橘晚到了",
      rest: ["遇到改變也不慌張"],
    });
  });

  it("沒有分隔符時整串就是主標", () => {
    expect(splitStoryTitle("東東挖土機的勇氣任務")).toEqual({
      head: "東東挖土機的勇氣任務",
      rest: [],
    });
  });

  it("連續分隔符不會產生空段", () => {
    expect(splitStoryTitle("甲｜｜乙")).toEqual({ head: "甲", rest: ["乙"] });
  });

  it("整串都是分隔符時退回原字串，不回空標題", () => {
    expect(splitStoryTitle("｜｜")).toEqual({ head: "｜｜", rest: [] });
  });
});

describe("storyDisplayTitle", () => {
  it("預設取第一段", () => {
    expect(
      storyDisplayTitle({ title: "小紅賽車進雪山隧道的闖關任務｜生活探索故事" }),
    ).toBe("小紅賽車進雪山隧道的闖關任務");
  });

  it("displayTitle 覆寫第一段", () => {
    expect(
      storyDisplayTitle({
        title: "小紅豆汽車故事｜畫得很醜也沒關係｜成長故事",
        displayTitle: "畫得很醜也沒關係",
      }),
    ).toBe("畫得很醜也沒關係");
  });

  it("displayTitle 是空白時視同沒給", () => {
    expect(storyDisplayTitle({ title: "甲｜乙", displayTitle: "   " })).toBe("甲");
  });
});

describe("storySubtitle", () => {
  it("其餘段落以「·」相連", () => {
    expect(
      storySubtitle({ title: "大黃卡車的運送任務｜六根大木頭怎麼搬？｜工程車生活探索故事" }),
    ).toBe("六根大木頭怎麼搬？ · 工程車生活探索故事");
  });

  it("沒有其餘段落時回 null", () => {
    expect(storySubtitle({ title: "東東挖土機的勇氣任務" })).toBeNull();
  });

  it("有 displayTitle 覆寫時仍切完整標題，不吞掉後面段落", () => {
    expect(
      storySubtitle({
        title: "小紅豆汽車故事｜畫得很醜也沒關係｜成長故事",
        displayTitle: "畫得很醜也沒關係",
      }),
    ).toBe("畫得很醜也沒關係 · 成長故事");
  });
});
