import { NextResponse } from "next/server";
import { requestIp } from "@/lib/request-ip";
import { LEGAL_POLICY_VERSION } from "@/lib/legal-policy";
import { insertZoneWish, isZoneWishDbConfigured } from "@/lib/zone-wish-db";
import { checkZoneWishRateLimit } from "@/lib/zone-wish-rate-limit";
import { zoneWishBodySchema } from "@/lib/zone-wish-schema";

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({ available: isZoneWishDbConfigured() });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!isZoneWishDbConfigured()) {
    return NextResponse.json({ ok: false, reason: "db_unavailable" }, { status: 503 });
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

  const rate = await checkZoneWishRateLimit(requestIp(request));
  if (!rate.ok) {
    if (rate.reason === "unavailable") {
      return NextResponse.json({ ok: false, reason: "db_unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, reason: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
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
