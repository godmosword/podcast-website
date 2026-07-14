import fs from "node:fs";
import path from "node:path";
import { storiesByNewest } from "@/data/content";
import { buildRssFeed } from "@/lib/feed";
import { storyAudioPath } from "@/lib/story-utils";

/** 為每集本地音檔取實際檔案大小（bytes），供 RSS enclosure length 使用；失敗則略過。 */
function buildAudioLengthBySlug(
  stories: ReturnType<typeof storiesByNewest>,
): Record<string, number> {
  const entries: [string, number][] = [];

  for (const story of stories) {
    const assetPath = storyAudioPath(story.slug, story.audio);
    if (!assetPath.startsWith("/stories/")) continue;

    try {
      const filePath = path.join(process.cwd(), "public", assetPath);
      const { size } = fs.statSync(filePath);
      entries.push([story.slug, size]);
    } catch {
      // 檔案不存在或讀取失敗時略過，enclosure length fallback 0
    }
  }

  return Object.fromEntries(entries);
}

export function GET() {
  const stories = storiesByNewest();
  const xml = buildRssFeed(stories, {
    audioLengthBySlug: buildAudioLengthBySlug(stories),
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
