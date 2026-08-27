import type { Playground } from "@/data/playgrounds";
import { getPlayground } from "@/data/playgrounds";
import { formatAgeRangeLabel } from "@/lib/playground-distance";
import { clipParentVoice } from "@/lib/playground-parent-voice";
import { getSiteUrl } from "@/lib/site-url";

/** Reserved child routes under /for-parents/play-map（靜態段優先於 [placeId]）。 */
export const RESERVED_PLAY_MAP_SEGMENTS = new Set(["collections"]);

export function playgroundDetailPath(placeId: string): string {
  return `/for-parents/play-map/${encodeURIComponent(placeId)}`;
}

export function playgroundDetailUrl(placeId: string): string {
  return `${getSiteUrl()}${playgroundDetailPath(placeId)}`;
}

export function playgroundFromRouteParam(
  routeParam: string,
): Playground | undefined {
  try {
    return getPlayground(decodeURIComponent(routeParam));
  } catch {
    return undefined;
  }
}

export function playgroundCityShortName(city: string): string {
  return city.replace(/[市縣]$/, "");
}

export function playgroundDetailTitle(place: Playground): string {
  return `${place.name}｜${playgroundCityShortName(place.city)}親子景點｜車車遊樂園`;
}

/**
 * Detail metadata stays factual and reuses the original parent note instead
 * of generating a second editorial voice.
 */
export function playgroundDetailDescription(place: Playground): string {
  const location = `${place.city}${place.district ?? ""}`;
  const access = place.free ? "免費" : "需購票";
  const environment = place.indoor ? "室內" : "戶外";
  const tip = clipParentVoice(place.tips, 72);

  return `${place.name}位於${location}，是${place.type}，${access}、${environment}，適合${formatAgeRangeLabel(place.ageRange)}。${tip}`;
}
