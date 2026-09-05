import { z } from "zod";

/** 留言狀態：先審後發，hidden 為撤下但保留統計。 */
export const FEEDBACK_STATUSES = ["pending", "published", "hidden"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

/** 留言類型：由 server 判定，不採信 client。 */
export const FEEDBACK_KINDS = ["general", "story_request"] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

/** INSERT 預設值：一律 pending + general。 */
export const FEEDBACK_DEFAULT_STATUS: FeedbackStatus = "pending";
export const FEEDBACK_DEFAULT_KIND: FeedbackKind = "general";

export const FEEDBACK_NICKNAME_MAX = 40;
export const FEEDBACK_MESSAGE_MAX = 200;

export const feedbackBodySchema = z
  .object({
    nickname: z
      .string()
      .trim()
      .min(1, "請填名字或暱稱")
      .max(FEEDBACK_NICKNAME_MAX, "名字或暱稱太長"),
    // email 必填（回覆與濫用防治用），但永不公開。
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(z.email("Email 格式不正確")),
    message: z
      .string()
      .trim()
      .min(1, "請寫下你最想說的話")
      .max(FEEDBACK_MESSAGE_MAX, "想說的話太長"),
    // 兒童個資保護：須由家長／照顧者勾選同意才收件（COPPA / 個資法）。
    parentConsent: z.literal(true, { error: "請由家長或照顧者勾選同意" }),
    // 公開授權：理解審核後可能公開暱稱與正文。
    publishConsent: z.literal(true, { error: "請勾選同意審核後可能公開" }),
  })
  // 政策版本與同意時間一律由 server 寫入，這裡不接受 client 欄位。
  .strip();

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;
