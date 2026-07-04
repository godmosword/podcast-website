import { neon } from "@neondatabase/serverless";
import type { WishCategory } from "@/lib/zone-wish-schema";

export function isZoneWishDbConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export type ZoneWishInsert = {
  zoneId: string;
  category: WishCategory;
  message?: string | null;
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
    INSERT INTO zone_wishes (zone_id, category, message, email, nickname, user_agent)
    VALUES (
      ${input.zoneId},
      ${input.category},
      ${input.message ?? null},
      ${input.email ?? null},
      ${input.nickname ?? null},
      ${input.userAgent ?? null}
    )
  `;
}
