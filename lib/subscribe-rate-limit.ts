import {
  checkDistributedRateLimit,
  resetLocalRateLimits,
  type RateLimitResult,
} from "./distributed-rate-limit";

export function resetSubscribeRateLimits(): void {
  resetLocalRateLimits();
}

export async function checkSubscribeRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  return checkDistributedRateLimit(ip, {
    keyPrefix: "subscribe-ip",
    limit: 5,
    windowSeconds: 60 * 60,
  });
}
