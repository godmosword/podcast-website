/**
 * 親子遊樂地圖距離粗估、排序與卡片決策標籤。
 * 開車分鐘為市區啟發式，非即時路況。
 */
import type { Playground } from "@/data/playgrounds";

export type LatLng = { lat: number; lng: number };

const EARTH_RADIUS_KM = 6371;
/** 市區開車粗估：約 2.8 分／km。 */
const MINUTES_PER_KM = 2.8;
const MIN_DRIVE_MINUTES = 1;
const MAX_DRIVE_MINUTES = 90;

const STROLLER_NEGATIVE =
  /推車(?:慎選|不宜|不便)|不宜推車|推車困難|階梯多|坡道多/;
const STROLLER_POSITIVE = /推車友善|推車可行|好推車|可推車/;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function estimateDriveMinutes(km: number): number {
  if (!Number.isFinite(km) || km <= 0) return MIN_DRIVE_MINUTES;
  const raw = Math.round(km * MINUTES_PER_KM);
  return Math.min(MAX_DRIVE_MINUTES, Math.max(MIN_DRIVE_MINUTES, raw));
}

export function formatDriveMinutesLabel(minutes: number): string {
  return `約 ${minutes} 分鐘`;
}

/**
 * 有定位才顯示。觸頂（90 分）改開放式文案，避免中台灣場館被讀成「剛好 90 分」。
 */
export function formatPlaceDistanceLabel(
  place: LatLng,
  user: LatLng | null | undefined,
): string | null {
  if (!user) return null;
  const minutes = estimateDriveMinutes(haversineKm(user, place));
  if (minutes >= MAX_DRIVE_MINUTES) {
    return `車程 ${MAX_DRIVE_MINUTES} 分以上`;
  }
  return formatDriveMinutesLabel(minutes);
}

export function sortPlaygrounds(
  places: readonly Playground[],
  user: LatLng | null | undefined,
): Playground[] {
  const copy = [...places];
  if (user) {
    copy.sort((a, b) => {
      const da = haversineKm(user, { lat: a.lat, lng: a.lng });
      const db = haversineKm(user, { lat: b.lat, lng: b.lng });
      if (da !== db) return da - db;
      return a.name.localeCompare(b.name, "zh-Hant");
    });
    return copy;
  }
  copy.sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1;
    return a.name.localeCompare(b.name, "zh-Hant");
  });
  return copy;
}

type StrollerFields = Pick<Playground, "tags" | "facilities" | "tips">;

function placeTextBlob(place: StrollerFields): string {
  return [
    ...place.tags,
    ...place.facilities,
    place.tips ?? "",
  ].join(" ");
}

/** 啟發式：明確正面且無風險語才顯示「推車友善」。 */
export function isStrollerFriendly(place: StrollerFields): boolean {
  const blob = placeTextBlob(place);
  if (!blob) return false;
  if (STROLLER_NEGATIVE.test(blob)) return false;
  return STROLLER_POSITIVE.test(blob);
}

export function formatAgeRangeLabel(ageRange: [number, number]): string {
  return `${ageRange[0]}–${ageRange[1]} 歲`;
}

type DecisionTagFields = Pick<
  Playground,
  "free" | "indoor" | "ageRange" | "tags" | "facilities" | "tips"
>;

/** 卡片／精簡 sheet 決策標籤（有資料才出現）。 */
export function listPlaceDecisionTags(place: DecisionTagFields): string[] {
  const tags: string[] = [];
  if (place.free) tags.push("免費");
  if (place.indoor) tags.push("室內");
  if (isStrollerFriendly(place)) tags.push("推車友善");
  tags.push(formatAgeRangeLabel(place.ageRange));
  return tags;
}
