/** 是否為故事全螢幕播放器路由（/story/:slug/play）。 */
export function isStoryPlayRoute(pathname: string | null): boolean {
  return pathname != null && /^\/story\/[^/]+\/play\/?$/.test(pathname);
}
