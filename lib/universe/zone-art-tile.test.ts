import { describe, expect, it } from "vitest";
import { ZONE_IDS, ZONES } from "@/data/universe-zones";
import {
  ZONE_ART_TILES,
  getZoneArtTile,
  zoneArtTilePath,
} from "./zone-art-tile";

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

describe("ZONE_ART_TILES 詮釋資料契約", () => {
  it("每座島皆有 tile 詮釋資料且 src 對齊路徑", () => {
    for (const id of ZONE_IDS) {
      const tile = getZoneArtTile(id);
      expect(tile, id).toBeDefined();
      expect(tile.src).toBe(zoneArtTilePath(id));
    }
  });

  it("R1 現況：全島 landmark／center（不改視覺）", () => {
    for (const id of ZONE_IDS) {
      const tile = ZONE_ART_TILES[id];
      expect(tile.mode, id).toBe("landmark");
      expect(tile.anchor, id).toBe("center");
    }
  });

  it("island 模式必附 stageSize（landmark 不需）", () => {
    for (const id of ZONE_IDS) {
      const tile = ZONE_ART_TILES[id];
      if (tile.mode === "island") {
        // union 收斂後 stageSize 為必填，無需 non-null assertion
        expect(tile.stageSize.w, id).toBeGreaterThan(0);
        expect(tile.stageSize.h, id).toBeGreaterThan(0);
      }
    }
  });
});
