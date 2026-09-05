import { neon } from "@neondatabase/serverless";
import {
  FEEDBACK_DEFAULT_STATUS,
  type FeedbackKind,
  type FeedbackStatus,
} from "@/lib/feedback-schema";

export function isFeedbackDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

/**
 * 公開查詢唯一允許外流的欄位；email／status／kind／needs_review 一律不得進入。
 * 公開 SQL 必須明確列欄位，禁止 SELECT *。
 */
export const FEEDBACK_PUBLIC_COLUMNS = [
  "id",
  "nickname",
  "message",
  "created_at",
] as const;

export type FeedbackPublicRow = {
  id: number | string;
  nickname: string;
  message: string;
  created_at: string | Date;
};

/** 公開 DTO：只有這四個欄位可以給前端。 */
export type FeedbackPublicDto = {
  id: number | string;
  nickname: string;
  message: string;
  createdAt: string;
};

export type FeedbackInsert = {
  nickname: string;
  email: string;
  message: string;
  kind: FeedbackKind;
  needsReview: boolean;
  consentVersion: string;
  consentedAt: Date;
};

const PUBLISHED_STATUS: FeedbackStatus = "published";

const DEFAULT_PUBLIC_LIMIT = 50;
const MAX_PUBLIC_LIMIT = 100;

/**
 * 只挑白名單欄位轉成公開 DTO；即使上游 row 夾帶 email 也不會被帶出去。
 */
export function toPublicDto(row: FeedbackPublicRow): FeedbackPublicDto {
  return {
    id: row.id,
    nickname: row.nickname,
    message: row.message,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL 未設定");
  }
  return url;
}

/** 公開牆查詢：明確欄位、只取 published、時間倒序。 */
export async function selectPublishedFeedbackRows(
  limit: number = DEFAULT_PUBLIC_LIMIT,
): Promise<FeedbackPublicRow[]> {
  const sql = neon(requireDatabaseUrl());
  const safeLimit = Math.min(
    MAX_PUBLIC_LIMIT,
    Math.max(1, Math.trunc(Number.isFinite(limit) ? limit : DEFAULT_PUBLIC_LIMIT)),
  );

  const rows = await sql`
    SELECT id, nickname, message, created_at
    FROM feedback_messages
    WHERE status = ${PUBLISHED_STATUS}
    ORDER BY created_at DESC
    LIMIT ${safeLimit}
  `;

  return rows as unknown as FeedbackPublicRow[];
}

/** 寫入留言：status 一律 pending，consent 版本與時間由呼叫端（server）給。 */
export async function insertFeedbackMessage(input: FeedbackInsert): Promise<void> {
  const sql = neon(requireDatabaseUrl());
  await sql`
    INSERT INTO feedback_messages (
      nickname, email, message, kind, status, needs_review,
      consent_version, consented_at
    )
    VALUES (
      ${input.nickname},
      ${input.email},
      ${input.message},
      ${input.kind},
      ${FEEDBACK_DEFAULT_STATUS},
      ${input.needsReview},
      ${input.consentVersion},
      ${input.consentedAt.toISOString()}
    )
  `;
}
