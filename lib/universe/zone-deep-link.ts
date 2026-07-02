import { ZONES, ZONE_IDS, type ZoneDef, type ZoneId } from "@/data/universe-zones";

/** 解析 ?zone=dino；無效 id 回 null。 */
export function parseZoneDeepLink(raw: string | null): ZoneDef | null {
  if (!raw) return null;
  if (!ZONE_IDS.includes(raw as ZoneId)) return null;
  return ZONES.find((z) => z.id === raw) ?? null;
}

/** 從 search params 字串解析 zone（不含前導 ?）。 */
export function parseZoneDeepLinkFromSearch(search: string): ZoneDef | null {
  const raw = new URLSearchParams(search.startsWith("?") ? search : `?${search}`).get(
    "zone",
  );
  return parseZoneDeepLink(raw);
}
