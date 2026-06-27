import { describe, expect, test } from "vitest";
import { isStoryPlayRoute } from "./is-story-play-route";

describe("isStoryPlayRoute", () => {
  test("matches story play routes", () => {
    expect(isStoryPlayRoute("/story/ep-14/play")).toBe(true);
    expect(isStoryPlayRoute("/story/ep-14/play/")).toBe(true);
  });

  test("rejects non-play routes", () => {
    expect(isStoryPlayRoute("/story/ep-14")).toBe(false);
    expect(isStoryPlayRoute("/stories")).toBe(false);
    expect(isStoryPlayRoute(null)).toBe(false);
  });
});
