import { neon } from "@neondatabase/serverless";

export function isSubscribeDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export type SubscriberInsert = {
  email: string;
  source?: string | null;
  tokenHash: string;
  expiresAt: Date;
  consentVersion: string;
  consentedAt: Date;
};

/**
 * 寫入 pending 訂閱；已確認的 email 不降級回 pending，避免重複送信造成困擾。
 */
export async function upsertPendingSubscriber(
  input: SubscriberInsert,
): Promise<"pending" | "confirmed"> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL 未設定");
  }

  const sql = neon(url);
  const rows = await sql`
    INSERT INTO subscribers (
      email, source, status, confirmation_token_hash, confirmation_expires_at,
      consent_version, consented_at
    )
    VALUES (
      ${input.email}, ${input.source ?? null}, 'pending', ${input.tokenHash},
      ${input.expiresAt.toISOString()}, ${input.consentVersion},
      ${input.consentedAt.toISOString()}
    )
    ON CONFLICT ((lower(email))) DO UPDATE SET
      source = EXCLUDED.source,
      status = 'pending',
      confirmation_token_hash = EXCLUDED.confirmation_token_hash,
      confirmation_expires_at = EXCLUDED.confirmation_expires_at,
      consent_version = EXCLUDED.consent_version,
      consented_at = EXCLUDED.consented_at,
      confirmed_at = NULL
    WHERE subscribers.status <> 'confirmed'
    RETURNING status
  `;
  // 已確認列在 conflict update 的 WHERE 被保留，避免重送確認信與競態降級。
  return rows.length === 0 || rows[0]?.status === "confirmed"
    ? "confirmed"
    : "pending";
}

/** 確認 token 只可用一次，且必須尚未過期。 */
export async function confirmSubscriber(tokenHash: string): Promise<boolean> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return false;

  const sql = neon(url);
  const rows = await sql`
    UPDATE subscribers
    SET status = 'confirmed', confirmed_at = NOW(),
        confirmation_token_hash = NULL, confirmation_expires_at = NULL
    WHERE status = 'pending'
      AND confirmation_token_hash = ${tokenHash}
      AND confirmation_expires_at > NOW()
    RETURNING id
  `;
  return rows.length > 0;
}
