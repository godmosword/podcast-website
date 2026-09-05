import { createHash } from "node:crypto";
import {
  checkDistributedRateLimit,
  resetLocalRateLimits,
  type RateLimitResult,
} from "./distributed-rate-limit";

/** 測試用：清掉本機（非 production）計數桶。 */
export function resetFeedbackRateLimits(): void {
  resetLocalRateLimits();
}

/** 同一 IP 每小時 10 則。 */
export async function checkFeedbackIpRateLimit(ip: string): Promise<RateLimitResult> {
  return checkDistributedRateLimit(ip, {
    keyPrefix: "feedback-ip",
    limit: 10,
    windowSeconds: 60 * 60,
  });
}

/** email 不落地成 key：先正規化再 sha256。 */
export function hashFeedbackEmail(email: string): string {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
}

/** 同一 email 每 24 小時 3 則。 */
export async function checkFeedbackEmailRateLimit(email: string): Promise<RateLimitResult> {
  return checkDistributedRateLimit(hashFeedbackEmail(email), {
    keyPrefix: "feedback-email",
    limit: 3,
    windowSeconds: 24 * 60 * 60,
  });
}
