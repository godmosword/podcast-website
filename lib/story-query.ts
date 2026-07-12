import type { Story } from "@/data/content";

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase("zh-Hant");
}

function searchableText(story: Story): string {
  return [
    story.title,
    story.vehicle,
    ...(story.tags ?? []),
    story.summary ?? "",
  ]
    .join(" ")
    .toLocaleLowerCase("zh-Hant");
}

/** 依標題、車種、主題或摘要搜尋故事，保留傳入的排序。 */
export function searchStories(stories: Story[], query: string): Story[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return stories;
  return stories.filter((story) => searchableText(story).includes(normalized));
}
