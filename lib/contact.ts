/** 全站聯絡信箱（許願／通知開幕／合作邀約）。單一資料源，勿各處硬刻。 */
export const CONTACT_EMAIL = "bonboncarstory@gmail.com";

/** 產生「通知我開幕」mailto 連結（樂園地圖未開放島用）。 */
export function notifyMailto(label: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`通知我-${label}`)}`;
}

/** 頁尾／全站「聯絡我們」連結（表單 URL 或 mailto）。 */
export function contactHref(): string {
  const formUrl = process.env.NEXT_PUBLIC_CONTACT_FORM_URL?.trim();
  if (formUrl) return formUrl;
  return `mailto:${CONTACT_EMAIL}`;
}

/**
 * 頂欄「留言」入口（`SiteNavBar`）。與 `contactHref()` 刻意分開：
 * 「聯絡我們」是頁尾的一般聯絡管道，「留言」是給節目的回饋，兩者可指向不同表單。
 * 未設定 `NEXT_PUBLIC_FEEDBACK_FORM_URL` 時降級為 mailto——**恆有目的地**，
 * 不像 `SiteHeader` 的圓鈕那樣整顆消失（頂欄三入口是版面契約，不可被 env 掀桌）。
 */
export function feedbackHref(): string {
  const formUrl = process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL?.trim();
  if (formUrl) return formUrl;
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("留言給車車遊樂園")}`;
}

/** 是否為外連（http/https）；mailto 等不算外連。 */
export function isContactExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
