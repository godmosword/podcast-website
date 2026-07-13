/**
 * 故事 OG 圖路徑（零依賴葉模組）。
 * 獨立成檔是為了讓 feed.xml／story 詳情等只需要路徑字串的入口，
 * 不要 import 進 lib/story-og.tsx——該檔包含 OG renderer、字型與封面資產，
 * 會讓只需要路徑字串的入口（例如 feed.xml）增加不必要的 bundle。
 */
export function storyOgImagePath(slug: string): string {
  return `/story/${slug}/opengraph-image`;
}
