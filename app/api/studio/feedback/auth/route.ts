import { NextResponse } from "next/server";
import { requestIp } from "@/lib/request-ip";
import {
  buildModerationLogoutCookie,
  buildModerationSessionCookie,
  checkModerationLoginRateLimit,
  isFeedbackModerationConfigured,
  isSameOriginRequest,
  verifyModerationSecret,
} from "@/lib/studio-feedback-auth";

// 後台登入回應一律不快取，也不得被中介層留存。
const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * `POST /api/studio/feedback/auth`：以密語換取 HttpOnly session cookie。
 * `DELETE`：清掉 cookie 登出。
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!isFeedbackModerationConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "not_configured" },
      { status: 503, headers: NO_STORE },
    );
  }

  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, reason: "cross_origin" },
      { status: 403, headers: NO_STORE },
    );
  }

  // 每次嘗試都計數（含成功），5 次／15 分鐘；production 無 Upstash 一律 fail closed。
  const rate = await checkModerationLoginRateLimit(requestIp(request));
  if (!rate.ok) {
    if (rate.reason === "unavailable") {
      return NextResponse.json(
        { ok: false, reason: "unavailable" },
        { status: 503, headers: NO_STORE },
      );
    }
    return NextResponse.json(
      { ok: false, reason: "rate_limited", retryAfterSec: rate.retryAfterSec },
      {
        status: 429,
        headers: { ...NO_STORE, "Retry-After": String(rate.retryAfterSec) },
      },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "invalid_json" },
      { status: 400, headers: NO_STORE },
    );
  }

  const secret = (body as { secret?: unknown } | null)?.secret;
  if (!verifyModerationSecret(secret)) {
    // 密語錯誤不設 cookie，也不回報任何可辨識訊息。
    return NextResponse.json(
      { ok: false, reason: "invalid_secret" },
      { status: 401, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { ...NO_STORE, "Set-Cookie": buildModerationSessionCookie() },
    },
  );
}

export async function DELETE(request: Request): Promise<NextResponse> {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { ok: false, reason: "cross_origin" },
      { status: 403, headers: NO_STORE },
    );
  }

  return NextResponse.json(
    { ok: true },
    {
      status: 200,
      headers: { ...NO_STORE, "Set-Cookie": buildModerationLogoutCookie() },
    },
  );
}
