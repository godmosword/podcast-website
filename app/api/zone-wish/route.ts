import { NextResponse } from "next/server";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import { insertZoneWish, isZoneWishDbConfigured } from "@/lib/zone-wish-db";
import { checkZoneWishRateLimit } from "@/lib/zone-wish-rate-limit";
import { zoneWishBodySchema } from "@/lib/zone-wish-schema";

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ available: isZoneWishDbConfigured() });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isZoneWishDbConfigured()) {
    return NextResponse.json({ ok: false, reason: "db_unavailable" }, { status: 503 });
  }

  const ip = clientIp(request);
  const rate = checkZoneWishRateLimit(ip);
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

  const parsed = zoneWishBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "validation_error" }, { status: 400 });
  }

  try {
    await insertZoneWish({
      zoneId: parsed.data.zoneId,
      category: parsed.data.category,
      message: parsed.data.message ?? null,
      email: parsed.data.email ?? null,
      nickname: parsed.data.nickname ?? null,
      consentVersion: LEGAL_POLICY_VERSION,
      consentedAt: new Date(),
    });
  } catch {
    return NextResponse.json({ ok: false, reason: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
