import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/subscribe-db", () => ({
  isSubscribeDbConfigured: vi.fn(),
  insertSubscriber: vi.fn(),
}));

describe("/api/subscribe", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { resetSubscribeRateLimits } = await import("@/lib/subscribe-rate-limit");
    resetSubscribeRateLimits();
  });

  it("GET 回報 DB 是否可用", async () => {
    const { isSubscribeDbConfigured } = await import("@/lib/subscribe-db");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ available: true });
  });

  it("無 DATABASE_URL 時 POST 回 503", async () => {
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

  it("有效 payload 寫入 DB 回 201", async () => {
    const { isSubscribeDbConfigured, insertSubscriber } = await import(
      "@/lib/subscribe-db"
    );
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(insertSubscriber).mockResolvedValue(undefined);

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

    expect(res.status).toBe(201);
    expect(insertSubscriber).toHaveBeenCalledWith({
      email: "parent@example.com",
      source: "subscribe_page",
      userAgent: null,
    });
  });

  it("重複 email 仍回 201（冪等）", async () => {
    const { isSubscribeDbConfigured, insertSubscriber } = await import(
      "@/lib/subscribe-db"
    );
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(insertSubscriber).mockResolvedValue(undefined);

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
    expect(first.status).toBe(201);
    expect(second.status).toBe(201);
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
      expect(res.status).toBe(201);
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
