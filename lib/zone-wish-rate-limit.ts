import {
  checkDistributedRateLimit,
  resetLocalRateLimits,
  type RateLimitResult,
} from "./distributed-rate-limit";

export function resetZoneWishRateLimits(): void {
  resetLocalRateLimits();
}

export async function checkZoneWishRateLimit(
  ip: string,
): Promise<RateLimitResult> {
  return checkDistributedRateLimit(ip, {
    keyPrefix: "zone-wish-ip",
    limit: 10,
    windowSeconds: 60 * 60,
  });
}
