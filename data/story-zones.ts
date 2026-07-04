/** 各集對應的樂園地圖 zone（sidecar，以 slug 為 key）。 */
import type { ZoneId } from "./universe-zones";

const STORY_ZONES: Record<string, ZoneId> = {
  "ep-1": "car-park",
  "ep-3": "car-park",
  "ep-6": "rescue",
};

export function getStoryZoneId(slug: string): ZoneId | undefined {
  return STORY_ZONES[slug];
}
