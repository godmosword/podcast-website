import type { ZoneId } from "@/data/universe-zones";

/**
 * 世界層的編輯式展示文案。
 *
 * 只服務地圖視覺層，不改 Zone 的路由／狀態／hotspot 契約；
 * 中文正式名稱仍以 data/universe.ts 為權威來源。
 */
export type EditorialZoneMeta = {
  index: string;
  englishName: string;
  kicker: string;
  featured?: boolean;
};

export const EDITORIAL_ZONE_META: Record<ZoneId, EditorialZoneMeta> = {
  "car-park": {
    index: "01",
    englishName: "CHE CHE PLAYGROUND",
    kicker: "STORIES · PLAY",
  },
  dino: {
    index: "02",
    englishName: "DINO ISLAND",
    kicker: "DINOSAUR ADVENTURE",
  },
  rescue: {
    index: "03",
    englishName: "RESCUE ISLAND",
    kicker: "RESCUE STORIES",
  },
  ocean: {
    index: "04",
    englishName: "DREAM ISLAND",
    kicker: "DREAMING AHEAD",
  },
  forest: {
    index: "05",
    englishName: "FOREST ISLAND",
    kicker: "LIFE EXPLORATION",
    featured: true,
  },
};
