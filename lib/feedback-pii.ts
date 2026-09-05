/**
 * 留言個資（PII）規則旗標：純規則判斷，不呼叫任何 LLM。
 *
 * 命中只會把該筆留言標記 needs_review=true 供後台審核提示，
 * 仍維持 pending、不自動拒絕，也不改寫使用者原文。
 */

/** 命中原因；後台可據此顯示提示。 */
export type FeedbackPiiReason = "phone" | "email" | "keyword";

/** 關鍵字清單：兒少常見可識別資訊。 */
export const FEEDBACK_PII_KEYWORDS = ["學校", "幼兒園", "電話", "地址"] as const;

export type FeedbackPiiResult = {
  needsReview: boolean;
  reasons: FeedbackPiiReason[];
};

/** 全形數字轉半形，避免用全形規避電話規則。 */
function toHalfWidthDigits(text: string): string {
  return text.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xff10 + 0x30),
  );
}

/** 電話常見分隔符號：空白、各式連字號、括號、點、加號。 */
const PHONE_SEPARATORS = /[\s\-\u2010-\u2015\u2212()（）.+]/g;

const DIGIT_RUN = /\d{8,}/;
const EMAIL_IN_TEXT = /[^\s@]+@[^\s@]+\.[A-Za-z]{2,}/;

/** 連續 8 碼以上數字視為電話／證號；先去分隔符號再判斷。 */
export function hasPhoneLikeDigits(text: string): boolean {
  const compact = toHalfWidthDigits(text).replace(PHONE_SEPARATORS, "");
  return DIGIT_RUN.test(compact);
}

/** 正文裡出現 email（避免把聯絡方式公開在牆上）。 */
export function hasEmailInText(text: string): boolean {
  return EMAIL_IN_TEXT.test(text);
}

/** 命中關鍵字清單。 */
export function hasPiiKeyword(text: string): boolean {
  return FEEDBACK_PII_KEYWORDS.some((keyword) => text.includes(keyword));
}

/** 對留言正文跑全部規則；回傳是否需人工複審與命中原因。 */
export function detectFeedbackPii(message: string): FeedbackPiiResult {
  const reasons: FeedbackPiiReason[] = [];
  if (hasPhoneLikeDigits(message)) reasons.push("phone");
  if (hasEmailInText(message)) reasons.push("email");
  if (hasPiiKeyword(message)) reasons.push("keyword");

  return { needsReview: reasons.length > 0, reasons };
}
