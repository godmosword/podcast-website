import { describe, expect, it } from "vitest";
import { LANDING_SEGMENT_IDS } from "@/data/landing-segments";
import {
  DUDU_EMOTIONS,
  DUDU_EMOTION_BY_SEGMENT,
  DUDU_TAP_SEQUENCE,
  emotionSrc,
  nextTapEmotion,
} from "./dudu-emotions";

describe("dudu-emotions", () => {
  it("每個 landing segment 都有對應表情", () => {
    for (const id of LANDING_SEGMENT_IDS) {
      const emotion = DUDU_EMOTION_BY_SEGMENT[id];
      expect(DUDU_EMOTIONS).toContain(emotion);
    }
  });

  it("六款表情全部被用到（segment + tap 彩蛋）", () => {
    const used = new Set<string>([
      ...Object.values(DUDU_EMOTION_BY_SEGMENT),
      ...DUDU_TAP_SEQUENCE,
    ]);
    expect(used.size).toBe(DUDU_EMOTIONS.length);
  });

  it("nextTapEmotion 從 null 開始並循環", () => {
    const first = nextTapEmotion(null);
    expect(first).toBe(DUDU_TAP_SEQUENCE[0]);
    const second = nextTapEmotion(first);
    expect(second).toBe(DUDU_TAP_SEQUENCE[1]);
    expect(nextTapEmotion(second)).toBe(DUDU_TAP_SEQUENCE[0]);
  });

  it("emotionSrc 指向 webp sprite", () => {
    expect(emotionSrc("bye")).toBe("/landing/mascot/dudu-bye.webp");
  });
});
