/** 各島靜態 art tile 路徑（`/public/adventures/zones/`）。設計師 PNG 就緒後只改 ZONES.artTile。 */
import type { ZoneId } from "@/data/universe-zones";

export function zoneArtTilePath(id: ZoneId): string {
  return `/adventures/zones/${id}.svg`;
}
