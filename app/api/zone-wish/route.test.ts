import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

vi.mock("@/lib/zone-wish-db", () => ({
  isZoneWishDbConfigured: vi.fn(),
  insertZoneWish: vi.fn(),
}));

describe("/api/zone-wish", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const { resetZoneWishRateLimits } = await import("@/lib/zone-wish-rate-limit");
    resetZoneWishRateLimits();
  });

  it("GET 回報 DB 是否可用", async () => {
    const { isZoneWishDbConfigured } = await import("@/lib/zone-wish-db");
    vi.mocked(isZoneWishDbConfigured).mockReturnValue(false);

    const res = await GET();
    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ available: false });
  });

  it("無 DATABASE_URL 時 POST 回 503", async () => {
    const { isZoneWishDbConfigured } = await import("@/lib/zone-wish-db");
    vi.mocked(isZoneWishDbConfigured).mockReturnValue(false);

    const res = await POST(
      new Request("http://localhost/api/zone-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: "dino", nickname: "小車" }),
      }),
    );

    expect(res.status).toBe(503);
  });

  it("有效 payload 寫入 DB 回 201", async () => {
    const { isZoneWishDbConfigured, insertZoneWish } = await import("@/lib/zone-wish-db");
    vi.mocked(isZoneWishDbConfigured).mockReturnValue(true);
    vi.mocked(insertZoneWish).mockResolvedValue(undefined);

    const res = await POST(
      new Request("http://localhost/api/zone-wish", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.1",
        },
        body: JSON.stringify({ zoneId: "ocean", nickname: "星星", email: "a@b.co" }),
      }),
    );

    expect(res.status).toBe(201);
    expect(insertZoneWish).toHaveBeenCalledWith({
      zoneId: "ocean",
      email: "a@b.co",
      nickname: "星星",
      userAgent: null,
    });
  });

  it("無效 payload 回 400", async () => {
    const { isZoneWishDbConfigured } = await import("@/lib/zone-wish-db");
    vi.mocked(isZoneWishDbConfigured).mockReturnValue(true);

    const res = await POST(
      new Request("http://localhost/api/zone-wish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zoneId: "dino" }),
      }),
    );

    expect(res.status).toBe(400);
  });
});
