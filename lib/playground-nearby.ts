import type { Playground } from "@/data/playgrounds";
import { haversineKm } from "@/lib/playground-distance";

export type NearbyPlayground = {
  place: Playground;
  distanceKm: number;
};

/**
 * Resolve globally nearest open places. Administrative boundaries are not a
 * proxy for proximity, so a nearby place in another city may rank first.
 */
export function resolveNearbyPlaces(
  current: Pick<Playground, "id" | "lat" | "lng">,
  places: readonly Playground[],
  limit = 3,
): NearbyPlayground[] {
  const count = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 0;
  if (count === 0) return [];

  return places
    .filter(
      (place) =>
        place.id !== current.id && place.status !== "temporarily-closed",
    )
    .map((place) => ({
      place,
      distanceKm: haversineKm(current, { lat: place.lat, lng: place.lng }),
    }))
    .sort((a, b) => {
      if (a.distanceKm !== b.distanceKm) {
        return a.distanceKm - b.distanceKm;
      }
      return a.place.id.localeCompare(b.place.id, "en");
    })
    .slice(0, count);
}

export function formatNearbyDistanceLabel(distanceKm: number): string {
  return `直線距離約 ${distanceKm.toFixed(1)} 公里`;
}
