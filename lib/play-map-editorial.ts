import type { Playground } from "@/data/playgrounds";
import {
  PLAY_MAP_EDITORIAL_PICKS,
  type PlayMapEditorialIntent,
  type PlayMapEditorialPick,
} from "@/data/play-map-editorial-picks";
import { haversineKm, type LatLng } from "@/lib/playground-distance";

export type PlayMapEditorialScope =
  | "national"
  | "nearby"
  | "city"
  | "viewport";

export type ResolvedPlayMapEditorialPick = {
  place: Playground;
  pick: PlayMapEditorialPick;
  matchedIntentCount: number;
};

export type ResolvePlayMapEditorialPickOptions = {
  finalResults: readonly Playground[];
  scope: PlayMapEditorialScope;
  activeIntents?: readonly PlayMapEditorialIntent[];
  userLatLng?: LatLng | null;
  picks?: readonly PlayMapEditorialPick[];
};

type Candidate = ResolvedPlayMapEditorialPick & {
  resultIndex: number;
  distanceKm: number | null;
};

/**
 * Resolves at most one editorial pick. The caller supplies the already
 * filtered/sorted final result set, so this layer never becomes a second
 * filtering engine or recommends a place outside the current scope.
 */
export function resolvePlayMapEditorialPick({
  finalResults,
  scope,
  activeIntents = [],
  userLatLng = null,
  picks = PLAY_MAP_EDITORIAL_PICKS,
}: ResolvePlayMapEditorialPickOptions): ResolvedPlayMapEditorialPick | null {
  if (scope === "national" || finalResults.length < 2) return null;

  const placesById = new Map(finalResults.map((place) => [place.id, place]));
  const activeIntentSet = new Set(activeIntents);
  const seenPickIds = new Set<string>();
  const candidates: Candidate[] = [];

  for (const pick of picks) {
    if (seenPickIds.has(pick.placeId)) continue;
    seenPickIds.add(pick.placeId);

    const place = placesById.get(pick.placeId);
    if (!place || place.status === "temporarily-closed") continue;

    candidates.push({
      place,
      pick,
      matchedIntentCount: pick.intents.filter((intent) =>
        activeIntentSet.has(intent),
      ).length,
      resultIndex: finalResults.findIndex((item) => item.id === place.id),
      distanceKm: userLatLng
        ? haversineKm(userLatLng, { lat: place.lat, lng: place.lng })
        : null,
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (a.matchedIntentCount !== b.matchedIntentCount) {
      return b.matchedIntentCount - a.matchedIntentCount;
    }

    // Nearby already sorts finalResults by distance. Calculate the distance
    // here as well so the resolver remains correct and directly testable when
    // supplied with an intentionally unsorted fixture.
    if (scope === "nearby" && a.distanceKm !== null && b.distanceKm !== null) {
      if (a.distanceKm !== b.distanceKm) return a.distanceKm - b.distanceKm;
    }

    const priorityDelta = (b.pick.priority ?? 0) - (a.pick.priority ?? 0);
    if (priorityDelta !== 0) return priorityDelta;
    return a.resultIndex - b.resultIndex;
  });

  const winner = candidates[0];
  return winner
    ? {
        place: winner.place,
        pick: winner.pick,
        matchedIntentCount: winner.matchedIntentCount,
      }
    : null;
}
