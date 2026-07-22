import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/subscribe-db", () => ({
  isSubscribeDbConfigured: vi.fn(),
  upsertPendingSubscriber: vi.fn(),
}));

vi.mock("@/lib/subscribe-email", () => ({
  isSubscribeEmailConfigured: vi.fn(),
  sendSubscribeConfirmation: vi.fn(),
}));

vi.mock("@/lib/subscribe-tokens", () => ({
  createSubscribeToken: vi.fn(() => ({ token: "raw-token", tokenHash: "token-hash" })),
}));

describe("/api/subscribe", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isSubscribeEmailConfigured, sendSubscribeConfirmation } = await import(
      "@/lib/subscribe-email"
    );
    vi.mocked(isSubscribeEmailConfigured).mockReturnValue(true);
    vi.mocked(sendSubscribeConfirmation).mockResolvedValue(undefined);
    const { upsertPendingSubscriber } = await import("@/lib/subscribe-db");
    vi.mocked(upsertPendingSubscriber).mockResolvedValue("pending");
    const { resetSubscribeRateLimits } = await import("@/lib/subscribe-rate-limit");
    resetSubscribeRateLimits();
  });

  it("GET 回報 DB 與確認信服務是否可用", async () => {
    const { isSubscribeDbConfigured } = await import("@/lib/subscribe-db");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ available: true });
  });

  it("無必要服務設定時 POST 回 503", async () => {
    const { isSubscribeDbConfigured } = await import("@/lib/subscribe-db");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(false);

    const res = await POST(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "parent@example.com",
          parentConsent: true,
        }),
      }),
    );

    expect(res.status).toBe(503);
  });

  it("有效 payload 寫入 pending 並寄確認信回 202", async () => {
    const { isSubscribeDbConfigured, upsertPendingSubscriber } = await import(
      "@/lib/subscribe-db"
    );
    const { sendSubscribeConfirmation } = await import("@/lib/subscribe-email");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(upsertPendingSubscriber).mockResolvedValue("pending");

    const res = await POST(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.9",
        },
        body: JSON.stringify({
          email: "parent@example.com",
          parentConsent: true,
          source: "subscribe_page",
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(upsertPendingSubscriber).toHaveBeenCalledWith({
      email: "parent@example.com",
      source: "subscribe_page",
      tokenHash: "token-hash",
      expiresAt: expect.any(Date),
      consentVersion: "2026-07-22",
      consentedAt: expect.any(Date),
    });
    expect(sendSubscribeConfirmation).toHaveBeenCalledWith({
      email: "parent@example.com",
      token: "raw-token",
    });
  });

  it("重複 email 仍回 202（冪等）", async () => {
    const { isSubscribeDbConfigured, upsertPendingSubscriber } = await import(
      "@/lib/subscribe-db"
    );
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(upsertPendingSubscriber).mockResolvedValue("pending");

    const makeReq = () =>
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({
          email: "dup@example.com",
          parentConsent: true,
        }),
      });

    const first = await POST(makeReq());
    const second = await POST(makeReq());
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
  });

  it("已確認 email 不重寄確認信", async () => {
    const { isSubscribeDbConfigured, upsertPendingSubscriber } = await import(
      "@/lib/subscribe-db"
    );
    const { sendSubscribeConfirmation } = await import("@/lib/subscribe-email");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(upsertPendingSubscriber).mockResolvedValue("confirmed");

    const res = await POST(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "confirmed@example.com",
          parentConsent: true,
        }),
      }),
    );

    expect(res.status).toBe(202);
    expect(sendSubscribeConfirmation).not.toHaveBeenCalled();
  });

  it("超過 rate limit 回 429", async () => {
    const { isSubscribeDbConfigured } = await import("@/lib/subscribe-db");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);

    const headers = {
      "Content-Type": "application/json",
      "x-forwarded-for": "203.0.113.11",
    };
    const body = JSON.stringify({
      email: "rate@example.com",
      parentConsent: true,
    });

    for (let i = 0; i < 5; i += 1) {
      const res = await POST(
        new Request("http://localhost/api/subscribe", {
          method: "POST",
          headers,
          body: JSON.stringify({
            email: `rate${i}@example.com`,
            parentConsent: true,
          }),
        }),
      );
      expect(res.status).toBe(202);
    }

    const blocked = await POST(
      new Request("http://localhost/api/subscribe", {
        method: "POST",
        headers,
        body,
      }),
    );
    expect(blocked.status).toBe(429);
  });
});
