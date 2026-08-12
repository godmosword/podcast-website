import { describe, expect, test } from "vitest";
import {
  isGamePlayRoute,
  isImmersiveRoute,
  isStoryPlayRoute,
} from "./is-story-play-route";

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

describe("isGamePlayRoute", () => {
  test("matches single game pages", () => {
    expect(isGamePlayRoute("/games/candy-match")).toBe(true);
    expect(isGamePlayRoute("/games/candy-match/")).toBe(true);
    expect(isGamePlayRoute("/games/block-drop")).toBe(true);
  });

  test("hub 本身保留全站導覽", () => {
    expect(isGamePlayRoute("/games")).toBe(false);
    expect(isGamePlayRoute("/games/")).toBe(false);
  });

  test("著色本走另一套 shell，不納入沉浸模式", () => {
    expect(isGamePlayRoute("/games/coloring-book")).toBe(false);
    expect(isGamePlayRoute("/games/coloring-book/")).toBe(false);
  });

  test("巢狀路徑不誤判", () => {
    expect(isGamePlayRoute("/games/candy-match/level/3")).toBe(false);
    expect(isGamePlayRoute("/games/a/b")).toBe(false);
  });

  test("rejects unrelated routes", () => {
    expect(isGamePlayRoute("/stories")).toBe(false);
    expect(isGamePlayRoute(null)).toBe(false);
  });
});

describe("isImmersiveRoute", () => {
  test("涵蓋故事播放器與單一遊戲頁", () => {
    expect(isImmersiveRoute("/story/ep-14/play")).toBe(true);
    expect(isImmersiveRoute("/games/block-drop")).toBe(true);
  });

  test("不涵蓋瀏覽頁", () => {
    expect(isImmersiveRoute("/games")).toBe(false);
    expect(isImmersiveRoute("/stories")).toBe(false);
    expect(isImmersiveRoute("/")).toBe(false);
  });
});
