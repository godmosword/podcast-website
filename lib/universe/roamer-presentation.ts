import type { Roamer } from "@/data/universe-roamers";
import { shouldRenderRoamer } from "@/data/universe-roamers";
import type { ZoneId } from "@/data/universe-zones";

/** 遠景同時最多可見台數。 */
export const MAX_MAP_ROAMERS = 2;

/** 近景每島招牌車台數。 */
export const MAX_ISLAND_SIGNBOARD = 1;

export type RoamerLayer = "map" | "island";

export function roamerLayer(roamer: Roamer): RoamerLayer {
  return roamer.zoneId ? "island" : "map";
}

export type RoamerSelectOpts = {
  devRoamers: boolean;
};

/** 遠景 map 層：未聚焦島時最多 MAX_MAP_ROAMERS；聚焦時隱藏。 */
export function selectMapRoamers(
  roamers: readonly Roamer[],
  focusedZoneId: ZoneId | null,
  opts: RoamerSelectOpts,
): Roamer[] {
  if (focusedZoneId) return [];
  const map = roamers.filter(
    (r) => roamerLayer(r) === "map" && shouldRenderRoamer(r, opts.devRoamers),
  );
  return map.slice(0, MAX_MAP_ROAMERS);
}

/** 近景島內：僅聚焦該島時顯示，最多一台招牌。 */
export function selectIslandRoamers(
  roamers: readonly Roamer[],
  zoneId: ZoneId,
  focusedZoneId: ZoneId | null,
  opts: RoamerSelectOpts,
): Roamer[] {
  if (focusedZoneId !== zoneId) return [];
  const island = roamers.filter(
    (r) =>
      roamerLayer(r) === "island" &&
      r.zoneId === zoneId &&
      shouldRenderRoamer(r, opts.devRoamers),
  );
  return island.slice(0, MAX_ISLAND_SIGNBOARD);
}
