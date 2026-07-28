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

  it("非主島與恐龍島同尺；車車樂園維持 hero weenie", () => {
    const dino = getZoneArtTile("dino");
    const forest = getZoneArtTile("forest");
    const rescue = getZoneArtTile("rescue");
    const ocean = getZoneArtTile("ocean");
    const carPark = getZoneArtTile("car-park");
    expect(dino.mode).toBe("island");
    if (dino.mode !== "island") return;
    expect(forest.mode).toBe("island");
    expect(rescue.mode).toBe("island");
    expect(ocean.mode).toBe("island");
    expect(carPark.mode).toBe("island");
    if (
      forest.mode !== "island" ||
      rescue.mode !== "island" ||
      ocean.mode !== "island" ||
      carPark.mode !== "island"
    ) {
      return;
    }
    expect(forest.stageSize).toEqual(dino.stageSize);
    expect(rescue.stageSize).toEqual(dino.stageSize);
    expect(ocean.stageSize).toEqual(dino.stageSize);
    expect(carPark.stageSize.w).toBeGreaterThan(dino.stageSize.w);
    expect(carPark.stageSize.h).toBeGreaterThan(dino.stageSize.h);
  });
});
