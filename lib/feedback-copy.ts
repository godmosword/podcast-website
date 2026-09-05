/**
 * 留言牆公開頁文案（非法務）。情感句依使用者指定斷行；欄位說明只當 label。
 */

export const FEEDBACK_PAGE_TITLE = "留言給馬米";

export const FEEDBACK_PAGE_DESCRIPTION =
  "跟馬米說你最想說的話，也歡迎許願下一集想聽的故事。留言經家長同意與審核後才會公開。";

export const FEEDBACK_EYEBROW = "給家長";

export const FEEDBACK_INVITE_CHILD =
  "嗨嗨，謝謝你來聽故事！告訴馬米你最想說的話，也歡迎許願下一集想聽什麼。";

export const FEEDBACK_INVITE_PARENT = "可以讓孩子說、爸媽幫忙打字。";

export const FEEDBACK_REVIEW_LEAD =
  "留言經家長同意，且馬米看過之後，才會出現在下面的留言牆。";

/** textarea id，空牆 CTA 用 hash 對準（無 JS 也能跳）。 */
export const FEEDBACK_MESSAGE_FIELD_ID = "feedback-message";

export const FEEDBACK_NICKNAME_LABEL = "名字或暱稱";

export const FEEDBACK_EMAIL_LABEL = "信箱";

export const FEEDBACK_EMAIL_HINT = "這個當做蒐集資料，不會顯示在畫面上。";

export const FEEDBACK_MESSAGE_LABEL = "你最想說的話";

export const FEEDBACK_MESSAGE_HINT = "也歡迎寫下想聽的故事。";

export const FEEDBACK_SUBMIT_LABEL = "我要留言";

export const FEEDBACK_SUBMIT_DISABLED_HINT = "請先勾選兩項同意，才能送出。";

export const FEEDBACK_PARENT_CONSENT_BEFORE = "我是家長／照顧者，已閱讀並同意";

export const FEEDBACK_PARENT_CONSENT_LINK = "隱私說明";

export const FEEDBACK_PARENT_CONSENT_AFTER =
  "。請勿填寫孩子的真名、學校、電話或地址。";

export const FEEDBACK_PUBLISH_CONSENT =
  "我了解留言經審核後，可能公開暱稱與正文（信箱不會公開）。";

export const FEEDBACK_SUCCESS =
  "馬米收到了。看過以後會貼上牆，不會馬上出現喔。";

export const FEEDBACK_ERROR = "送出失敗，請再試一次。";

export const FEEDBACK_VALIDATION_ERROR = "請檢查必填欄位與信箱格式。";

export const FEEDBACK_RATE_LIMITED = "留言有點多，請稍後再試。";

export const FEEDBACK_MAILTO_LEAD = "線上留言暫時關起來了，請改用";

export const FEEDBACK_MAILTO_LINK = "email 留言";

export const FEEDBACK_MAILTO_SUBJECT = "留言給車車遊樂園";

export const FEEDBACK_LOADING_LABEL = "正在準備留言牆…";

export const FEEDBACK_WALL_HEADING = "大家的留言";

export const FEEDBACK_WALL_COUNT = (count: number): string => `共 ${count} 則留言`;

export const FEEDBACK_DEMO_MARKER = "範例";

export const FEEDBACK_DEMO_NICKNAME = "馬米";

export const FEEDBACK_DEMO_MESSAGE =
  "謝謝你來聽故事。最想說的話、想聽的故事，都歡迎跟我們說。";

export const FEEDBACK_DEMO_NOTE =
  "上面是馬米寫的示範。你可以當第一個跟馬米說話的人。";

export const FEEDBACK_TOO_FAST = "再檢查一下留言內容，然後重新送出。";

export const FEEDBACK_EMPTY_CTA = "當第一個留言";

export const FEEDBACK_CHAR_REMAINING = (n: number): string => `還可以寫 ${n} 字`;
