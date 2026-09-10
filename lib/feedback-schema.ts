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
      .min(1, "請填暱稱")
      .max(FEEDBACK_NICKNAME_MAX, "暱稱太長"),
    // email 選填（回覆與濫用防治用），但永不公開。空字串寫入 DB 以符合 NOT NULL。
    email: z.preprocess(
      (value) => (typeof value === "string" ? value.trim().toLowerCase() : ""),
      z.union([z.literal(""), z.email("Email 格式不正確")]),
    ),
    message: z
      .string()
      .trim()
      .min(1, "請寫下留言")
      .max(FEEDBACK_MESSAGE_MAX, "留言太長"),
  })
  // 政策版本與同意時間一律由 server 寫入，這裡不接受 client 欄位。
  .strip();

export type FeedbackBody = z.infer<typeof feedbackBodySchema>;
