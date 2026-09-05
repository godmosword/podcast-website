import { createFeedbackMessage } from "@/lib/feedback-query";
import {
  checkFeedbackEmailRateLimit,
  checkFeedbackIpRateLimit,
} from "@/lib/feedback-rate-limit";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";

export type PersistFeedbackResult =
  | { ok: true }
  | { ok: false; reason: "rate_limited"; retryAfterSec: number }
  | { ok: false; reason: "unavailable" }
  | { ok: false; reason: "db_error" };

/**
 * API 與 Server Action 共用的收件路徑：IP／信箱節流後寫 pending。
 * 蜜罐與最短填寫時間只存在 Action，不走這裡。
 */
export async function persistFeedbackSubmission(input: {
  nickname: string;
  email: string;
  message: string;
  ip: string;
}): Promise<PersistFeedbackResult> {
  const ipRate = await checkFeedbackIpRateLimit(input.ip);
  if (!ipRate.ok) {
    return ipRate.reason === "unavailable"
      ? { ok: false, reason: "unavailable" }
      : { ok: false, reason: "rate_limited", retryAfterSec: ipRate.retryAfterSec };
  }

  const emailRate = await checkFeedbackEmailRateLimit(input.email);
  if (!emailRate.ok) {
    return emailRate.reason === "unavailable"
      ? { ok: false, reason: "unavailable" }
      : { ok: false, reason: "rate_limited", retryAfterSec: emailRate.retryAfterSec };
  }

  try {
    await createFeedbackMessage({
      nickname: input.nickname,
      email: input.email,
      message: input.message,
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: new Date(),
    });
  } catch {
    return { ok: false, reason: "db_error" };
  }

  return { ok: true };
}
