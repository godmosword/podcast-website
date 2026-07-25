import { z } from "zod";
import { ZONE_IDS } from "@/data/universe";

const zoneIdSchema = z.enum(ZONE_IDS);

const WISH_CATEGORIES = ["feature", "story"] as const;
export type WishCategory = (typeof WISH_CATEGORIES)[number];

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
    category: z.enum(WISH_CATEGORIES).default("feature"),
    // 兒童個資保護：須由家長／照顧者勾選同意才收件（COPPA / 個資法）。
    parentConsent: z.literal(true, { error: "請由家長或照顧者勾選同意" }),
    message: z.string().trim().max(200, "許願內容太長").optional().or(z.literal("")),
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
    category: data.category,
    message: data.message?.trim() || undefined,
    email: data.email?.trim() || undefined,
    nickname: data.nickname?.trim() || undefined,
  }))
  .superRefine((data, ctx) => {
    if (data.category === "story") {
      if (!data.message) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "請填寫想聽的故事",
          path: ["message"],
        });
      }
      return;
    }
    if (!data.email && !data.nickname) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "請填暱稱或 Email",
        path: ["nickname"],
      });
    }
  });
