import { neon } from "@neondatabase/serverless";
import type { FeedbackKind, FeedbackStatus } from "@/lib/feedback-schema";

/**
 * 後台審核專用的資料層：只有通過 `/studio/feedback` 密語驗證的 handler 可以呼叫。
 * 公開層（`lib/feedback-db.ts`／`lib/feedback-query.ts`）不引用本檔，
 * 公開 DTO 的四欄白名單不受影響。
 */

/** 後台列所需欄位；SQL 一律明確列出，禁止 SELECT *。 */
export const FEEDBACK_ADMIN_COLUMNS = [
  "id",
  "nickname",
  "email",
  "message",
  "kind",
  "status",
  "needs_review",
  "created_at",
] as const;

export type FeedbackAdminRow = {
  id: number | string;
  nickname: string;
  email: string;
  message: string;
  kind: FeedbackKind;
  status: FeedbackStatus;
  needs_review: boolean;
  created_at: string | Date;
};

/** 後台 DTO：可含 email，因為只回給已驗證的審核者。 */
export type FeedbackAdminDto = {
  id: string;
  nickname: string;
  email: string;
  message: string;
  kind: FeedbackKind;
  status: FeedbackStatus;
  needsReview: boolean;
  createdAt: string;
};

/** 聚合只放數字，不含任何正文／暱稱／email。 */
export type FeedbackStats = {
  total: number;
  pending: number;
  published: number;
  hidden: number;
  needsReview: number;
  storyRequest: number;
};

export type FeedbackStatsRow = {
  total: number | string;
  pending: number | string;
  published: number | string;
  hidden: number | string;
  needs_review: number | string;
  story_request: number | string;
};

const DEFAULT_ADMIN_LIMIT = 200;
const MAX_ADMIN_LIMIT = 500;

/**
 * 狀態機：pending → published → hidden，且 hidden 可回 published 或退回待審。
 * 已公開的留言不能直接跳回 pending（要先隱藏，公開牆才會立即撤下）。
 */
export const ALLOWED_STATUS_TRANSITIONS: Record<
  FeedbackStatus,
  readonly FeedbackStatus[]
> = {
  pending: ["pending", "published", "hidden"],
  published: ["published", "hidden"],
  hidden: ["hidden", "published", "pending"],
};

export function canTransitionFeedbackStatus(
  from: FeedbackStatus,
  to: FeedbackStatus,
): boolean {
  return ALLOWED_STATUS_TRANSITIONS[from].includes(to);
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL 未設定");
  }
  return url;
}

function toCount(value: number | string | null | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** 後台 row → DTO；id 一律轉字串（BIGSERIAL 可能超過 JS 安全整數）。 */
export function toAdminDto(row: FeedbackAdminRow): FeedbackAdminDto {
  return {
    id: String(row.id),
    nickname: row.nickname,
    email: row.email,
    message: row.message,
    kind: row.kind,
    status: row.status,
    needsReview: Boolean(row.needs_review),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export function toFeedbackStats(row: FeedbackStatsRow | undefined): FeedbackStats {
  return {
    total: toCount(row?.total),
    pending: toCount(row?.pending),
    published: toCount(row?.published),
    hidden: toCount(row?.hidden),
    needsReview: toCount(row?.needs_review),
    storyRequest: toCount(row?.story_request),
  };
}

/** 路徑參數轉 id：只收十進位數字字串，避免把任意值餵進 SQL。 */
export function parseFeedbackId(raw: string | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!/^\d{1,19}$/.test(trimmed)) return null;
  if (trimmed.length > 1 && trimmed.startsWith("0")) return null;
  return trimmed;
}

/** 後台列表：全部狀態、時間倒序，明確欄位。 */
export async function selectFeedbackAdminRows(
  limit: number = DEFAULT_ADMIN_LIMIT,
): Promise<FeedbackAdminRow[]> {
  const sql = neon(requireDatabaseUrl());
  const safeLimit = Math.min(
    MAX_ADMIN_LIMIT,
    Math.max(1, Math.trunc(Number.isFinite(limit) ? limit : DEFAULT_ADMIN_LIMIT)),
  );

  const rows = await sql`
    SELECT id, nickname, email, message, kind, status, needs_review, created_at
    FROM feedback_messages
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows as unknown as FeedbackAdminRow[];
}

/** 聚合：一次查詢取各狀態則數，不撈任何正文欄位。 */
export async function selectFeedbackStats(): Promise<FeedbackStats> {
  const sql = neon(requireDatabaseUrl());

  const pending: FeedbackStatus = "pending";
  const published: FeedbackStatus = "published";
  const hidden: FeedbackStatus = "hidden";
  const storyRequest: FeedbackKind = "story_request";

  const rows = await sql`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE status = ${pending}) AS pending,
      COUNT(*) FILTER (WHERE status = ${published}) AS published,
      COUNT(*) FILTER (WHERE status = ${hidden}) AS hidden,
      COUNT(*) FILTER (WHERE needs_review) AS needs_review,
      COUNT(*) FILTER (WHERE kind = ${storyRequest}) AS story_request
    FROM feedback_messages
  `;

  return toFeedbackStats((rows as unknown as FeedbackStatsRow[])[0]);
}

export type FeedbackUpdateInput = {
  status?: FeedbackStatus;
  kind?: FeedbackKind;
};

export type FeedbackUpdateResult =
  | { ok: true; row: FeedbackAdminRow }
  | { ok: false; reason: "not_found" | "invalid_transition" };

/** 先讀現況驗狀態機，再更新；COALESCE 讓未帶的欄位保持原值。 */
export async function updateFeedbackMessage(
  id: string,
  patch: FeedbackUpdateInput,
): Promise<FeedbackUpdateResult> {
  const sql = neon(requireDatabaseUrl());

  const currentRows = (await sql`
    SELECT id, status
    FROM feedback_messages
    WHERE id = ${id}::bigint
  `) as unknown as { id: number | string; status: FeedbackStatus }[];

  const current = currentRows[0];
  if (!current) return { ok: false, reason: "not_found" };

  if (patch.status && !canTransitionFeedbackStatus(current.status, patch.status)) {
    return { ok: false, reason: "invalid_transition" };
  }

  const rows = (await sql`
    UPDATE feedback_messages
    SET status = COALESCE(${patch.status ?? null}::text, status),
        kind = COALESCE(${patch.kind ?? null}::text, kind)
    WHERE id = ${id}::bigint
    RETURNING id, nickname, email, message, kind, status, needs_review, created_at
  `) as unknown as FeedbackAdminRow[];

  const row = rows[0];
  if (!row) return { ok: false, reason: "not_found" };
  return { ok: true, row };
}

/** 硬刪：暱稱、email、正文一併消失，公開牆與後台都再也取不到。 */
export async function deleteFeedbackMessage(id: string): Promise<boolean> {
  const sql = neon(requireDatabaseUrl());

  const rows = (await sql`
    DELETE FROM feedback_messages
    WHERE id = ${id}::bigint
    RETURNING id
  `) as unknown as { id: number | string }[];

  return rows.length > 0;
}

export type FeedbackModerationPayload = {
  stats: FeedbackStats;
  messages: FeedbackAdminDto[];
};

/** 後台首屏資料：聚合＋列表。 */
export async function listFeedbackForModeration(
  limit?: number,
): Promise<FeedbackModerationPayload> {
  const [stats, rows] = await Promise.all([
    selectFeedbackStats(),
    selectFeedbackAdminRows(limit),
  ]);

  return { stats, messages: rows.map(toAdminDto) };
}
