import { createHash } from "node:crypto";

type RateLimitConfig = {
  keyPrefix: string;
  limit: number;
  windowSeconds: number;
};

export type RateLimitResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited"; retryAfterSec: number }
  | { ok: false; reason: "unavailable" };

type Bucket = { count: number; resetAt: number };

const localBuckets = new Map<string, Bucket>();

const UPSTASH_SCRIPT = `
local count = redis.call("INCR", KEYS[1])
if count == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
return { count, redis.call("TTL", KEYS[1]) }
`;

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function localRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const bucket = localBuckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    localBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      reason: "rate_limited",
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

function hashedKey(prefix: string, identifier: string): string {
  const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 32);
  return `chechecar:ratelimit:${prefix}:${digest}`;
}

async function upstashRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim().replace(/\/$/, "");
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return { ok: false, reason: "unavailable" };

  try {
    const response = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([["EVAL", UPSTASH_SCRIPT, "1", key, String(windowSeconds)]]),
      signal: AbortSignal.timeout(2_000),
    });
    if (!response.ok) return { ok: false, reason: "unavailable" };

    const payload: unknown = await response.json();
    const result = Array.isArray(payload)
      ? (payload[0] as { result?: unknown } | undefined)?.result
      : undefined;
    const count = Array.isArray(result) ? Number(result[0]) : Number.NaN;
    const ttl = Array.isArray(result) ? Number(result[1]) : Number.NaN;
    if (!Number.isFinite(count) || !Number.isFinite(ttl)) {
      return { ok: false, reason: "unavailable" };
    }

    if (count > limit) {
      return {
        ok: false,
        reason: "rate_limited",
        retryAfterSec: Math.max(1, Math.ceil(ttl > 0 ? ttl : windowSeconds)),
      };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

export async function checkDistributedRateLimit(
  identifier: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const key = hashedKey(config.keyPrefix, identifier);
  const hasUpstashConfig = Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );

  if (hasUpstashConfig) {
    return upstashRateLimit(key, config.limit, config.windowSeconds);
  }

  // Production must never silently fall back to a per-instance limiter.
  if (isProductionRuntime()) return { ok: false, reason: "unavailable" };
  return localRateLimit(key, config.limit, config.windowSeconds);
}

export function resetLocalRateLimits(): void {
  localBuckets.clear();
}
