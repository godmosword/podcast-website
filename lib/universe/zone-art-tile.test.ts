import { describe, expect, it } from "vitest";
import { ZONE_IDS, ZONES } from "@/data/universe-zones";
import { zoneArtTilePath } from "./zone-art-tile";

describe("zoneArtTilePath", () => {
  it("每座島有對應靜態 tile 路徑", () => {
    for (const id of ZONE_IDS) {
      expect(zoneArtTilePath(id)).toBe(`/adventures/zones/${id}.svg`);
    }
  });

  it("ZONES 皆設定 artTile", () => {
    for (const zone of ZONES) {
      expect(zone.artTile, zone.id).toBe(zoneArtTilePath(zone.id));
    }
  });
});
