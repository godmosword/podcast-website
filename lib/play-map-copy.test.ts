import { describe, expect, it } from "vitest";
import { playMapResultTitle } from "./play-map-copy";

describe("playMapResultTitle", () => {
  it("依範圍組出單一摘要，不重複說明", () => {
    expect(
      playMapResultTitle({
        count: 96,
        city: null,
        nearbyActive: false,
        viewportSearchActive: false,
      }),
    ).toBe("全台・96 個適合的地方");
    expect(
      playMapResultTitle({
        count: 9,
        city: "桃園市",
        nearbyActive: false,
        viewportSearchActive: false,
      }),
    ).toBe("桃園市・9 個適合的地方");
    expect(
      playMapResultTitle({
        count: 4,
        city: null,
        nearbyActive: true,
        viewportSearchActive: false,
      }),
    ).toBe("附近・4 個適合的地方");
    expect(
      playMapResultTitle({
        count: 3,
        city: "台北市",
        nearbyActive: false,
        viewportSearchActive: true,
      }),
    ).toBe("這個區域・3 個適合的地方");
  });
});
