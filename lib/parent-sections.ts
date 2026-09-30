/**
 * 漢堡抽屜「給爸媽」連結。字級與主列相同，各列自帶 emoji。
 */
export const PARENT_SECTION_ITEMS = [
  {
    id: "parent-articles",
    label: "育兒文章分享",
    href: "/for-parents/articles",
    emoji: "📝",
    description: "給家長看的育兒文章。內容整理中。",
  },
  {
    id: "parent-travel-abroad",
    label: "親子出國",
    href: "/for-parents/travel-abroad",
    emoji: "✈️",
    description: "親子出國的準備與行程。內容整理中。",
  },
  {
    id: "parent-travel-taiwan",
    label: "國內旅遊",
    href: "/for-parents/travel-taiwan",
    emoji: "🏞️",
    description: "國內親子旅遊的行程與景點。內容整理中。",
  },
  {
    id: "parent-story-making",
    label: "故事創作",
    href: "/for-parents/story-making",
    emoji: "✏️",
    description: "和孩子一起把生活變成故事。內容整理中。",
  },
] as const;

export type ParentSectionId = (typeof PARENT_SECTION_ITEMS)[number]["id"];

export function parentSection(id: ParentSectionId) {
  const item = PARENT_SECTION_ITEMS.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`unknown parent section: ${id}`);
  }
  return item;
}
