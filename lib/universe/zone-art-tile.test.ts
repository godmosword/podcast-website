import { describe, expect, it } from "vitest";
import { ZONE_IDS, ZONES } from "@/data/universe-zones";
import {
  ZONE_ART_TILES,
  getZoneArtTile,
  zoneArtTilePath,
} from "./zone-art-tile";

describe("zoneArtTilePath", () => {
  it("每座島有對應整島 PNG 路徑（R1 黏土 diorama）", () => {
    for (const id of ZONE_IDS) {
      expect(zoneArtTilePath(id)).toBe(`/adventures/zones/${id}.png`);
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

  it("R1：四島皆 island／sand-bottom-center（整島黏土）", () => {
    for (const id of ZONE_IDS) {
      const tile = ZONE_ART_TILES[id];
      expect(tile.mode, id).toBe("island");
      expect(tile.anchor, id).toBe("sand-bottom-center");
    }
  });

  it("island 模式必附 stageSize 與 anchorUV", () => {
    for (const id of ZONE_IDS) {
      const tile = ZONE_ART_TILES[id];
      if (tile.mode === "island") {
        expect(tile.stageSize.w, id).toBeGreaterThan(0);
        expect(tile.stageSize.h, id).toBeGreaterThan(0);
        expect(tile.anchorUV.length, id).toBe(2);
        const [u, v] = tile.anchorUV;
        expect(u, id).toBeGreaterThan(0);
        expect(u, id).toBeLessThanOrEqual(1);
        expect(v, id).toBeGreaterThan(0);
        expect(v, id).toBeLessThanOrEqual(1);
      }
    }
  });
});
