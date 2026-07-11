import { NextResponse } from "next/server";
import { insertSubscriber, isSubscribeDbConfigured } from "@/lib/subscribe-db";
import { checkSubscribeRateLimit } from "@/lib/subscribe-rate-limit";
import { subscribeBodySchema } from "@/lib/subscribe-schema";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ available: isSubscribeDbConfigured() });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isSubscribeDbConfigured()) {
    return NextResponse.json({ ok: false, reason: "db_unavailable" }, { status: 503 });
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
    await insertSubscriber({
      email: parsed.data.email,
      source: parsed.data.source ?? null,
      userAgent: request.headers.get("user-agent"),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  // 重複 email 亦回 201，避免枚舉。
  return NextResponse.json({ ok: true }, { status: 201 });
}
