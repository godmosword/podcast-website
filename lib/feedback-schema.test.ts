import { describe, expect, it } from "vitest";
import {
  FEEDBACK_DEFAULT_KIND,
  FEEDBACK_DEFAULT_STATUS,
  FEEDBACK_KINDS,
  FEEDBACK_STATUSES,
  feedbackBodySchema,
} from "./feedback-schema";

const validBody = {
  nickname: "馬米",
  email: "parent@example.com",
  message: "很喜歡垃圾車那集！",
  parentConsent: true,
  publishConsent: true,
};

describe("feedback 狀態與類型常數", () => {
  it("status 只有三態，預設 pending（先審後發）", () => {
    expect(FEEDBACK_STATUSES).toEqual(["pending", "published", "hidden"]);
    expect(FEEDBACK_DEFAULT_STATUS).toBe("pending");
  });

  it("kind 只有兩種，預設 general", () => {
    expect(FEEDBACK_KINDS).toEqual(["general", "story_request"]);
    expect(FEEDBACK_DEFAULT_KIND).toBe("general");
  });
});

describe("feedbackBodySchema", () => {
  it("有效 payload 通過並回傳正規化欄位", () => {
    const parsed = feedbackBodySchema.safeParse(validBody);
    expect(parsed.success).toBe(true);
    expect(parsed.success && parsed.data).toEqual(validBody);
  });

  it("nickname 與 message 前後空白會被 trim", () => {
    const parsed = feedbackBodySchema.safeParse({
      ...validBody,
      nickname: "  小車  ",
      message: "  你好  ",
    });
    expect(parsed.success && parsed.data.nickname).toBe("小車");
    expect(parsed.success && parsed.data.message).toBe("你好");
  });

  it("email 會 trim 並轉小寫", () => {
    const parsed = feedbackBodySchema.safeParse({
      ...validBody,
      email: "  Parent@Example.COM  ",
    });
    expect(parsed.success && parsed.data.email).toBe("parent@example.com");
  });

  it("email 必填且需符合格式", () => {
    expect(feedbackBodySchema.safeParse({ ...validBody, email: undefined }).success).toBe(
      false,
    );
    expect(feedbackBodySchema.safeParse({ ...validBody, email: "" }).success).toBe(false);
    expect(feedbackBodySchema.safeParse({ ...validBody, email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("nickname 需 1–40 字", () => {
    expect(feedbackBodySchema.safeParse({ ...validBody, nickname: "   " }).success).toBe(
      false,
    );
    expect(
      feedbackBodySchema.safeParse({ ...validBody, nickname: "馬".repeat(40) }).success,
    ).toBe(true);
    expect(
      feedbackBodySchema.safeParse({ ...validBody, nickname: "馬".repeat(41) }).success,
    ).toBe(false);
  });

  it("message 需 1–200 字", () => {
    expect(feedbackBodySchema.safeParse({ ...validBody, message: "" }).success).toBe(false);
    expect(
      feedbackBodySchema.safeParse({ ...validBody, message: "車".repeat(200) }).success,
    ).toBe(true);
    expect(
      feedbackBodySchema.safeParse({ ...validBody, message: "車".repeat(201) }).success,
    ).toBe(false);
  });

  it("未勾家長同意就退件（兒童個資保護）", () => {
    expect(
      feedbackBodySchema.safeParse({ ...validBody, parentConsent: false }).success,
    ).toBe(false);
    expect(
      feedbackBodySchema.safeParse({ ...validBody, parentConsent: undefined }).success,
    ).toBe(false);
  });

  it("未勾公開授權就退件", () => {
    expect(
      feedbackBodySchema.safeParse({ ...validBody, publishConsent: false }).success,
    ).toBe(false);
    expect(
      feedbackBodySchema.safeParse({ ...validBody, publishConsent: undefined }).success,
    ).toBe(false);
  });

  it("不採信 client 的 kind／status／needsReview／consent 欄位", () => {
    const parsed = feedbackBodySchema.safeParse({
      ...validBody,
      kind: "story_request",
      status: "published",
      needsReview: false,
      consentVersion: "1999-01-01",
      consentedAt: "1999-01-01T00:00:00.000Z",
    });
    expect(parsed.success).toBe(true);
    expect(parsed.success && Object.keys(parsed.data).sort()).toEqual([
      "email",
      "message",
      "nickname",
      "parentConsent",
      "publishConsent",
    ]);
  });

  it("非物件 payload 退件", () => {
    expect(feedbackBodySchema.safeParse(null).success).toBe(false);
    expect(feedbackBodySchema.safeParse("留言").success).toBe(false);
  });
});
