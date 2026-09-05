import { NextResponse } from "next/server";
import { isFeedbackDbConfigured, type FeedbackPublicDto } from "@/lib/feedback-db";
import {
  checkFeedbackEmailRateLimit,
  checkFeedbackIpRateLimit,
} from "@/lib/feedback-rate-limit";
import { createFeedbackMessage, listPublishedFeedback } from "@/lib/feedback-query";
import { feedbackBodySchema } from "@/lib/feedback-schema";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import { requestIp } from "@/lib/request-ip";

// 公開牆是使用者投稿內容，且審核狀態隨時變動：一律不快取。
const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * 最後一道白名單：即使上游多帶欄位（例如 email），公開 JSON 也只會有
 * id／nickname／message／createdAt 四個欄位。
 */
function toPublicPayload(messages: readonly FeedbackPublicDto[]): FeedbackPublicDto[] {
  return messages.map((item) => ({
    id: item.id,
    nickname: item.nickname,
    message: item.message,
    createdAt: item.createdAt,
  }));
}

export async function GET(): Promise<NextResponse> {
  if (!isFeedbackDbConfigured()) {
    return NextResponse.json({ available: false, messages: [] }, { headers: NO_STORE });
  }

  try {
    const messages = await listPublishedFeedback();
    return NextResponse.json(
      { available: true, messages: toPublicPayload(messages) },
      { headers: NO_STORE },
    );
  } catch {
    // DB 故障時牆呈空狀態並讓表單改走 mailto 降級，不讓整頁 500。
    return NextResponse.json({ available: false, messages: [] }, { headers: NO_STORE });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isFeedbackDbConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "db_unavailable" },
      { status: 503, headers: NO_STORE },
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

  const parsed = feedbackBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "validation_error" },
      { status: 400, headers: NO_STORE },
    );
  }

  // IP 先擋洗版，再用 sha256(email) 擋換 IP 重送；production 無 Upstash 一律 fail closed。
  const ipRate = await checkFeedbackIpRateLimit(requestIp(request));
  if (!ipRate.ok) return rateLimitResponse(ipRate);

  const emailRate = await checkFeedbackEmailRateLimit(parsed.data.email);
  if (!emailRate.ok) return rateLimitResponse(emailRate);

  try {
    await createFeedbackMessage({
      nickname: parsed.data.nickname,
      email: parsed.data.email,
      message: parsed.data.message,
      // 同意版本與時間由 server 寫入，不採信 client。
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: new Date(),
    });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "db_error" },
      { status: 500, headers: NO_STORE },
    );
  }

  // 先審後發：回 201 只代表收件成功，尚未上牆。
  return NextResponse.json({ ok: true }, { status: 201, headers: NO_STORE });
}

type RateLimitFailure = Exclude<
  Awaited<ReturnType<typeof checkFeedbackIpRateLimit>>,
  { ok: true }
>;

function rateLimitResponse(rate: RateLimitFailure): NextResponse {
  if (rate.reason === "unavailable") {
    return NextResponse.json(
      { ok: false, reason: "db_unavailable" },
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
