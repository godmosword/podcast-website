import { describe, expect, it } from "vitest";
import { LANDING_SEGMENT_IDS } from "@/data/landing-segments";
import {
  DUDU_EMOTIONS,
  DUDU_EMOTION_BY_SEGMENT,
  emotionSrc,
  nextEmotion,
} from "./dudu-emotions";

describe("dudu-emotions", () => {
  it("每個 landing segment 都有對應表情", () => {
    for (const id of LANDING_SEGMENT_IDS) {
      const emotion = DUDU_EMOTION_BY_SEGMENT[id];
      expect(DUDU_EMOTIONS).toContain(emotion);
    }
  });

  it("nextEmotion 連點可走完全部六款並循環回起點", () => {
    const seen: string[] = [];
    let cur = DUDU_EMOTIONS[0];
    for (let i = 0; i < DUDU_EMOTIONS.length; i++) {
      seen.push(cur);
      cur = nextEmotion(cur);
    }
    expect(new Set(seen).size).toBe(DUDU_EMOTIONS.length);
    expect(cur).toBe(DUDU_EMOTIONS[0]); // 繞一圈回到起點
  });

  it("emotionSrc 指向 webp sprite", () => {
    expect(emotionSrc("bye")).toBe("/landing/mascot/dudu-bye.webp");
  });
});
