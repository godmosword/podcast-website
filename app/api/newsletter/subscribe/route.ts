import { NextResponse } from "next/server";
import {
  NEWSLETTER_HONEYPOT_FIELD,
  subscribeToNewsletter,
} from "@/lib/newsletter-subscribe";

export async function POST(request: Request): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, reason: "invalid_email" }, { status: 400 });
  }
  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const result = await subscribeToNewsletter({
    email: record.email,
    honeypot: record[NEWSLETTER_HONEYPOT_FIELD],
  });
  if (!result.ok) {
    const status = result.reason === "invalid_email" ? 400 : result.reason === "unavailable" ? 503 : 502;
    return NextResponse.json(result, { status });
  }
  return NextResponse.json(result);
}
