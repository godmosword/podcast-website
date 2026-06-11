/** EP1–6 舊主題 slug → 統一後的 ep-N（永久重定向與 localStorage 遷移用）。 */
export const LEGACY_STORY_SLUG_ALIASES: Record<string, string> = {
  ev: "ep-1",
  drone: "ep-2",
  racecar: "ep-3",
  sweeper: "ep-4",
  excavator: "ep-5",
  ambulance: "ep-6",
};

/** 將舊 slug 轉成現行 slug；已是 ep-N 則原樣回傳。 */
export function canonicalStorySlug(slug: string): string {
  return LEGACY_STORY_SLUG_ALIASES[slug] ?? slug;
}

export function legacyStoryRedirects(): Array<{
  source: string;
  destination: string;
  permanent: boolean;
}> {
  return Object.entries(LEGACY_STORY_SLUG_ALIASES).flatMap(([oldSlug, newSlug]) => [
    { source: `/story/${oldSlug}`, destination: `/story/${newSlug}`, permanent: true },
    {
      source: `/story/${oldSlug}/play`,
      destination: `/story/${newSlug}/play`,
      permanent: true,
    },
  ]);
}
