import { NextResponse } from "next/server";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import {
  isSubscribeDbConfigured,
  upsertPendingSubscriber,
} from "@/lib/subscribe-db";
import { checkSubscribeRateLimit } from "@/lib/subscribe-rate-limit";
import { subscribeBodySchema } from "@/lib/subscribe-schema";
import {
  isSubscribeEmailConfigured,
  sendSubscribeConfirmation,
} from "@/lib/subscribe-email";
import { createSubscribeToken } from "@/lib/subscribe-tokens";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    available: isSubscribeDbConfigured() && isSubscribeEmailConfigured(),
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSubscribeDbConfigured() || !isSubscribeEmailConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "subscribe_unavailable" },
      { status: 503 },
    );
  }

  const ip = clientIp(request);
  const rate = checkSubscribeRateLimit(ip);
  if (!rate.ok) {
    return NextResponse.json(
      { ok: false, reason: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_json" }, { status: 400 });
  }

  const parsed = subscribeBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "validation_error" }, { status: 400 });
  }

  try {
    const { token, tokenHash } = createSubscribeToken();
    const state = await upsertPendingSubscriber({
      email: parsed.data.email,
      source: parsed.data.source ?? null,
      tokenHash,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: new Date(),
    });
    if (state === "pending") {
      await sendSubscribeConfirmation({ email: parsed.data.email, token });
    }
  } catch {
    return NextResponse.json({ ok: false, reason: "subscribe_unavailable" }, { status: 503 });
  }

  // 確認前一律回相同結果，避免枚舉 email 是否已存在。
  return NextResponse.json({ ok: true, requiresConfirmation: true }, { status: 202 });
}
