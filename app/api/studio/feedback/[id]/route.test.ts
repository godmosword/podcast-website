import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FeedbackAdminDto, FeedbackAdminRow } from "@/lib/feedback-admin";
import { FEEDBACK_MOD_COOKIE, moderationSessionToken } from "@/lib/studio-feedback-auth";
import { GET } from "../route";
import { DELETE, PATCH } from "./route";

const SECRET = "super-secret-passphrase";
const FIXTURE_EMAIL = "parent@example.com";

const store = vi.hoisted(() => ({ rows: [] as FeedbackAdminRow[] }));

// 以記憶體 store 取代 Neon，讓「刪除後 GET 取不到」可以端到端驗。
vi.mock("@/lib/feedback-admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-admin")>();

  return {
    ...actual,
    listFeedbackForModeration: async () => ({
      stats: {
        total: store.rows.length,
        pending: store.rows.filter((r) => r.status === "pending").length,
        published: store.rows.filter((r) => r.status === "published").length,
        hidden: store.rows.filter((r) => r.status === "hidden").length,
        needsReview: store.rows.filter((r) => r.needs_review).length,
        storyRequest: store.rows.filter((r) => r.kind === "story_request").length,
      },
      messages: store.rows.map(actual.toAdminDto),
    }),
    updateFeedbackMessage: async (
      id: string,
      patch: { status?: FeedbackAdminRow["status"]; kind?: FeedbackAdminRow["kind"] },
    ) => {
      const row = store.rows.find((item) => String(item.id) === id);
      if (!row) return { ok: false as const, reason: "not_found" as const };
      if (patch.status && !actual.canTransitionFeedbackStatus(row.status, patch.status)) {
        return { ok: false as const, reason: "invalid_transition" as const };
      }
      if (patch.status) row.status = patch.status;
      if (patch.kind) row.kind = patch.kind;
      return { ok: true as const, row };
    },
    deleteFeedbackMessage: async (id: string) => {
      const index = store.rows.findIndex((item) => String(item.id) === id);
      if (index === -1) return false;
      store.rows.splice(index, 1);
      return true;
    },
  };
});

vi.mock("@/lib/feedback-db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/feedback-db")>();
  return { ...actual, isFeedbackDbConfigured: () => true };
});

type Context = { params: Promise<{ id: string }> };

function context(id: string): Context {
  return { params: Promise.resolve({ id }) };
}

function headers(options: { withCookie?: boolean; origin?: string | null } = {}) {
  const { withCookie = true, origin = "http://localhost" } = options;
  return {
    "Content-Type": "application/json",
    host: "localhost",
    ...(origin ? { origin } : {}),
    ...(withCookie
      ? { cookie: `${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}` }
      : {}),
  };
}

function patchRequest(
  body: unknown,
  options: { withCookie?: boolean; origin?: string | null; raw?: string } = {},
): Request {
  return new Request("http://localhost/api/studio/feedback/12", {
    method: "PATCH",
    headers: headers(options),
    body: options.raw ?? JSON.stringify(body),
  });
}

function deleteRequest(
  options: { withCookie?: boolean; origin?: string | null } = {},
): Request {
  return new Request("http://localhost/api/studio/feedback/12", {
    method: "DELETE",
    headers: headers(options),
  });
}

function adminGetRequest(): Request {
  return new Request("http://localhost/api/studio/feedback", {
    headers: {
      host: "localhost",
      cookie: `${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}`,
    },
  });
}

beforeEach(() => {
  vi.stubEnv("FEEDBACK_MODERATION_SECRET", SECRET);
  store.rows = [
    {
      id: 12,
      nickname: "馬米",
      email: FIXTURE_EMAIL,
      message: "我在快樂幼兒園",
      kind: "general",
      status: "pending",
      needs_review: true,
      created_at: "2026-09-05T02:00:00.000Z",
    },
    {
      id: 13,
      nickname: "小車",
      email: "other@example.com",
      message: "想聽挖土機",
      kind: "story_request",
      status: "published",
      needs_review: false,
      created_at: "2026-09-05T03:00:00.000Z",
    },
  ];
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PATCH /api/studio/feedback/[id]", () => {
  it("無 cookie 回 401，且不改動資料", async () => {
    const res = await PATCH(
      patchRequest({ status: "published" }, { withCookie: false }),
      context("12"),
    );

    expect(res.status).toBe(401);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(store.rows[0]?.status).toBe("pending");
  });

  it("已登入但跨站回 403", async () => {
    const res = await PATCH(
      patchRequest({ status: "published" }, { origin: "https://evil.example" }),
      context("12"),
    );

    expect(res.status).toBe(403);
    expect(store.rows[0]?.status).toBe("pending");
  });

  it("未設定密語回 503", async () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");

    const res = await PATCH(patchRequest({ status: "published" }), context("12"));

    expect(res.status).toBe(503);
  });

  it("核准後狀態變 published", async () => {
    const res = await PATCH(patchRequest({ status: "published" }), context("12"));
    const payload = (await res.json()) as { ok: boolean; message: FeedbackAdminDto };

    expect(res.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.message.status).toBe("published");
    expect(store.rows[0]?.status).toBe("published");
  });

  it("已公開可以隱藏，隱藏後可以重新公開", async () => {
    await PATCH(patchRequest({ status: "hidden" }), context("13"));
    expect(store.rows[1]?.status).toBe("hidden");

    await PATCH(patchRequest({ status: "published" }), context("13"));
    expect(store.rows[1]?.status).toBe("published");
  });

  it("published → pending 回 409 invalid_transition", async () => {
    const res = await PATCH(patchRequest({ status: "pending" }), context("13"));

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({
      ok: false,
      reason: "invalid_transition",
    });
    expect(store.rows[1]?.status).toBe("published");
  });

  it("可以改標 kind", async () => {
    const res = await PATCH(patchRequest({ kind: "story_request" }), context("12"));

    expect(res.status).toBe(200);
    expect(store.rows[0]?.kind).toBe("story_request");
    expect(store.rows[0]?.status).toBe("pending");
  });

  it("不合法 status 回 400，不改資料", async () => {
    const res = await PATCH(patchRequest({ status: "deleted" }), context("12"));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "validation_error" });
    expect(store.rows[0]?.status).toBe("pending");
  });

  it("空 body 回 400（至少要帶 status 或 kind）", async () => {
    expect((await PATCH(patchRequest({}), context("12"))).status).toBe(400);
  });

  it("不採信 body 的暱稱／正文／email 改寫", async () => {
    const res = await PATCH(
      patchRequest({
        status: "published",
        nickname: "駭客",
        message: "被改掉的正文",
        email: "attacker@example.com",
      }),
      context("12"),
    );

    expect(res.status).toBe(200);
    expect(store.rows[0]?.nickname).toBe("馬米");
    expect(store.rows[0]?.message).toBe("我在快樂幼兒園");
    expect(store.rows[0]?.email).toBe(FIXTURE_EMAIL);
  });

  it("非 JSON 回 400", async () => {
    const res = await PATCH(
      patchRequest(undefined, { raw: "not json" }),
      context("12"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "invalid_json" });
  });

  it("id 非數字回 400 invalid_id", async () => {
    const res = await PATCH(
      patchRequest({ status: "published" }),
      context("1;DROP TABLE feedback_messages"),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "invalid_id" });
  });

  it("找不到的 id 回 404", async () => {
    const res = await PATCH(patchRequest({ status: "published" }), context("999"));

    expect(res.status).toBe(404);
  });
});

describe("DELETE /api/studio/feedback/[id]", () => {
  it("無 cookie 回 401，且留言還在", async () => {
    const res = await DELETE(deleteRequest({ withCookie: false }), context("12"));

    expect(res.status).toBe(401);
    expect(store.rows).toHaveLength(2);
  });

  it("跨站回 403", async () => {
    const res = await DELETE(
      deleteRequest({ origin: "https://evil.example" }),
      context("12"),
    );

    expect(res.status).toBe(403);
    expect(store.rows).toHaveLength(2);
  });

  it("硬刪成功後，後台 GET 再也取不到該 id 與其 email", async () => {
    const res = await DELETE(deleteRequest(), context("12"));
    expect(res.status).toBe(200);

    const after = await GET(adminGetRequest());
    const text = await after.text();
    const payload = JSON.parse(text) as {
      stats: { total: number };
      messages: FeedbackAdminDto[];
    };

    expect(payload.messages.map((m) => m.id)).toEqual(["13"]);
    expect(text).not.toContain(FIXTURE_EMAIL);
    expect(text).not.toContain("快樂幼兒園");
    expect(payload.stats.total).toBe(1);
  });

  it("重複刪除回 404", async () => {
    await DELETE(deleteRequest(), context("12"));

    const again = await DELETE(deleteRequest(), context("12"));

    expect(again.status).toBe(404);
    await expect(again.json()).resolves.toEqual({ ok: false, reason: "not_found" });
  });

  it("id 非數字回 400", async () => {
    expect((await DELETE(deleteRequest(), context("abc"))).status).toBe(400);
    expect(store.rows).toHaveLength(2);
  });
});
