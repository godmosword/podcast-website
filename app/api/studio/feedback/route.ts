import { NextResponse } from "next/server";
import { listFeedbackForModeration } from "@/lib/feedback-admin";
import { isFeedbackDbConfigured } from "@/lib/feedback-db";
import { guardModerationRequest } from "@/lib/studio-feedback-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

/**
 * `GET /api/studio/feedback`：已驗證審核者才拿得到聚合＋完整列表（含 email）。
 * 未登入一律 401，且不透露任何留言內容。
 */
export async function GET(request: Request): Promise<NextResponse> {
  const guard = guardModerationRequest(request);
  if (!guard.ok) {
    return NextResponse.json(
      { ok: false, reason: guard.reason },
      { status: guard.status, headers: NO_STORE },
    );
  }

  if (!isFeedbackDbConfigured()) {
    return NextResponse.json(
      { ok: false, reason: "db_unavailable" },
      { status: 503, headers: NO_STORE },
    );
  }

  try {
    const { stats, messages } = await listFeedbackForModeration();
    return NextResponse.json({ ok: true, stats, messages }, { headers: NO_STORE });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "db_error" },
      { status: 500, headers: NO_STORE },
    );
  }
}
