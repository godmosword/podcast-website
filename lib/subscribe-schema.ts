import { z } from "zod";

export const subscribeBodySchema = z
  .object({
    email: z.string().trim().email("Email 格式不正確"),
    // 須由家長／照顧者勾選同意才收件。
    parentConsent: z.literal(true, { error: "請由家長或照顧者勾選同意" }),
    source: z.string().trim().max(40).optional().or(z.literal("")),
  })
  .transform((data) => ({
    email: data.email.trim(),
    source: data.source?.trim() || undefined,
  }));
