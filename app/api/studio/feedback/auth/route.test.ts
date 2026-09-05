import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  FEEDBACK_MOD_COOKIE,
  moderationSessionToken,
  resetModerationLoginRateLimits,
} from "@/lib/studio-feedback-auth";
import { DELETE, POST } from "./route";

const SECRET = "super-secret-passphrase";

function authRequest(
  body: unknown,
  options: { ip?: string; origin?: string | null; raw?: string } = {},
): Request {
  const { ip = "203.0.113.20", origin = "http://localhost", raw } = options;
  return new Request("http://localhost/api/studio/feedback/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      host: "localhost",
      "x-forwarded-for": ip,
      ...(origin ? { origin } : {}),
    },
    body: raw ?? JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.stubEnv("FEEDBACK_MODERATION_SECRET", SECRET);
  resetModerationLoginRateLimits();
});

afterEach(() => {
  vi.unstubAllEnvs();
  resetModerationLoginRateLimits();
});

describe("POST /api/studio/feedback/auth", () => {
  it("未設定密語回 503，且不設 cookie", async () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");

    const res = await POST(authRequest({ secret: SECRET }));

    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "not_configured" });
  });

  it("跨站 Origin 回 403", async () => {
    const res = await POST(
      authRequest({ secret: SECRET }, { origin: "https://evil.example" }),
    );

    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("沒有 Origin／Referer 也視為跨站 403", async () => {
    const res = await POST(authRequest({ secret: SECRET }, { origin: null }));

    expect(res.status).toBe(403);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("非 JSON 回 400", async () => {
    const res = await POST(
      authRequest(undefined, { ip: "203.0.113.21", raw: "not json" }),
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "invalid_json" });
  });

  it("錯密語回 401，且不設 cookie", async () => {
    const res = await POST(authRequest({ secret: "wrong" }, { ip: "203.0.113.22" }));

    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
    await expect(res.json()).resolves.toEqual({ ok: false, reason: "invalid_secret" });
  });

  it("缺少 secret 欄位回 401，且不設 cookie", async () => {
    const res = await POST(authRequest({}, { ip: "203.0.113.23" }));

    expect(res.status).toBe(401);
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("正確密語回 200 並設 HttpOnly cookie（值不是密語本身）", async () => {
    const res = await POST(authRequest({ secret: SECRET }, { ip: "203.0.113.24" }));
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    await expect(res.json()).resolves.toEqual({ ok: true });
    expect(cookie).toContain(`${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}`);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).not.toContain(SECRET);
  });

  it("回應本文不回吐密語", async () => {
    const res = await POST(authRequest({ secret: SECRET }, { ip: "203.0.113.25" }));
    await expect(res.text()).resolves.toBe(JSON.stringify({ ok: true }));
  });

  it("同 IP 連續嘗試第 6 次回 429＋Retry-After", async () => {
    for (let i = 0; i < 5; i += 1) {
      const res = await POST(authRequest({ secret: "wrong" }, { ip: "203.0.113.30" }));
      expect(res.status).toBe(401);
    }

    const blocked = await POST(
      authRequest({ secret: SECRET }, { ip: "203.0.113.30" }),
    );

    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("Retry-After"))).toBeGreaterThan(0);
    // 被鎖定時即使密語正確也不發 cookie。
    expect(blocked.headers.get("set-cookie")).toBeNull();
  });

  it("production 無 Upstash 時 fail closed 回 503", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    const res = await POST(
      authRequest({ secret: SECRET }, { ip: "203.0.113.31", origin: "http://localhost" }),
    );

    expect(res.status).toBe(503);
    expect(res.headers.get("set-cookie")).toBeNull();
  });
});

describe("DELETE /api/studio/feedback/auth", () => {
  it("登出清掉 cookie", async () => {
    const request = new Request("http://localhost/api/studio/feedback/auth", {
      method: "DELETE",
      headers: { host: "localhost", origin: "http://localhost" },
    });

    const res = await DELETE(request);
    const cookie = res.headers.get("set-cookie") ?? "";

    expect(res.status).toBe(200);
    expect(cookie).toContain(`${FEEDBACK_MOD_COOKIE}=;`);
    expect(cookie).toContain("Max-Age=0");
  });

  it("跨站登出回 403", async () => {
    const request = new Request("http://localhost/api/studio/feedback/auth", {
      method: "DELETE",
      headers: { host: "localhost", origin: "https://evil.example" },
    });

    await expect(DELETE(request).then((res) => res.status)).resolves.toBe(403);
  });
});
