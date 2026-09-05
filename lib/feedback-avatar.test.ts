import { describe, expect, it } from "vitest";
import {
  FEEDBACK_AVATAR_COLORS,
  feedbackAvatarColor,
  feedbackAvatarInitial,
  hashNickname,
} from "./feedback-avatar";

describe("feedbackAvatar", () => {
  it("同一暱稱 hash 穩定", () => {
    expect(hashNickname("Bonbon")).toBe(hashNickname("Bonbon"));
  });

  it("配色落在白名單色票", () => {
    expect(FEEDBACK_AVATAR_COLORS).toContain(feedbackAvatarColor("小車"));
  });

  it("首字取 trim 後第一個字元", () => {
    expect(feedbackAvatarInitial("  馬米  ")).toBe("馬");
    expect(feedbackAvatarInitial("   ")).toBe("?");
  });
});
