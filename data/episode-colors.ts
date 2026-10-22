/**
 * 每集墊色：六個粉彩，對齊 `app/globals.css` 日間 `--c-pink` … `--c-lilac`。
 * 只做淡底、chip、邊框混色，不當按鈕底。ep 編號從 1 起輪替。
 * 色碼必須與那六個 token 的日間字面值相同（OG 與 alpha 後綴吃不到 CSS 變數）。
 */
export const EPISODE_TINTS = [
  "#f7a8c4",
  "#ffd866",
  "#b7df9b",
  "#8fcde8",
  "#79c8c1",
  "#c5b3e6",
] as const;

export function episodeTintIndex(slug: string): number {
  const match = /^ep-(\d+)$/.exec(slug);
  const n = match ? Number(match[1]) : 1;
  if (!Number.isFinite(n) || n < 1) return 0;
  return (n - 1) % EPISODE_TINTS.length;
}

export function episodeColorForSlug(slug: string): string {
  return EPISODE_TINTS[episodeTintIndex(slug)]!;
}
