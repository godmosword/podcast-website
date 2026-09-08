import { describe, expect, it } from "vitest";
import { FEEDBACK_WALL_COUNT } from "./feedback-copy";
import { canShowPublicFeedbackList, FEEDBACK_MIN_PUBLIC_MESSAGES } from "./feedback-wall";

describe("feedback wall 公開門檻", () => {
  it("門檻是 1 則", () => {
    expect(FEEDBACK_MIN_PUBLIC_MESSAGES).toBe(1);
  });

  it("0 則不列牆", () => {
    expect(canShowPublicFeedbackList(0)).toBe(false);
  });

  it("≥1 則才列牆", () => {
    expect(canShowPublicFeedbackList(1)).toBe(true);
    expect(canShowPublicFeedbackList(2)).toBe(true);
    expect(canShowPublicFeedbackList(12)).toBe(true);
  });

  it("計數文案永不寫「還沒有公開留言」", () => {
    expect(FEEDBACK_WALL_COUNT(0)).not.toContain("還沒有公開留言");
    expect(FEEDBACK_WALL_COUNT(3)).toBe("共 3 則留言");
  });
});
