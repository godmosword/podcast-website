/** 依 zone 反查故事；供 episode 頁、地圖 sheet 與 RSS 使用。 */
import { getStories, type Story } from "@/data/content";
import { ZONE_IDS, type ZoneId } from "@/data/universe-zones";

/** 地圖 sheet 用的輕量故事預覽（server 預先序列化，避免 client 拉整包 content）。 */
export type ZoneStoryPreview = {
  slug: string;
  ep: number;
  title: string;
  emoji: string;
};

export type ZoneStoriesBundle = {
  previews: ZoneStoryPreview[];
  total: number;
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

/** SSG 預先序列化：每 zone 最多 3 集預覽 + 總數。 */
export function buildZoneStoryPreviewsMap(): Record<ZoneId, ZoneStoriesBundle> {
  const map = {} as Record<ZoneId, ZoneStoriesBundle>;
  for (const zoneId of ZONE_IDS) {
    const stories = getStoriesByZone(zoneId);
    map[zoneId] = {
      previews: stories.slice(0, PREVIEW_LIMIT).map(toPreview),
      total: stories.length,
    };
  }
  return map;
}
