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
 * 「聯絡我們」是頁尾的一般聯絡管道，「留言」是站內 `/feedback` 留言牆。
 * **恆有目的地**（頁面本身），不再被 `NEXT_PUBLIC_FEEDBACK_FORM_URL` 覆寫。
 * SiteHeader「留言給我」圓鈕仍走該 env，未設定就不渲染。
 */
export function feedbackHref(): string {
  return "/feedback";
}

/** 資料庫未設定時，公開表單改走 mailto 的降級連結。 */
export function feedbackMailtoHref(): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("留言給車車遊樂園")}`;
}

/** 是否為外連（http/https）；mailto 等不算外連。 */
export function isContactExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}
