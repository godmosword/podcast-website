/** 依 zone 反查故事；供 episode 頁、地圖 sheet 與 RSS 使用。 */
import { cache } from "react";
import { getStories, type Story } from "@/data/content";
import { ZONE_IDS, type ZoneId } from "@/data/universe-zones";

/** 地圖 sheet 用的輕量故事預覽（server 預先序列化，避免 client 拉整包 content）。 */
type ZoneStoryPreview = {
  slug: string;
  ep: number;
  title: string;
  emoji: string;
};

export type ZoneStoriesBundle = {
  previews: ZoneStoryPreview[];
  total: number;
  /** 該島全部集數 slug（client 端與 storiesCompleted 交集算島嶼進度；只是字串，payload 極小）。 */
  slugs: string[];
};

const PREVIEW_LIMIT = 3;

export function getStoriesByZone(zoneId: ZoneId): Story[] {
  return getStories().filter((story) => story.zoneId === zoneId);
}

function toPreview(story: Story): ZoneStoryPreview {
  return {
    slug: story.slug,
    ep: story.ep,
    title: story.title,
    emoji: story.emoji,
  };
}

/**
 * SSG 預先序列化：每 zone 最多 3 集預覽 + 總數。
 * 未包 cache；production 請用 `buildZoneStoryPreviewsMap`。
 */
export function buildZoneStoryPreviewsMapUncached(): Record<
  ZoneId,
  ZoneStoriesBundle
> {
  const map = {} as Record<ZoneId, ZoneStoriesBundle>;
  for (const zoneId of ZONE_IDS) {
    const stories = getStoriesByZone(zoneId);
    map[zoneId] = {
      previews: stories.slice(0, PREVIEW_LIMIT).map(toPreview),
      total: stories.length,
      slugs: stories.map((story) => story.slug),
    };
  }
  return map;
}

/**
 * Request 內去重：`adventures/layout` 與 `[zone]/page` 共用同一次計算。
 * （React `cache` 僅在 RSC request 的 Cache dispatcher 下生效。）
 */
export const buildZoneStoryPreviewsMap = cache(buildZoneStoryPreviewsMapUncached);

/** 島頁 sr-only 用的完整故事標題列（非僅 3 筆預覽）。 */
export function zoneStoryTitleLines(zoneId: ZoneId): string[] {
  return getStoriesByZone(zoneId).map(
    (story) => `第 ${story.ep} 集：${story.title}`,
  );
}
