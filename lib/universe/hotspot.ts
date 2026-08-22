/**
 * 島內熱點：路徑／座標／prefetch 目標（M2）。
 * `pos` 為島 tile 本地 UV（0–1），對齊 zone-art-tile 的 stageSize 框。
 */
import {
  zoneById,
  type Hotspot,
  type Zone,
  type ZoneId,
} from "@/data/universe";
import { resolveUniverseMap, type ResolvedZone } from "@/lib/universe-map";

export type HotspotStagePoint = { x: number; y: number };

/** `/adventures/<zone>/<hotspot>` */
export function hotspotPath(zoneId: ZoneId | string, hotspotId: string): string {
  return `/adventures/${zoneId}/${hotspotId}`;
}

export function hotspotById(
  zoneId: string,
  hotspotId: string,
): { zone: Zone; hotspot: Hotspot } | null {
  const zone = zoneById(zoneId);
  if (!zone) return null;
  const hotspot = zone.hotspots.find((h) => h.id === hotspotId);
  if (!hotspot) return null;
  return { zone, hotspot };
}

/** 島圖上要呈現的精選地標；資料順序不影響編輯選擇。 */
export function getFeaturedHotspots(
  hotspots: readonly Hotspot[],
): Hotspot[] {
  return hotspots.filter((hotspot) => hotspot.featured);
}

/** 島嶼 sheet 的探索列排序：精選先列出，其餘維持資料順序。 */
export function sortHotspotsForDisplay(
  hotspots: readonly Hotspot[],
): Hotspot[] {
  return [...hotspots].sort(
    (a, b) => Number(b.featured) - Number(a.featured),
  );
}

/** 熱點動作的最終導向（供 Link／prefetch）；locked 仍指向自身 modal 路徑。 */
export function hotspotActionHref(
  zoneId: string,
  hotspot: Hotspot,
): string {
  if (hotspot.action.type === "link") return hotspot.action.href;
  if (hotspot.action.type === "story") return `/story/${hotspot.action.slug}`;
  return hotspotPath(zoneId, hotspot.id);
}

/** 是否應以站內 hotspot 路由開啟（modal／詳情），而非直接外連。 */
export function usesHotspotRoute(hotspot: Hotspot): boolean {
  return hotspot.action.type === "locked" || hotspot.action.type === "story";
}

/**
 * link 型：可直接去目的地，也可開 hotspot 詳情頁。
 * M2 統一先走 hotspot 路由（可攔截為 modal），詳情內再給主 CTA。
 */
export function hotspotDetailHref(zoneId: string, hotspot: Hotspot): string {
  return hotspotPath(zoneId, hotspot.id);
}

/** tile UV → stage px（島 tileBox 內）。 */
export function hotspotToStage(
  zone: ResolvedZone,
  hotspot: Hotspot,
): HotspotStagePoint {
  const { left, top, w, h } = zone.tileBox;
  return {
    x: left + hotspot.pos.x * w,
    y: top + hotspot.pos.y * h,
  };
}

export function resolvedZoneById(zoneId: string): ResolvedZone | undefined {
  return resolveUniverseMap().zones.find((z) => z.id === zoneId);
}

/** 進島後應 prefetch 的 URL 清單（hotspot 詳情 + 動作目標）。 */
export function hotspotPrefetchHrefs(zone: Zone): string[] {
  const hrefs = new Set<string>();
  for (const hotspot of zone.hotspots) {
    hrefs.add(hotspotDetailHref(zone.id, hotspot));
    // Next's router prefetch only applies to same-origin app routes. External
    // actions (for example the YouTube playlist) are opened from the detail
    // page and must not trigger a speculative navigation request here.
    if (
      hotspot.action.type === "link" &&
      hotspot.action.href.startsWith("/")
    ) {
      hrefs.add(hotspot.action.href);
    }
    if (hotspot.action.type === "story") {
      hrefs.add(`/story/${hotspot.action.slug}`);
    }
  }
  return [...hrefs];
}
