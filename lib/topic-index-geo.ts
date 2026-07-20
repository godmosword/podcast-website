export type TopicIndexTheme = { tag: string; count: number };

/** `/topic` 主題索引 answer-first 導言。 */
export function topicIndexDefinitionSummary(themes: TopicIndexTheme[]): string {
  const themeCount = themes.length;
  const busiest = [...themes].sort((a, b) => b.count - a.count)[0];
  const sampleTags = themes
    .slice(0, 3)
    .map((t) => t.tag)
    .join("、");

  const lead = busiest
    ? `目前整理 ${themeCount} 個成長主題；「${busiest.tag}」收錄 ${busiest.count} 集最多。`
    : `目前整理 ${themeCount} 個成長主題。`;

  return `${lead}涵蓋${sampleTags}等標籤，點選主題看相關集數與代表故事，再進單集看圖聽故事。`;
}
