import { getStory } from "@/data/content";

export const CATALOG_EPISODE_TITLE_MAX = 10;

export type CatalogEpisodeOption = {
  slug: string;
  ep: number;
  title: string;
};

/** 超過 10 字、或截主標會讀不通時，改用手寫簡述。 */
const CATALOG_EPISODE_TITLE_BY_SLUG: Record<string, string> = {
  "ep-3": "不是第一名",
  "ep-13": "阿酷溫柔救援",
  "ep-18": "練習說再見",
  "ep-20": "阿尼的101任務",
  "ep-23": "第一次越大山",
  "ep-25": "雪山隧道闖關",
};

function characterCount(text: string): number {
  return [...text].length;
}

function headlineOf(title: string): string {
  return (title.split("｜")[0] ?? title).replace(/\s+/g, "");
}

/** 圖鑑下拉用的集數標題，最多 10 個字。 */
export function catalogEpisodeTitle(title: string, slug?: string): string {
  if (slug) {
    const curated = CATALOG_EPISODE_TITLE_BY_SLUG[slug];
    if (curated) return curated;
  }

  const headline = headlineOf(title);
  if (characterCount(headline) <= CATALOG_EPISODE_TITLE_MAX) {
    return headline;
  }

  return [...headline].slice(0, CATALOG_EPISODE_TITLE_MAX).join("");
}

export function catalogEpisodeLabel(option: CatalogEpisodeOption): string {
  return `EP ${option.ep} ${option.title}`;
}

/** 角色出場集數，依集數由小到大，略過沒有故事資料的 slug。 */
export function catalogEpisodesFor(
  slugs: readonly string[],
): CatalogEpisodeOption[] {
  return slugs
    .map((slug) => getStory(slug))
    .filter((story): story is NonNullable<typeof story> => story != null)
    .sort((a, b) => a.ep - b.ep)
    .map((story) => ({
      slug: story.slug,
      ep: story.ep,
      title: catalogEpisodeTitle(story.title, story.slug),
    }));
}
