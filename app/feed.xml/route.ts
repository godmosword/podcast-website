import { storiesByNewest } from "@/data/content";
import { audioLengthBySlug } from "@/data/audio-lengths";
import { buildRssFeed } from "@/lib/feed";

/**
 * RSS feed。enclosure length 來自建置時預計算表（data/audio-lengths.json），
 * 禁止在此對 public/ 做 fs——會觸發 Next tracing 打包整個 public/ 導致部署超標。
 */
export function GET() {
  const stories = storiesByNewest();
  const xml = buildRssFeed(stories, { audioLengthBySlug });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
