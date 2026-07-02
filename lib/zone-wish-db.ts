import { neon } from "@neondatabase/serverless";

export function isZoneWishDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export type ZoneWishInsert = {
  zoneId: string;
  email?: string | null;
  nickname?: string | null;
  userAgent?: string | null;
};

export async function insertZoneWish(input: ZoneWishInsert): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL 未設定");
  }

  const sql = neon(url);
  await sql`
    INSERT INTO zone_wishes (zone_id, email, nickname, user_agent)
    VALUES (${input.zoneId}, ${input.email ?? null}, ${input.nickname ?? null}, ${input.userAgent ?? null})
  `;
}
