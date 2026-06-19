import type { Story } from "@/data/content";

export function filterStoriesForVehicle(
  stories: Story[],
  vehicle: string | null,
  featuredStorySlug?: string | null,
): Story[] {
  return stories.filter((story) => {
    if (vehicle) return story.vehicle === vehicle;
    return story.slug !== featuredStorySlug;
  });
}

/** 將搜尋字串正規化：NFKC（全形→半形）、去頭尾空白、轉小寫。 */
export function normalizeSearchText(value: string): string {
  return value.normalize("NFKC").trim().toLocaleLowerCase("zh-Hant");
}

type SearchStoriesArgs = {
  query?: string;
  vehicle?: string | null;
  featuredStorySlug?: string | null;
};

/**
 * 依「文字 × 車種」過濾故事（AND 組合）。
 * - featured（首頁最新）僅在「無搜尋字且未選車種」時排除，避免與 hero 重複；
 *   一旦有搜尋字或選了車種，最新故事仍可被找到。
 * - 文字比對範圍：title / vehicle / tags（不含 summary，避免結果過寬）。
 */
export function searchStories(
  stories: Story[],
  { query = "", vehicle = null, featuredStorySlug = null }: SearchStoriesArgs,
): Story[] {
  const q = normalizeSearchText(query);

  return stories.filter((story) => {
    if (!q && !vehicle && story.slug === featuredStorySlug) return false;
    if (vehicle && story.vehicle !== vehicle) return false;
    if (q) {
      const haystack = normalizeSearchText(
        [story.title, story.vehicle, ...(story.tags ?? [])].join(" "),
      );
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

/**
 * 計算車種 chip 列要顯示哪些車種。
 * - expanded：全部顯示。
 * - 收合：取前 limit 顆；若目前選中的車種不在其中，補入以確保 active 一律可見。
 */
export function getVisibleVehicles(
  vehicles: string[],
  activeVehicle: string | null,
  expanded: boolean,
  limit = 6,
): string[] {
  if (expanded) return vehicles;
  const visible = vehicles.slice(0, limit);
  if (activeVehicle && !visible.includes(activeVehicle)) {
    return [...visible, activeVehicle];
  }
  return visible;
}
