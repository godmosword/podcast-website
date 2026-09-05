import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkFeedbackEmailRateLimit,
  checkFeedbackIpRateLimit,
  hashFeedbackEmail,
  resetFeedbackRateLimits,
} from "./feedback-rate-limit";

beforeEach(() => {
  resetFeedbackRateLimits();
});

afterEach(() => {
  resetFeedbackRateLimits();
  vi.unstubAllEnvs();
});

describe("checkFeedbackIpRateLimit", () => {
  it("同一 IP 每小時 10 則，第 11 則被擋", async () => {
    for (let i = 0; i < 10; i += 1) {
      await expect(checkFeedbackIpRateLimit("203.0.113.9")).resolves.toEqual({ ok: true });
    }

    const blocked = await checkFeedbackIpRateLimit("203.0.113.9");
    expect(blocked.ok).toBe(false);
    expect(blocked.ok === false && blocked.reason).toBe("rate_limited");
    expect(blocked.ok === false && blocked.reason === "rate_limited" && blocked.retryAfterSec)
      .toBeGreaterThan(0);
  });

  it("不同 IP 各自計數", async () => {
    for (let i = 0; i < 10; i += 1) {
      await checkFeedbackIpRateLimit("203.0.113.1");
    }
    await expect(checkFeedbackIpRateLimit("203.0.113.2")).resolves.toEqual({ ok: true });
  });

  it("production 無 Upstash 時 fail closed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkFeedbackIpRateLimit("203.0.113.3")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("checkFeedbackEmailRateLimit", () => {
  it("同一 email 每 24 小時 3 則，第 4 則被擋", async () => {
    for (let i = 0; i < 3; i += 1) {
      await expect(checkFeedbackEmailRateLimit("parent@example.com")).resolves.toEqual({
        ok: true,
      });
    }

    const blocked = await checkFeedbackEmailRateLimit("parent@example.com");
    expect(blocked.ok).toBe(false);
    expect(blocked.ok === false && blocked.reason).toBe("rate_limited");
  });

  it("大小寫與空白視為同一個 email", async () => {
    await checkFeedbackEmailRateLimit("parent@example.com");
    await checkFeedbackEmailRateLimit("  Parent@Example.COM ");
    await checkFeedbackEmailRateLimit("PARENT@EXAMPLE.COM");

    const blocked = await checkFeedbackEmailRateLimit("parent@example.com");
    expect(blocked.ok).toBe(false);
  });

  it("不同 email 各自計數", async () => {
    for (let i = 0; i < 3; i += 1) {
      await checkFeedbackEmailRateLimit("parent@example.com");
    }
    await expect(checkFeedbackEmailRateLimit("other@example.com")).resolves.toEqual({
      ok: true,
    });
  });

  it("production 無 Upstash 時 fail closed", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");

    await expect(checkFeedbackEmailRateLimit("parent@example.com")).resolves.toEqual({
      ok: false,
      reason: "unavailable",
    });
  });
});

describe("hashFeedbackEmail", () => {
  it("回傳 sha256 hex，且不含原始 email", () => {
    const hash = hashFeedbackEmail("parent@example.com");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("parent@example.com");
    expect(hashFeedbackEmail(" PARENT@example.com ")).toBe(hash);
  });
});

describe("resetFeedbackRateLimits", () => {
  it("清掉計數後可再送", async () => {
    for (let i = 0; i < 10; i += 1) {
      await checkFeedbackIpRateLimit("203.0.113.4");
    }
    expect((await checkFeedbackIpRateLimit("203.0.113.4")).ok).toBe(false);

    resetFeedbackRateLimits();

    await expect(checkFeedbackIpRateLimit("203.0.113.4")).resolves.toEqual({ ok: true });
  });
});
