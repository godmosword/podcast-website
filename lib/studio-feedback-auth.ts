import { createHash, timingSafeEqual } from "node:crypto";
import {
  checkDistributedRateLimit,
  resetLocalRateLimits,
  type RateLimitResult,
} from "@/lib/distributed-rate-limit";

/**
 * `/studio/feedback` 後台的獨立密語保護：與 `/studio` 首頁無關，
 * 也不依賴 robots／notFound。密語只在 server 端讀取，永不進 client bundle。
 */

/**
 * session cookie 名稱。頁面在 `/studio/feedback`、API 在 `/api/studio/feedback`，
 * 單一 Path 涵蓋不到兩者，因此用 Path=/ ＋明確名稱，並在每個 handler 自行驗證。
 */
export const FEEDBACK_MOD_COOKIE = "cc_feedback_mod";

/** session 有效期：8 小時，避免共用電腦長期留存。 */
export const FEEDBACK_MOD_MAX_AGE_SEC = 8 * 60 * 60;

/** 登入失敗鎖定：同 IP 每 15 分鐘 5 次。 */
export const FEEDBACK_MOD_LOGIN_LIMIT = 5;
export const FEEDBACK_MOD_LOGIN_WINDOW_SEC = 15 * 60;

const TOKEN_NAMESPACE = "chechecar:feedback-moderation:v1";

function readSecret(): string {
  return process.env.FEEDBACK_MODERATION_SECRET?.trim() ?? "";
}

/** 未設定 `FEEDBACK_MODERATION_SECRET` 時，後台頁顯示提示、API 一律 503。 */
export function isFeedbackModerationConfigured(): boolean {
  return readSecret().length > 0;
}

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

/** 先各自 sha256 再比：長度恆為 32 bytes，timingSafeEqual 不會因長度差異提前洩漏。 */
function constantTimeEquals(a: string, b: string): boolean {
  return timingSafeEqual(sha256(a), sha256(b));
}

/** 比對使用者輸入的密語；未設定 secret 一律 false。 */
export function verifyModerationSecret(input: unknown): boolean {
  const secret = readSecret();
  if (!secret) return false;
  if (typeof input !== "string" || input.length === 0) return false;
  return constantTimeEquals(input, secret);
}

/**
 * cookie 內容不是密語本身，而是由密語衍生的 token；
 * 即使 cookie 外洩也拿不回原密語，且輪替密語會讓所有 session 立即失效。
 */
export function moderationSessionToken(): string {
  const secret = readSecret();
  if (!secret) return "";
  return createHash("sha256").update(`${TOKEN_NAMESPACE}:${secret}`).digest("hex");
}

function cookieAttributes(maxAgeSec: number): string {
  const parts = [`Path=/`, `Max-Age=${maxAgeSec}`, "HttpOnly", "SameSite=Lax"];
  // 本機 http 開發不能加 Secure，否則瀏覽器不會存下 cookie。
  if (isProductionRuntime()) parts.push("Secure");
  return parts.join("; ");
}

/** 登入成功後的 Set-Cookie。 */
export function buildModerationSessionCookie(): string {
  return `${FEEDBACK_MOD_COOKIE}=${moderationSessionToken()}; ${cookieAttributes(
    FEEDBACK_MOD_MAX_AGE_SEC,
  )}`;
}

/** 登出用：同屬性、Max-Age=0。 */
export function buildModerationLogoutCookie(): string {
  return `${FEEDBACK_MOD_COOKIE}=; ${cookieAttributes(0)}`;
}

/** 從 Cookie 標頭取單一 cookie 值；找不到回 null。 */
export function readCookieValue(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    return part.slice(index + 1).trim();
  }
  return null;
}

/** 是否帶有有效的審核 session cookie。 */
export function hasModerationSession(request: Request): boolean {
  const expected = moderationSessionToken();
  if (!expected) return false;
  const actual = readCookieValue(request.headers.get("cookie"), FEEDBACK_MOD_COOKIE);
  if (!actual) return false;
  return constantTimeEquals(actual, expected);
}

/**
 * mutation 的 CSRF 防線：Origin（缺少時退回 Referer）必須與 Host 同源。
 * 兩者都沒有就視為不同源，直接擋掉。
 */
export function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get("host")?.trim();
  if (!host) return false;

  const origin = request.headers.get("origin")?.trim();
  const source =
    origin && origin !== "null" ? origin : request.headers.get("referer")?.trim();
  if (!source) return false;

  try {
    return new URL(source).host === host;
  } catch {
    return false;
  }
}

export type ModerationGuardFailure = {
  ok: false;
  status: 401 | 403 | 503;
  reason: "not_configured" | "unauthorized" | "cross_origin";
};

export type ModerationGuardResult = { ok: true } | ModerationGuardFailure;

/**
 * 三道共用檢查：未設定密語 → 503；未登入 → 401；mutation 跨站 → 403。
 * 先判 401 再判 403，未登入的 curl 也會拿到一致的 401。
 */
export function guardModerationRequest(
  request: Request,
  options: { requireSameOrigin?: boolean } = {},
): ModerationGuardResult {
  if (!isFeedbackModerationConfigured()) {
    return { ok: false, status: 503, reason: "not_configured" };
  }
  if (!hasModerationSession(request)) {
    return { ok: false, status: 401, reason: "unauthorized" };
  }
  if (options.requireSameOrigin && !isSameOriginRequest(request)) {
    return { ok: false, status: 403, reason: "cross_origin" };
  }
  return { ok: true };
}

/** 登入嘗試的分散式節流；production 無 Upstash 會 fail closed（unavailable）。 */
export async function checkModerationLoginRateLimit(ip: string): Promise<RateLimitResult> {
  return checkDistributedRateLimit(ip, {
    keyPrefix: "feedback-mod-login",
    limit: FEEDBACK_MOD_LOGIN_LIMIT,
    windowSeconds: FEEDBACK_MOD_LOGIN_WINDOW_SEC,
  });
}

/** 測試用：清掉本機（非 production）計數桶。 */
export function resetModerationLoginRateLimits(): void {
  resetLocalRateLimits();
}
