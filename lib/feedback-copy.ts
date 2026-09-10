/**
 * 留言牆公開頁文案（非法務）。情感句依使用者指定斷行；欄位說明只當 label。
 */

export const FEEDBACK_PAGE_TITLE = "留言給馬米";

export const FEEDBACK_PAGE_DESCRIPTION =
  "跟馬米說你最想說的話，也歡迎許願下一集想聽的故事。留言經審核後才會公開。";

export const FEEDBACK_PAGE_TITLE_ID = "feedback-page-title";

export const FEEDBACK_INVITE_CHILD =
  "嗨嗨，謝謝你來聽故事！告訴馬米你最想說的話，也歡迎許願下一集想聽什麼。";

/** textarea id，空牆 CTA 用 hash 對準（無 JS 也能跳）。 */
export const FEEDBACK_MESSAGE_FIELD_ID = "feedback-message";

export const FEEDBACK_NICKNAME_LABEL = "暱稱";

export const FEEDBACK_EMAIL_LABEL = "信箱（選填）";

export const FEEDBACK_MESSAGE_LABEL = "留言";

export const FEEDBACK_SUBMIT_LABEL = "我要留言";

export const FEEDBACK_SUCCESS =
  "馬米收到了。看過以後會貼上牆，不會馬上出現喔。";

export const FEEDBACK_ERROR = "送出失敗，請再試一次。";

export const FEEDBACK_VALIDATION_ERROR = "請檢查必填欄位與信箱格式。";

export const FEEDBACK_RATE_LIMITED = "留言有點多，請稍後再試。";

export const FEEDBACK_MAILTO_LINK = "用 email 留言";

export const FEEDBACK_MAILTO_SUBJECT = "留言給車車遊樂園";

export const FEEDBACK_LOADING_LABEL = "正在準備留言牆…";

export const FEEDBACK_WALL_HEADING = "大家的留言";

export const FEEDBACK_WALL_COUNT = (count: number): string => `共 ${count} 則留言`;

export const FEEDBACK_TOO_FAST = "再檢查一下留言內容，然後重新送出。";

export const FEEDBACK_EMPTY_CTA = "當第一個留言";

export const FEEDBACK_CHAR_REMAINING = (n: number): string => `還可以寫 ${n} 字`;
