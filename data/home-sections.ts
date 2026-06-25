/** 順序即首頁渲染順序（SiteHeader / SiteFooter 不在此列）。 */
export const HOME_SECTION_IDS = [
  "latestHero",
  "favorites",
  "storyFilter",
] as const;

export type HomeSectionId = (typeof HOME_SECTION_IDS)[number];
