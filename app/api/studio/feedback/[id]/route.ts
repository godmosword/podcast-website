import { NextResponse } from "next/server";
import { z } from "zod";
import {
  deleteFeedbackMessage,
  parseFeedbackId,
  toAdminDto,
  updateFeedbackMessage,
} from "@/lib/feedback-admin";
import { isFeedbackDbConfigured } from "@/lib/feedback-db";
import { FEEDBACK_KINDS, FEEDBACK_STATUSES } from "@/lib/feedback-schema";
import { guardModerationRequest } from "@/lib/studio-feedback-auth";

const NO_STORE = { "Cache-Control": "no-store" } as const;

type RouteContext = { params: Promise<{ id: string }> };

// status／kind 都只收白名單值；其他欄位（暱稱、正文、email）後台不得改寫。
const patchSchema = z
  .object({
    status: z.enum(FEEDBACK_STATUSES).optional(),
    kind: z.enum(FEEDBACK_KINDS).optional(),
  })
  .strip()
  .refine((value) => value.status !== undefined || value.kind !== undefined, {
    error: "至少要帶 status 或 kind",
  });

function fail(status: number, reason: string): NextResponse {
  return NextResponse.json({ ok: false, reason }, { status, headers: NO_STORE });
}

/** 共用前置：密語未設定 503、未登入 401、跨站 mutation 403、id 不合法 400、無 DB 503。 */
async function precheck(
  request: Request,
  context: RouteContext,
): Promise<{ ok: true; id: string } | { ok: false; response: NextResponse }> {
  const guard = guardModerationRequest(request, { requireSameOrigin: true });
  if (!guard.ok) {
    return { ok: false, response: fail(guard.status, guard.reason) };
  }

  const { id: rawId } = await context.params;
  const id = parseFeedbackId(rawId);
  if (!id) {
    return { ok: false, response: fail(400, "invalid_id") };
  }

  if (!isFeedbackDbConfigured()) {
    return { ok: false, response: fail(503, "db_unavailable") };
  }

  return { ok: true, id };
}

/** `PATCH`：核准（published）／隱藏（hidden）／退回待審（pending）與 kind 改標。 */
export async function PATCH(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const pre = await precheck(request, context);
  if (!pre.ok) return pre.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail(400, "invalid_json");
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return fail(400, "validation_error");
  }

  try {
    const result = await updateFeedbackMessage(pre.id, parsed.data);
    if (!result.ok) {
      return fail(result.reason === "not_found" ? 404 : 409, result.reason);
    }
    return NextResponse.json(
      { ok: true, message: toAdminDto(result.row) },
      { headers: NO_STORE },
    );
  } catch {
    return fail(500, "db_error");
  }
}

/** `DELETE`：硬刪，暱稱／email／正文一併移除。 */
export async function DELETE(
  request: Request,
  context: RouteContext,
): Promise<NextResponse> {
  const pre = await precheck(request, context);
  if (!pre.ok) return pre.response;

  try {
    const deleted = await deleteFeedbackMessage(pre.id);
    if (!deleted) return fail(404, "not_found");
    return NextResponse.json({ ok: true, id: pre.id }, { headers: NO_STORE });
  } catch {
    return fail(500, "db_error");
  }
}
