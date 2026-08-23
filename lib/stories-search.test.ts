import { describe, expect, it } from "vitest";
import { parseStoriesSearchParams, storiesSearchQuery } from "./stories-search";

const vehicles = ["救護車", "消防車"] as const;
const tags = ["合作", "勇氣"] as const;

describe("parseStoriesSearchParams", () => {
  it("讀取合法 vehicle／tag／q", () => {
    const params = new URLSearchParams("vehicle=救護車&tag=合作&q=幫忙");
    expect(parseStoriesSearchParams(params, vehicles, tags)).toEqual({
      vehicle: "救護車",
      tag: "合作",
      query: "幫忙",
    });
  });

  it("忽略不在白名單的 filter，避免錯誤 deep link 污染狀態", () => {
    const params = new URLSearchParams("vehicle=飛機&tag=未知&q=%20");
    expect(parseStoriesSearchParams(params, vehicles, tags)).toEqual({
      vehicle: null,
      tag: null,
      query: "",
    });
  });
});

describe("storiesSearchQuery", () => {
  it("只寫入有值的參數", () => {
    expect(storiesSearchQuery("救護車", null, "  ")).toBe(
      new URLSearchParams({ vehicle: "救護車" }).toString(),
    );
    expect(storiesSearchQuery(null, null, "")).toBe("");
  });
});
