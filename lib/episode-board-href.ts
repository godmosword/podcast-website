/**
 * 只允許站內故事頁或站內播放器。
 * 拒絕協定、協議相對網址、查詢字串與雜湊，避免外連和追蹤參數。
 */
const STORY_PATH = /^\/story\/[a-z0-9-]+(?:\/play)?\/?$/;

export function isSafeInternalHref(href: string): boolean {
  if (!href.startsWith("/")) return false;
  if (href.startsWith("//")) return false;
  if (href.includes("\\") || /\s/.test(href)) return false;
  if (href.includes("?") || href.includes("#")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(href)) return false;
  let url: URL;
  try {
    url = new URL(href, "https://board.invalid");
  } catch {
    return false;
  }
  if (url.origin !== "https://board.invalid") return false;
  if (url.username || url.password) return false;
  return STORY_PATH.test(url.pathname);
}
