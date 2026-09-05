import { beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedbackPublicRow } from "./feedback-db";
import { createFeedbackMessage, listPublishedFeedback } from "./feedback-query";

// 只替換 DB 存取，保留真正的 toPublicDto 白名單邏輯。
vi.mock("@/lib/feedback-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-db")>();
  return {
    ...actual,
    selectPublishedFeedbackRows: vi.fn(),
    insertFeedbackMessage: vi.fn(),
  };
});

const consentedAt = new Date("2026-09-05T04:00:00.000Z");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listPublishedFeedback", () => {
  it("把 DB 列轉成公開 DTO，且不含 email", async () => {
    const { selectPublishedFeedbackRows } = await import("@/lib/feedback-db");
    vi.mocked(selectPublishedFeedbackRows).mockResolvedValue([
      {
        id: 2,
        nickname: "馬米",
        message: "謝謝你的收聽",
        created_at: "2026-09-05T02:00:00.000Z",
        email: "parent@example.com",
        status: "published",
      } as FeedbackPublicRow,
    ]);

    const messages = await listPublishedFeedback();

    expect(messages).toEqual([
      {
        id: 2,
        nickname: "馬米",
        message: "謝謝你的收聽",
        createdAt: "2026-09-05T02:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(messages)).not.toContain("parent@example.com");
  });

  it("limit 會傳給 DB 層", async () => {
    const { selectPublishedFeedbackRows } = await import("@/lib/feedback-db");
    vi.mocked(selectPublishedFeedbackRows).mockResolvedValue([]);

    await listPublishedFeedback(12);

    expect(selectPublishedFeedbackRows).toHaveBeenCalledWith(12);
  });
});

describe("createFeedbackMessage", () => {
  const input = {
    nickname: "小車",
    email: "parent@example.com",
    message: "我最喜歡挖土機那一集",
    consentVersion: "2026-09-05",
    consentedAt,
  };

  it("kind 固定 general、needsReview 預設 false", async () => {
    const { insertFeedbackMessage } = await import("@/lib/feedback-db");
    vi.mocked(insertFeedbackMessage).mockResolvedValue(undefined);

    const result = await createFeedbackMessage(input);

    expect(result).toEqual({ needsReview: false, reasons: [] });
    expect(insertFeedbackMessage).toHaveBeenCalledWith({
      nickname: "小車",
      email: "parent@example.com",
      message: "我最喜歡挖土機那一集",
      kind: "general",
      needsReview: false,
      consentVersion: "2026-09-05",
      consentedAt,
    });
  });

  it("PII 命中時標記 needs_review，但仍照常收件", async () => {
    const { insertFeedbackMessage } = await import("@/lib/feedback-db");
    vi.mocked(insertFeedbackMessage).mockResolvedValue(undefined);

    const result = await createFeedbackMessage({
      ...input,
      message: "我在快樂幼兒園，電話 0912345678",
    });

    expect(result.needsReview).toBe(true);
    expect(result.reasons).toEqual(["phone", "keyword"]);
    expect(insertFeedbackMessage).toHaveBeenCalledWith(
      expect.objectContaining({ needsReview: true, kind: "general" }),
    );
  });

  it("DB 失敗會往上丟給 route 轉 500", async () => {
    const { insertFeedbackMessage } = await import("@/lib/feedback-db");
    vi.mocked(insertFeedbackMessage).mockRejectedValue(new Error("db down"));

    await expect(createFeedbackMessage(input)).rejects.toThrow("db down");
  });
});
