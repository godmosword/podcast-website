import {
  insertFeedbackMessage,
  selectPublishedFeedbackRows,
  toPublicDto,
  type FeedbackPublicDto,
} from "@/lib/feedback-db";
import { detectFeedbackPii, type FeedbackPiiReason } from "@/lib/feedback-pii";
import { FEEDBACK_DEFAULT_KIND } from "@/lib/feedback-schema";

/** 公開牆資料來源：只回 published，並且只帶公開 DTO 欄位。 */
export async function listPublishedFeedback(limit?: number): Promise<FeedbackPublicDto[]> {
  const rows = await selectPublishedFeedbackRows(limit);
  return rows.map(toPublicDto);
}

export type CreateFeedbackInput = {
  nickname: string;
  email: string;
  message: string;
  /** 政策版本由 server 端（route）給，不採信 client。 */
  consentVersion: string;
  consentedAt: Date;
};

export type CreateFeedbackResult = {
  needsReview: boolean;
  reasons: FeedbackPiiReason[];
};

/**
 * 收件：kind 固定 general（v1 全站一面牆，不採信 client 的 kind），
 * status 由 db 層寫 pending；PII 規則命中只標 needs_review，不擋收件。
 */
export async function createFeedbackMessage(
  input: CreateFeedbackInput,
): Promise<CreateFeedbackResult> {
  const pii = detectFeedbackPii(input.message);

  await insertFeedbackMessage({
    nickname: input.nickname,
    email: input.email,
    message: input.message,
    kind: FEEDBACK_DEFAULT_KIND,
    needsReview: pii.needsReview,
    consentVersion: input.consentVersion,
    consentedAt: input.consentedAt,
  });

  return { needsReview: pii.needsReview, reasons: pii.reasons };
}
