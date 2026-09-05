import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildModerationLogoutCookie,
  buildModerationSessionCookie,
  checkModerationLoginRateLimit,
  FEEDBACK_MOD_COOKIE,
  guardModerationRequest,
  hasModerationSession,
  isFeedbackModerationConfigured,
  isSameOriginRequest,
  moderationSessionToken,
  readCookieValue,
  resetModerationLoginRateLimits,
  verifyModerationSecret,
} from "./studio-feedback-auth";

const SECRET = "super-secret-passphrase";

function sessionRequest(
  cookie: string | null,
  headers: Record<string, string> = {},
): Request {
  return new Request("http://localhost/api/studio/feedback", {
    headers: {
      ...(cookie ? { cookie } : {}),
      host: "localhost",
      ...headers,
    },
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

describe("isFeedbackModerationConfigured", () => {
  it("有非空白密語才算已設定", () => {
    expect(isFeedbackModerationConfigured()).toBe(true);
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "   ");
    expect(isFeedbackModerationConfigured()).toBe(false);
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    expect(isFeedbackModerationConfigured()).toBe(false);
  });
});

describe("verifyModerationSecret", () => {
  it("密語相同才通過", () => {
    expect(verifyModerationSecret(SECRET)).toBe(true);
    expect(verifyModerationSecret("wrong")).toBe(false);
    expect(verifyModerationSecret(`${SECRET} `)).toBe(false);
  });

  it("長度不同也不會丟錯（先 hash 再 timingSafeEqual）", () => {
    expect(() => verifyModerationSecret("x")).not.toThrow();
    expect(verifyModerationSecret("x")).toBe(false);
    expect(verifyModerationSecret(`${SECRET}${SECRET}`)).toBe(false);
  });

  it("非字串／空字串一律 false", () => {
    expect(verifyModerationSecret(undefined)).toBe(false);
    expect(verifyModerationSecret(null)).toBe(false);
    expect(verifyModerationSecret(123)).toBe(false);
    expect(verifyModerationSecret({ secret: SECRET })).toBe(false);
    expect(verifyModerationSecret("")).toBe(false);
  });

  it("未設定密語時任何輸入都 false", () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    expect(verifyModerationSecret("")).toBe(false);
    expect(verifyModerationSecret(SECRET)).toBe(false);
  });
});

describe("moderationSessionToken", () => {
  it("cookie 內容不含密語本身", () => {
    const token = moderationSessionToken();
    expect(token).toHaveLength(64);
    expect(token).not.toContain(SECRET);
  });

  it("密語輪替後 token 改變（舊 session 立即失效）", () => {
    const before = moderationSessionToken();
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "rotated-secret");
    expect(moderationSessionToken()).not.toBe(before);
  });

  it("未設定密語時回空字串", () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    expect(moderationSessionToken()).toBe("");
  });
});

describe("buildModerationSessionCookie", () => {
  it("非 production 帶 HttpOnly／SameSite=Lax／Path=/，但不帶 Secure", () => {
    const cookie = buildModerationSessionCookie();

    expect(cookie.startsWith(`${FEEDBACK_MOD_COOKIE}=`)).toBe(true);
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");
    expect(cookie).toContain("Path=/");
    expect(cookie).toContain("Max-Age=28800");
    expect(cookie).not.toContain("Secure");
    expect(cookie).not.toContain(SECRET);
  });

  it("production 加上 Secure", () => {
    vi.stubEnv("VERCEL_ENV", "production");
    expect(buildModerationSessionCookie()).toContain("Secure");
  });

  it("登出 cookie 立即過期且清空值", () => {
    const cookie = buildModerationLogoutCookie();
    expect(cookie).toContain(`${FEEDBACK_MOD_COOKIE}=;`);
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });
});

describe("readCookieValue", () => {
  it("從多個 cookie 中取出指定名稱", () => {
    expect(readCookieValue("a=1; cc_feedback_mod=abc; b=2", FEEDBACK_MOD_COOKIE)).toBe(
      "abc",
    );
    expect(readCookieValue("a=1", FEEDBACK_MOD_COOKIE)).toBeNull();
    expect(readCookieValue(null, FEEDBACK_MOD_COOKIE)).toBeNull();
  });

  it("不會被前綴相同的 cookie 名稱騙到", () => {
    expect(
      readCookieValue("xcc_feedback_mod=evil", FEEDBACK_MOD_COOKIE),
    ).toBeNull();
  });
});

describe("hasModerationSession", () => {
  it("token 相符才算已登入", () => {
    const token = moderationSessionToken();
    expect(
      hasModerationSession(sessionRequest(`${FEEDBACK_MOD_COOKIE}=${token}`)),
    ).toBe(true);
    expect(hasModerationSession(sessionRequest(`${FEEDBACK_MOD_COOKIE}=nope`))).toBe(
      false,
    );
    expect(hasModerationSession(sessionRequest(null))).toBe(false);
  });

  it("拿密語本身當 cookie 值不算登入", () => {
    expect(
      hasModerationSession(sessionRequest(`${FEEDBACK_MOD_COOKIE}=${SECRET}`)),
    ).toBe(false);
  });

  it("未設定密語時一律 false（避免空 token 對空 cookie）", () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    expect(hasModerationSession(sessionRequest(`${FEEDBACK_MOD_COOKIE}=`))).toBe(false);
  });
});

describe("isSameOriginRequest", () => {
  it("Origin 與 Host 同源才通過", () => {
    expect(
      isSameOriginRequest(sessionRequest(null, { origin: "http://localhost" })),
    ).toBe(true);
    expect(
      isSameOriginRequest(sessionRequest(null, { origin: "https://evil.example" })),
    ).toBe(false);
  });

  it("沒有 Origin 時退回 Referer", () => {
    expect(
      isSameOriginRequest(
        sessionRequest(null, { referer: "http://localhost/studio/feedback" }),
      ),
    ).toBe(true);
    expect(
      isSameOriginRequest(sessionRequest(null, { referer: "https://evil.example/x" })),
    ).toBe(false);
  });

  it("Origin 與 Referer 都沒有就當跨站", () => {
    expect(isSameOriginRequest(sessionRequest(null))).toBe(false);
  });

  it("Origin: null（sandbox iframe）不算同源", () => {
    expect(isSameOriginRequest(sessionRequest(null, { origin: "null" }))).toBe(false);
  });
});

describe("guardModerationRequest", () => {
  const cookie = () => `${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}`;

  it("未設定密語回 503 not_configured", () => {
    vi.stubEnv("FEEDBACK_MODERATION_SECRET", "");
    expect(guardModerationRequest(sessionRequest(null))).toEqual({
      ok: false,
      status: 503,
      reason: "not_configured",
    });
  });

  it("無 cookie 回 401 unauthorized", () => {
    expect(guardModerationRequest(sessionRequest(null))).toEqual({
      ok: false,
      status: 401,
      reason: "unauthorized",
    });
  });

  it("已登入的 GET 通過", () => {
    expect(guardModerationRequest(sessionRequest(cookie()))).toEqual({ ok: true });
  });

  it("mutation 跨站回 403 cross_origin", () => {
    const request = sessionRequest(cookie(), { origin: "https://evil.example" });
    expect(guardModerationRequest(request, { requireSameOrigin: true })).toEqual({
      ok: false,
      status: 403,
      reason: "cross_origin",
    });
  });

  it("未登入的 mutation 回 401（不是 403）", () => {
    const request = sessionRequest(null, { origin: "https://evil.example" });
    expect(guardModerationRequest(request, { requireSameOrigin: true })).toMatchObject({
      status: 401,
    });
  });
});

describe("checkModerationLoginRateLimit", () => {
  it("同 IP 第 6 次被擋", async () => {
    for (let i = 0; i < 5; i += 1) {
      await expect(checkModerationLoginRateLimit("203.0.113.9")).resolves.toEqual({
        ok: true,
      });
    }

    const blocked = await checkModerationLoginRateLimit("203.0.113.9");
    expect(blocked).toMatchObject({ ok: false, reason: "rate_limited" });
  });

  it("production 無 Upstash 時 fail closed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkModerationLoginRateLimit("203.0.113.10")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});
