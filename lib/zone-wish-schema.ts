import { z } from "zod";
import { ZONE_IDS, type ZoneId } from "@/data/universe-zones";

const zoneIdSchema = z.enum(ZONE_IDS as [ZoneId, ...ZoneId[]]);

/** 從單一輸入框判斷是 email 或暱稱。 */
export function parseWishContact(raw: string): { email?: string; nickname?: string } {
  const trimmed = raw.trim();
  if (!trimmed) return {};
  if (trimmed.includes("@")) {
    return { email: trimmed };
  }
  return { nickname: trimmed };
}

export const zoneWishBodySchema = z
  .object({
    zoneId: zoneIdSchema,
    email: z
      .string()
      .trim()
      .email("Email 格式不正確")
      .optional()
      .or(z.literal("")),
    nickname: z.string().trim().max(40, "暱稱太長").optional().or(z.literal("")),
  })
  .transform((data) => ({
    zoneId: data.zoneId,
    email: data.email?.trim() || undefined,
    nickname: data.nickname?.trim() || undefined,
  }))
  .refine((data) => Boolean(data.email || data.nickname), {
    message: "請填暱稱或 Email",
  });

export type ZoneWishBody = z.infer<typeof zoneWishBodySchema>;
