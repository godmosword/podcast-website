import { storiesByNewest } from "@/data/stories";
import { buildRssFeed } from "@/lib/feed";

export function GET() {
  const xml = buildRssFeed(storiesByNewest());

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
