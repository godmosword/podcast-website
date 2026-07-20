import type { Story } from "@/data/content";

/** `/stories` 聚合頁 answer-first 導言。 */
export function storiesCatalogSummary(
  stories: Story[],
  themeCount: number,
  vehicleCount: number,
): string {
  return `這頁收錄車車遊樂園全部 ${stories.length} 則看圖聽故事，可依 ${vehicleCount} 種車車或 ${themeCount} 個成長主題篩選；適合找最新集、整理收藏，或訂閱 Spotify／Apple Podcasts 追新集。`;
}
