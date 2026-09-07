import { describe, expect, it } from "vitest";
import { FEEDBACK_STARTERS, FEEDBACK_WALL_COUNT } from "./feedback-copy";
import { canShowPublicFeedbackList, FEEDBACK_MIN_PUBLIC_MESSAGES } from "./feedback-wall";

describe("feedback wall 公開門檻", () => {
  it("門檻是 3 則", () => {
    expect(FEEDBACK_MIN_PUBLIC_MESSAGES).toBe(3);
  });

  it("0／1／2 則不列牆", () => {
    expect(canShowPublicFeedbackList(0)).toBe(false);
    expect(canShowPublicFeedbackList(1)).toBe(false);
    expect(canShowPublicFeedbackList(2)).toBe(false);
  });

  it("≥3 則才列牆", () => {
    expect(canShowPublicFeedbackList(3)).toBe(true);
    expect(canShowPublicFeedbackList(12)).toBe(true);
  });

  it("計數文案永不寫「還沒有公開留言」", () => {
    expect(FEEDBACK_WALL_COUNT(0)).not.toContain("還沒有公開留言");
    expect(FEEDBACK_WALL_COUNT(3)).toBe("共 3 則留言");
  });

  it("起頭句是三句可改的靜態文案", () => {
    expect(FEEDBACK_STARTERS).toHaveLength(3);
    expect(FEEDBACK_STARTERS.map((item) => item.label)).toEqual([
      "想聽挖土機",
      "最喜歡小紅賽車",
      "謝謝馬米說故事",
    ]);
  });
});
