import { NextResponse } from "next/server";
import { confirmSubscriber, isSubscribeDbConfigured } from "@/lib/subscribe-db";
import { hashSubscribeToken } from "@/lib/subscribe-tokens";

export async function GET(request: Request): Promise<NextResponse> {
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
  return NextResponse.redirect(target);
}
