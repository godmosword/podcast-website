import { NextResponse } from "next/server";
import { requestIp } from "@/lib/request-ip";
import { checkDistributedRateLimit } from "@/lib/distributed-rate-limit";
import { confirmSubscriber, isSubscribeDbConfigured } from "@/lib/subscribe-db";
import { hashSubscribeToken } from "@/lib/subscribe-tokens";

export async function GET(request: Request): Promise<NextResponse> {
  const rate = await checkDistributedRateLimit(requestIp(request), {
    keyPrefix: "subscribe-confirm-ip",
    limit: 30,
    windowSeconds: 10 * 60,
  });
  if (!rate.ok) {
    if (rate.reason === "unavailable") {
      return NextResponse.json({ ok: false, reason: "confirm_unavailable" }, { status: 503 });
    }
    return NextResponse.json(
      { ok: false, reason: "rate_limited", retryAfterSec: rate.retryAfterSec },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  const token = new URL(request.url).searchParams.get("token")?.trim();
  let confirmed = false;

  if (token && isSubscribeDbConfigured()) {
    try {
      confirmed = await confirmSubscriber(hashSubscribeToken(token));
    } catch {
      confirmed = false;
    }
  }

  const target = new URL("/subscribe/confirmed", request.url);
  target.searchParams.set("status", confirmed ? "ok" : "invalid");
  return NextResponse.redirect(target, { headers: { "Cache-Control": "no-store" } });
}
