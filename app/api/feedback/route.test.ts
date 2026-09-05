import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedbackPublicDto } from "@/lib/feedback-db";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import { GET, POST } from "./route";

vi.mock("@/lib/feedback-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-db")>();
  return { ...actual, isFeedbackDbConfigured: vi.fn() };
});

vi.mock("@/lib/feedback-query", () => ({
  listPublishedFeedback: vi.fn(),
  createFeedbackMessage: vi.fn(),
}));

const FIXTURE_EMAIL = "parent@example.com";

const validBody = {
  nickname: "馬米",
  email: FIXTURE_EMAIL,
  message: "很喜歡垃圾車那集！",
  parentConsent: true,
  publishConsent: true,
};

function postRequest(body: unknown, ip = "203.0.113.20", raw?: string): Request {
  return new Request("http://localhost/api/feedback", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-forwarded-for": ip,
    },
    body: raw ?? JSON.stringify(body),
  });
}

async function mockDbAvailable(available: boolean): Promise<void> {
  const { isFeedbackDbConfigured } = await import("@/lib/feedback-db");
  vi.mocked(isFeedbackDbConfigured).mockReturnValue(available);
}

beforeEach(async () => {
  vi.clearAllMocks();
  const { resetFeedbackRateLimits } = await import("@/lib/feedback-rate-limit");
  resetFeedbackRateLimits();
});

afterEach(async () => {
  vi.unstubAllEnvs();
  const { resetFeedbackRateLimits } = await import("@/lib/feedback-rate-limit");
  resetFeedbackRateLimits();
});

describe("GET /api/feedback", () => {
  it("無 DATABASE_URL 回 200 空牆", async () => {
    await mockDbAvailable(false);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ available: false, messages: [] });
  });

  it("回傳已核准留言的公開 DTO", async () => {
    await mockDbAvailable(true);
    const { listPublishedFeedback } = await import("@/lib/feedback-query");
    vi.mocked(listPublishedFeedback).mockResolvedValue([
      {
        id: 3,
        nickname: "小車",
        message: "謝謝馬米",
        createdAt: "2026-09-05T02:00:00.000Z",
      },
    ]);

    const res = await GET();
    const payload = (await res.json()) as {
      available: boolean;
      messages: FeedbackPublicDto[];
    };

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.available).toBe(true);
    expect(Object.keys(payload.messages[0] ?? {}).sort()).toEqual([
      "createdAt",
      "id",
      "message",
      "nickname",
    ]);
  });

  it("公開 JSON 不得含 email／status／kind（即使上游夾帶）", async () => {
    await mockDbAvailable(true);
    const { listPublishedFeedback } = await import("@/lib/feedback-query");
    vi.mocked(listPublishedFeedback).mockResolvedValue([
      {
        id: 4,
        nickname: "小車",
        message: "哈囉",
        createdAt: "2026-09-05T02:00:00.000Z",
        email: FIXTURE_EMAIL,
        status: "published",
        kind: "story_request",
        needsReview: true,
      } as FeedbackPublicDto,
    ]);

    const res = await GET();
    const text = await res.text();

    expect(text).not.toContain(FIXTURE_EMAIL);
    expect(text).not.toContain("status");
    expect(text).not.toContain("kind");
    expect(text).not.toContain("needsReview");
  });

  it("DB 查詢失敗時降級成空牆而非 500", async () => {
    await mockDbAvailable(true);
    const { listPublishedFeedback } = await import("@/lib/feedback-query");
    vi.mocked(listPublishedFeedback).mockRejectedValue(new Error("db down"));

    const res = await GET();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ available: false, messages: [] });
  });
});

describe("POST /api/feedback", () => {
  it("無 DATABASE_URL 回 503 db_unavailable", async () => {
    await mockDbAvailable(false);

    const res = await POST(postRequest(validBody));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "db_unavailable" });
  });

  it("非 JSON 回 400 invalid_json", async () => {
    await mockDbAvailable(true);

    const res = await POST(postRequest(undefined, "203.0.113.21", "not json"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "invalid_json" });
  });

  it("缺少家長同意回 400 validation_error", async () => {
    await mockDbAvailable(true);

    const res = await POST(postRequest({ ...validBody, parentConsent: false }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "validation_error" });
  });

  it("缺少公開授權回 400 validation_error", async () => {
    await mockDbAvailable(true);

    const res = await POST(postRequest({ ...validBody, publishConsent: undefined }));

    expect(res.status).toBe(400);
  });

  it("有效 payload 回 201，consent 由 server 寫入", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    const res = await POST(
      postRequest({ ...validBody, nickname: " 馬米 ", email: " Parent@Example.COM " }),
    );

    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(createFeedbackMessage).toHaveBeenCalledWith({
      nickname: "馬米",
      email: FIXTURE_EMAIL,
      message: "很喜歡垃圾車那集！",
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: expect.any(Date),
    });
  });

  it("201 回應不回吐 email 或狀態", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: true, reasons: ["phone"] });

    const res = await POST(postRequest(validBody));
    const text = await res.text();

    expect(text).toBe(JSON.stringify({ ok: true }));
    expect(text).not.toContain(FIXTURE_EMAIL);
    expect(text).not.toContain("needsReview");
  });

  it("同 IP 超過 10 則回 429＋Retry-After", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    // 每次換 email 以避開 email 窗口，單獨驗證 IP 窗口。
    for (let i = 0; i < 10; i += 1) {
      const res = await POST(
        postRequest({ ...validBody, email: `parent${i}@example.com` }, "203.0.113.30"),
      );
      expect(res.status).toBe(201);
    }

    const blocked = await POST(
      postRequest({ ...validBody, email: "parent99@example.com" }, "203.0.113.30"),
    );

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    const payload = (await blocked.json()) as { ok: boolean; reason: string };
    expect(payload).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("同 email 超過 3 則即使換 IP 也回 429", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockResolvedValue({ needsReview: false, reasons: [] });

    for (let i = 0; i < 3; i += 1) {
      const res = await POST(postRequest(validBody, `203.0.113.4${i}`));
      expect(res.status).toBe(201);
    }

    const blocked = await POST(postRequest(validBody, "203.0.113.49"));

    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeTruthy();
    expect(createFeedbackMessage).toHaveBeenCalledTimes(3);
  });

  it("production 無 Upstash 時 fail closed 回 503", async () => {
    await mockDbAvailable(true);
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
    const { createFeedbackMessage } = await import("@/lib/feedback-query");

    const res = await POST(postRequest(validBody));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "db_unavailable" });
    expect(createFeedbackMessage).not.toHaveBeenCalled();
  });

  it("DB 寫入失敗回 500 db_error", async () => {
    await mockDbAvailable(true);
    const { createFeedbackMessage } = await import("@/lib/feedback-query");
    vi.mocked(createFeedbackMessage).mockRejectedValue(new Error("db down"));

    const res = await POST(postRequest(validBody, "203.0.113.50"));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "db_error" });
  });
});
