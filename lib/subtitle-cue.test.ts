import { describe, expect, it } from "vitest";
import {
  activeCueIndex,
  captionWindow,
  resolveCaptionStackState,
} from "./subtitle-cue";

describe("subtitle-cue (D13)", () => {
  it("activeCueIndex 跟讀遞增時間軸", () => {
    const times = [0, 5, 12, 20];
    expect(activeCueIndex(times, 0, 3)).toBe(0);
    expect(activeCueIndex(times, 5, 3)).toBe(1);
    expect(activeCueIndex(times, 11.9, 3)).toBe(1);
    expect(activeCueIndex(times, 99, 3)).toBe(3);
  });

  it("captionWindow 回傳前後句", () => {
    const lines = ["第一句", "第二句", "第三句"];
    expect(captionWindow(lines, 1)).toEqual({
      prev: "第一句",
      current: "第二句",
      next: "第三句",
    });
    expect(captionWindow(lines, 0).prev).toBeNull();
    expect(captionWindow(lines, 2).next).toBeNull();
  });

  it("resolveCaptionStackState 優先即時字幕軌", () => {
    const state = resolveCaptionStackState({
      hasSubtitles: true,
      subtitles: [
        { t: 0, text: "A" },
        { t: 2, text: "B" },
      ],
      subIndex: 1,
      sceneCaptions: true,
      captions: ["頁1", "頁2"],
      page: 0,
      total: 2,
    });
    expect(state?.mode).toBe("subtitles");
    expect(state?.activeIndex).toBe(1);
    expect(captionWindow(state!.lines, state!.activeIndex).current).toBe("B");
  });

  it("resolveCaptionStackState 翻頁 captions 對齊 page", () => {
    const state = resolveCaptionStackState({
      hasSubtitles: false,
      subtitles: undefined,
      subIndex: 0,
      sceneCaptions: true,
      captions: ["頁1", "頁2", "頁3"],
      page: 1,
      total: 3,
    });
    expect(state?.mode).toBe("scene");
    expect(captionWindow(state!.lines, state!.activeIndex).current).toBe("頁2");
  });
});
