import { describe, expect, it } from "vitest";
import {
  emojiForVehicle,
  reconcileBrowseIndex,
  suggestVehicleEntry,
  verifyBrowseIndex,
} from "./browse-index";
import type { Story } from "../../data/stories";

const baseStory = (overrides: Partial<Story>): Story => ({
  slug: "ep-test",
  ep: 99,
  title: "test",
  date: "2026-06-01",
  vehicle: "其他",
  emoji: "🚗",
  color: "#7048e8",
  audio: "audio.mp3",
  pageCount: 1,
  ...overrides,
});

describe("browse-index", () => {
  it("maps 消防車 to fire truck emoji", () => {
    expect(emojiForVehicle("消防車")).toBe("🚒");
  });

  it("suggests emoji for new vehicle names", () => {
    expect(suggestVehicleEntry("消防車").emoji).toBe("🚒");
  });

  it("reconcile adds catalog vehicles and tags", () => {
    const stories = [
      baseStory({ vehicle: "新車種測試", tags: ["新主題測試"] }),
    ];
    const before = reconcileBrowseIndex(stories);
    expect(before.addedVehicles).toContain("新車種測試");
    expect(before.addedTopics).toContain("新主題測試");
    expect(before.index.vehicles["新車種測試"]?.emoji).toBeTruthy();
    expect(before.index.topics["新主題測試"]?.symbol).toBeTruthy();
  });

  it("warns when story still uses 其他 but title suggests known vehicle", () => {
    const issues = verifyBrowseIndex([
      baseStory({
        slug: "ep-14",
        title: "雙胞胎消防車合作任務｜手足一起長大",
      }),
    ]);
    expect(issues.some((i) => i.code === "vehicle-still-other")).toBe(true);
  });
});
