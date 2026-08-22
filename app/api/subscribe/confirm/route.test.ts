import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/subscribe-db", () => ({
  confirmSubscriber: vi.fn(),
  isSubscribeDbConfigured: vi.fn(),
}));

vi.mock("@/lib/subscribe-tokens", () => ({
  hashSubscribeToken: vi.fn(() => "hashed-token"),
}));

describe("/api/subscribe/confirm", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { isSubscribeDbConfigured, confirmSubscriber } = await import("@/lib/subscribe-db");
    vi.mocked(isSubscribeDbConfigured).mockReturnValue(true);
    vi.mocked(confirmSubscriber).mockResolvedValue(false);
    const { resetLocalRateLimits } = await import("@/lib/distributed-rate-limit");
    resetLocalRateLimits();
  });

  it("redirects with no-store and never exposes token state in the URL", async () => {
    const res = await GET(
      new Request("http://localhost/api/subscribe/confirm?token=raw-token", {
        headers: { "x-forwarded-for": "203.0.113.20" },
      }),
    );

    expect(res.status).toBe(307);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("location")).toBe(
      "http://localhost/subscribe/confirmed?status=invalid",
    );
  });

  it("confirms a valid token and keeps the redirect cache private", async () => {
    const { confirmSubscriber } = await import("@/lib/subscribe-db");
    vi.mocked(confirmSubscriber).mockResolvedValue(true);

    const res = await GET(
      new Request("http://localhost/api/subscribe/confirm?token=raw-token"),
    );

    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("location")).toBe(
      "http://localhost/subscribe/confirmed?status=ok",
    );
    expect(confirmSubscriber).toHaveBeenCalledWith("hashed-token");
  });

  it("returns Retry-After after the per-IP confirmation limit", async () => {
    const makeRequest = () =>
      GET(
        new Request("http://localhost/api/subscribe/confirm?token=raw-token", {
          headers: { "x-forwarded-for": "203.0.113.21" },
        }),
      );

    for (let i = 0; i < 30; i += 1) {
      expect((await makeRequest()).status).toBe(307);
    }
    const blocked = await makeRequest();
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
  });
});
