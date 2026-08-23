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

  it("0 筆也給得出完整句子", () => {
    const view = playMapResultSentence({ ...BASE, count: 0, freeOnly: true });
    expect(view.count).toBe(0);
    expect(view.srText).toBe("在全台找免費的地方，共 0 個地方");
  });
});
