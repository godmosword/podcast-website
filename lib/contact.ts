/** 全站聯絡信箱（許願／通知開幕／合作邀約）。單一資料源，勿各處硬刻。 */
export const CONTACT_EMAIL = "bonboncarstory@gmail.com";

/** 產生「通知我開幕」mailto 連結（樂園地圖未開放島用）。 */
export function notifyMailto(label: string): string {
  return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`通知我-${label}`)}`;
}
