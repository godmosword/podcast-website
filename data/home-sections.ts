import { FEATURES } from "@/lib/features";

export type HomeSectionId =
  | "continue"
  | "latestHero"
  | "starter"
  | "subscribeBand"
  | "favorites"
  | "storyFilter";

export type HomeSectionDef = {
  id: HomeSectionId;
  /** 靜態開關；可再與 FEATURES 聯動 */
  enabled: boolean;
};

/** 順序即首頁渲染順序（SiteHeader / SiteFooter 不在此列）。 */
export const HOME_SECTIONS: HomeSectionDef[] = [
  { id: "continue", enabled: true },
  { id: "latestHero", enabled: true },
  { id: "starter", enabled: false },
  { id: "subscribeBand", enabled: false },
  { id: "favorites", enabled: true },
  { id: "storyFilter", enabled: true },
];

export function isHomeSectionActive(section: HomeSectionDef): boolean {
  if (!section.enabled) return false;
  if (section.id === "starter") return FEATURES.starterEpisodes;
  return true;
}

export function activeHomeSectionIds(): HomeSectionId[] {
  return HOME_SECTIONS.filter(isHomeSectionActive).map((s) => s.id);
}
