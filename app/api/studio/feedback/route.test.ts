import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedbackAdminDto } from "@/lib/feedback-admin";
import { FEEDBACK_MOD_COOKIE, moderationSessionToken } from "@/lib/studio-feedback-auth";
import { GET } from "./route";

const SECRET = "super-secret-passphrase";
const FIXTURE_EMAIL = "parent@example.com";

vi.mock("@/lib/feedback-admin", () => ({
  listFeedbackForModeration: vi.fn(),
}));

vi.mock("@/lib/feedback-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-db")>();
  return { ...actual, isFeedbackDbConfigured: vi.fn() };
});

const message: FeedbackAdminDto = {
  id: "12",
  nickname: "馬米",
  email: FIXTURE_EMAIL,
  message: "很喜歡垃圾車那集",
  kind: "general",
  status: "pending",
  needsReview: true,
  createdAt: "2026-09-05T02:00:00.000Z",
};

const stats = {
  total: 3,
  pending: 1,
  published: 1,
  hidden: 1,
  needsReview: 1,
  storyRequest: 0,
};

function adminRequest(withCookie: boolean): Request {
  return new Request("http://localhost/api/studio/feedback", {
    headers: {
      host: "localhost",
      ...(withCookie
        ? { cookie: `${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}` }
        : {}),
    },
  });
}

async function mockDbAvailable(available: boolean): Promise<void> {
  const { isFeedbackDbConfigured } = await import("@/lib/feedback-db");
  vi.mocked(isFeedbackDbConfigured).mockReturnValue(available);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("FEEDBACK_MODERATION_SECRET", SECRET);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/studio/feedback", () => {
  it("無 cookie 回 401，且不查資料庫", async () => {
    await mockDbAvailable(true);
    const { listFeedbackForModeration } = await import("@/lib/feedback-admin");

    const res = await GET(adminRequest(false));

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "unauthorized" });
    expect(listFeedbackForModeration).not.toHaveBeenCalled();
  });

  it("cookie 值不對回 401", async () => {
    await mockDbAvailable(true);
    const request = new Request("http://localhost/api/studio/feedback", {
      headers: { host: "localhost", cookie: `${FEEDBACK_MOD_COOKIE}=forged` },
    });

    expect((await GET(request)).status).toBe(401);
  });

  it("拿密語本身當 cookie 值也回 401", async () => {
    await mockDbAvailable(true);
    const request = new Request("http://localhost/api/studio/feedback", {
      headers: { host: "localhost", cookie: `${FEEDBACK_MOD_COOKIE}=${SECRET}` },
    });

    expect((await GET(request)).status).toBe(401);
  });

  it("未設定密語回 503 not_configured", async () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    await mockDbAvailable(true);

    const res = await GET(adminRequest(false));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "not_configured" });
  });

  it("已登入回聚合＋含 email 的後台列", async () => {
    await mockDbAvailable(true);
    const { listFeedbackForModeration } = await import("@/lib/feedback-admin");
    vi.mocked(listFeedbackForModeration).mockResolvedValue({ stats, messages: [message] });

    const res = await GET(adminRequest(true));
    const payload = (await res.json()) as {
      ok: boolean;
      stats: typeof stats;
      messages: FeedbackAdminDto[];
    };

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(payload.ok).toBe(true);
    expect(payload.stats).toEqual(stats);
    expect(payload.messages[0]?.email).toBe(FIXTURE_EMAIL);
    expect(payload.messages[0]?.needsReview).toBe(true);
  });

  it("stats 只有數字，不含 email／正文字串", async () => {
    await mockDbAvailable(true);
    const { listFeedbackForModeration } = await import("@/lib/feedback-admin");
    vi.mocked(listFeedbackForModeration).mockResolvedValue({ stats, messages: [message] });

    const res = await GET(adminRequest(true));
    const payload = (await res.json()) as { stats: Record<string, unknown> };
    const statsText = JSON.stringify(payload.stats);

    expect(statsText).not.toContain(FIXTURE_EMAIL);
    expect(statsText).not.toContain("@");
    expect(statsText).not.toContain("垃圾車");
    expect(Object.values(payload.stats).every((v) => typeof v === "number")).toBe(true);
  });

  it("未登入的回應不含任何留言內容", async () => {
    await mockDbAvailable(true);
    const { listFeedbackForModeration } = await import("@/lib/feedback-admin");
    vi.mocked(listFeedbackForModeration).mockResolvedValue({ stats, messages: [message] });

    const text = await (await GET(adminRequest(false))).text();

    expect(text).not.toContain(FIXTURE_EMAIL);
    expect(text).not.toContain("馬米");
  });

  it("無 DATABASE_URL 回 503 db_unavailable", async () => {
    await mockDbAvailable(false);

    const res = await GET(adminRequest(true));

    expect(res.status).toBe(503);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "db_unavailable" });
  });

  it("DB 失敗回 500 db_error", async () => {
    await mockDbAvailable(true);
    const { listFeedbackForModeration } = await import("@/lib/feedback-admin");
    vi.mocked(listFeedbackForModeration).mockRejectedValue(new Error("db down"));

    const res = await GET(adminRequest(true));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "db_error" });
  });
});
