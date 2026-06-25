/** 各集卡片外框／標記色（ep-1 起依集數固定，避免 sync 預設全紫）。 */
export const EPISODE_COLORS: Record<string, string> = {
  "ep-1": "#0ea5e9",
  "ep-2": "#4263eb",
  "ep-3": "#e64980",
  "ep-4": "#0ca678",
  "ep-5": "#f59f00",
  "ep-6": "#e03131",
  "ep-7": "#f76707",
  "ep-8": "#7048e8",
  "ep-9": "#37b24d",
  "ep-10": "#d6336c",
  "ep-11": "#748ffc",
  "ep-12": "#339af0",
};

const DEFAULT_EPISODE_COLOR = "#7048e8";

export function episodeColorForSlug(slug: string): string {
  return EPISODE_COLORS[slug] ?? DEFAULT_EPISODE_COLOR;
}
