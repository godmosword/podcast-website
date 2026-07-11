/** 故事封面共享元素轉場名稱（列表卡 ↔ 詳情 hero）。 */
export function storyCoverTransitionName(slug: string): string {
  return `story-cover-${slug}`;
}

/** View Transitions API 是否可用（僅 client；SSR 一律 false）。 */
export function supportsViewTransitions(): boolean {
  if (typeof document === "undefined") return false;
  return "startViewTransition" in document;
}
