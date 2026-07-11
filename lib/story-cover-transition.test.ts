import { describe, expect, it } from "vitest";
import { storyCoverTransitionName } from "./story-cover-transition";

describe("story-cover-transition", () => {
  it("slug 對應穩定轉場名稱", () => {
    expect(storyCoverTransitionName("ep-6")).toBe("story-cover-ep-6");
    expect(storyCoverTransitionName("ep-1")).toBe("story-cover-ep-1");
  });
});
