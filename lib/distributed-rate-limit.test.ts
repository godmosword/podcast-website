import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkDistributedRateLimit,
  resetLocalRateLimits,
} from "./distributed-rate-limit";

describe("checkDistributedRateLimit", () => {
  beforeEach(() => {
    resetLocalRateLimits();
    vi.unstubAllEnvs();
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("local/test fallback enforces a shared key window", async () => {
    const config = { keyPrefix: "test", limit: 2, windowSeconds: 60 };

    await expect(checkDistributedRateLimit("same-client", config)).resolves.toEqual({ ok: true });
    await expect(checkDistributedRateLimit("same-client", config)).resolves.toEqual({ ok: true });
    await expect(checkDistributedRateLimit("same-client", config)).resolves.toMatchObject({
      ok: false,
      reason: "rate_limited",
    });
    await expect(checkDistributedRateLimit("other-client", config)).resolves.toEqual({ ok: true });
  });

  it("production without Upstash fails closed instead of using per-instance memory", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await expect(
      checkDistributedRateLimit("client", {
        keyPrefix: "test",
        limit: 2,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("uses one atomic Upstash EVAL request and does not send the raw identifier", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com/");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token");
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([{ result: [3, 42] }]), { status: 200 }),
      );

    const result = await checkDistributedRateLimit("parent@example.com", {
      keyPrefix: "subscribe",
      limit: 2,
      windowSeconds: 60,
    });

    expect(result).toEqual({ ok: false, reason: "rate_limited", retryAfterSec: 42 });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://redis.example.com/pipeline",
      expect.objectContaining({
        method: "POST",
        body: expect.not.stringContaining("parent@example.com"),
      }),
    );
  });

  it("treats an Upstash failure as unavailable", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.com");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("", { status: 503 }));

    await expect(
      checkDistributedRateLimit("client", {
        keyPrefix: "test",
        limit: 2,
        windowSeconds: 60,
      }),
    ).resolves.toEqual({ ok: false, reason: "unavailable" });
  });
});
