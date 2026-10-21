import { describe, expect, it } from "vitest";
import {
  playMapResultSentence,
  type PlayMapResultSentenceArgs,
} from "./play-map-copy";

const BASE: PlayMapResultSentenceArgs = {
  count: 0,
  city: null,
  nearbyActive: false,
  viewportSearchActive: false,
  freeOnly: false,
  indoorOnly: false,
  outdoorOnly: false,
  rainyDayOnly: false,
  parkingOnly: false,
  strollerFriendlyOnly: false,
  highEnergyOnly: false,
  type: null,
};

describe("playMapResultSentence", () => {
  it("四種範圍各有專屬說法，優先序為區域→附近→縣市→全台", () => {
    expect(playMapResultSentence({ ...BASE, count: 96 }).scopeLabel).toBe("全台");
    expect(
      playMapResultSentence({ ...BASE, city: "桃園市" }).scopeLabel,
    ).toBe("桃園市");
    expect(
      playMapResultSentence({ ...BASE, city: "桃園市", nearbyActive: true }).scopeLabel,
    ).toBe("你附近");
    expect(
      playMapResultSentence({
        ...BASE,
        city: "桃園市",
        nearbyActive: true,
        viewportSearchActive: true,
      }).scopeLabel,
    ).toBe("這個區域");
  });

  it("條件標籤順序固定，同一組條件永遠讀成同一句", () => {
    const view = playMapResultSentence({
      ...BASE,
      strollerFriendlyOnly: true,
      freeOnly: true,
      indoorOnly: true,
      rainyDayOnly: true,
      type: "博物館",
    });
    expect(view.facetLabels).toEqual([
      "免費",
      "雨天",
      "室內",
      "推車 OK",
      "博物館",
    ]);
  });

  it("結果數獨立成欄位，供結果列單獨放大", () => {
    const view = playMapResultSentence({ ...BASE, count: 12 });
    expect(view.count).toBe(12);
    expect(view.countLabel).toBe("12 個地方");
  });

  it("沒有條件時不留下空的「找」字", () => {
    expect(playMapResultSentence({ ...BASE, count: 99 }).srText).toBe(
      "在全台找地方，共 99 個地方",
    );
  });

  it("讀屏把拆散的視覺片段讀成一句完整的話", () => {
    expect(
      playMapResultSentence({
        ...BASE,
        count: 3,
        city: "台北市",
        freeOnly: true,
        indoorOnly: true,
      }).srText,
    ).toBe("在台北市找免費、室內的地方，共 3 個地方");
  });

  it("單一情境：主句是「範圍＋情境 · N 處」，條件行不重複情境自己的欄位", () => {
    const view = playMapResultSentence({
      ...BASE,
      count: 3,
      city: "台北市",
      rainyDayOnly: true,
      parkingOnly: true,
      scenarioLabel: "下雨也能玩",
    });
    expect(view.mainText).toBe("台北市下雨也能玩 · 3 處");
    expect(view.moreFacetLabels).toEqual(["好停車"]);
    expect(view.srText).toBe("在台北市找雨天、好停車的地方，共 3 處");
  });

  it("沒有情境：主句是「範圍 · N 個地方」", () => {
    const view = playMapResultSentence({ ...BASE, count: 99 });
    expect(view.mainText).toBe("全台 · 99 個地方");
    expect(view.scenarioLabel).toBeNull();
  });

  it("條件行不列博物館（看展覽情境或多情境 chip 已表達），其他類型照列", () => {
    expect(playMapResultSentence({ ...BASE, type: "博物館" }).moreFacetLabels).toEqual([]);
    expect(playMapResultSentence({ ...BASE, type: "農場" }).moreFacetLabels).toEqual(["農場"]);
    // 多情境（舊網址）：情境欄位改由 chip 顯示，條件行只剩更多條件。
    expect(
      playMapResultSentence({ ...BASE, freeOnly: true, rainyDayOnly: true, indoorOnly: true })
        .moreFacetLabels,
    ).toEqual(["室內"]);
  });

  it("0 筆也給得出完整句子", () => {
    const view = playMapResultSentence({ ...BASE, count: 0, freeOnly: true });
    expect(view.count).toBe(0);
    expect(view.srText).toBe("在全台找免費的地方，共 0 個地方");
  });
});
