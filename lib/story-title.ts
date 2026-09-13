/**
 * 故事標題的兩種用途拆開。
 *
 * `story.title` 是 Podcast 目錄用的完整標題，用全形直線串起「故事名｜情境問句｜
 * 分類」，例如「大黃卡車的運送任務｜六根大木頭怎麼搬？｜工程車生活探索故事」。
 * 那串很適合 `<title>`／OG／RSS／JSON-LD，但直接當可見 `<h1>` 會在手機上排成
 * 三行置中，播放器頂欄也只塞得下「大黃卡車的運…」。
 *
 * 所以可見標題取第一段、其餘段落降為副標——關鍵字全部留在頁面上，只是換了層級。
 * 第一段不夠好時（例如 ep-28 的「小紅豆汽車故事」）用 `displayTitle` 明確覆寫。
 */

/** 目錄標題使用的全形直線；半形 `|` 一併容忍。 */
const TITLE_SEPARATOR = /[｜|]/;

export type StoryTitleParts = {
  /** 可見主標。 */
  head: string;
  /** 主標之後的段落，已去空白且濾掉空字串。 */
  rest: string[];
};

export function splitStoryTitle(title: string): StoryTitleParts {
  const parts = title
    .split(TITLE_SEPARATOR)
    .map((part) => part.trim())
    .filter((part) => part.length > 0);

  // 整串都是分隔符或空白時退回原字串，寧可長也不要空標題。
  if (parts.length === 0) return { head: title.trim(), rest: [] };
  return { head: parts[0]!, rest: parts.slice(1) };
}

type TitledStory = {
  title: string;
  displayTitle?: string;
};

/** 可見主標：優先用 `displayTitle`，否則取完整標題的第一段。 */
export function storyDisplayTitle(story: TitledStory): string {
  const override = story.displayTitle?.trim();
  if (override) return override;
  return splitStoryTitle(story.title).head;
}

/**
 * 副標：完整標題扣掉主標後的段落，以「·」相連；沒有剩餘段落時回 null。
 *
 * `displayTitle` 有覆寫時仍以**完整標題**切段，因為覆寫的目的是換個講法，
 * 不是把後面的段落丟掉。
 */
export function storySubtitle(story: TitledStory): string | null {
  const { rest } = splitStoryTitle(story.title);
  if (rest.length === 0) return null;
  return rest.join(" · ");
}
