/** 是否為故事全螢幕播放器路由（/story/:slug/play）。 */
export function isStoryPlayRoute(pathname: string | null): boolean {
  return pathname != null && /^\/story\/[^/]+\/play\/?$/.test(pathname);
}

/**
 * 遊戲頁（含 `/games/coloring-book`）。
 *
 * G-M7（2026-09-20 翻 PLAY-IA D5-A）：著色本改走與 `GamePageShell` 同款的 sticky 抬頭
 * （返回＋唯一 h1＋日夜切換），因此一併納入沉浸路由，不再保留全站導覽。
 */
export function isGamePlayRoute(pathname: string | null): boolean {
  if (pathname == null) return false;
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
