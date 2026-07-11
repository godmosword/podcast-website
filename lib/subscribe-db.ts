import { neon } from "@neondatabase/serverless";

export function isSubscribeDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export type SubscriberInsert = {
  email: string;
  source?: string | null;
  userAgent?: string | null;
};

/** 冪等寫入；重複 email 不拋錯（ON CONFLICT DO NOTHING）。 */
export async function insertSubscriber(input: SubscriberInsert): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL 未設定");
  }

  const sql = neon(url);
  await sql`
    INSERT INTO subscribers (email, source, user_agent)
    VALUES (${input.email}, ${input.source ?? null}, ${input.userAgent ?? null})
    ON CONFLICT ((lower(email))) DO NOTHING
  `;
}
