/**
 * 故事 OG 圖路徑（零依賴葉模組）。
 * 獨立成檔是為了讓 feed.xml／story 詳情等只需要路徑字串的入口，
 * 不要 import 進 lib/story-og.tsx——該檔有 `readFile(join(process.cwd(), "public", …))`
 * 動態路徑，Next output file tracing 會保守將整個 public/（>340MB）
 * 打包進 serverless function，超出 Vercel 250MB 上限。
 */
export function storyOgImagePath(slug: string): string {
  return `/story/${slug}/opengraph-image`;
}
