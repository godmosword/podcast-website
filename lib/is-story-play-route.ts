/** 是否為故事全螢幕播放器路由（/story/:slug/play）。 */
export function isStoryPlayRoute(pathname: string | null): boolean {
  return pathname != null && /^\/story\/[^/]+\/play\/?$/.test(pathname);
}

/**
 * 走 `GamePageShell` 的遊戲頁，不含 `/games/coloring-book`。
 *
 * 著色本用 `ColoringPageShell`（自有版型與返回鍵），未納入本次沉浸式改動，
 * 維持全站導覽以免它變成沒有 sticky 出口的活動頁。
 */
const COLORING_BOOK_PATH = /^\/games\/coloring-book\/?$/;

export function isGamePlayRoute(pathname: string | null): boolean {
  if (pathname == null) return false;
  if (COLORING_BOOK_PATH.test(pathname)) return false;
  return /^\/games\/[^/]+\/?$/.test(pathname);
}

/**
 * 沉浸式路由：全站導覽讓位給內容本身。
 *
 * 前提是該路由自己提供**恆常可達**的離站出口——故事播放器靠控制列，
 * 遊戲頁靠 `GamePageShell` 的 sticky 抬頭。若某路由沒有這種出口，
 * 就不該加進來，否則會把兒童困在頁面裡。
 */
export function isImmersiveRoute(pathname: string | null): boolean {
  return isStoryPlayRoute(pathname) || isGamePlayRoute(pathname);
}
