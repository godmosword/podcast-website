import { describe, expect, it } from "vitest";
import { ZONE_IDS } from "@/data/universe-zones";
import {
  ZONE_ART_SRC_MAX_SCALE,
  ZONE_ART_TILE_WIDTH,
  getZoneArtSrcSet,
} from "./zone-art-src";

describe("getZoneArtSrcSet", () => {
  it("四島皆有 1x/2x/3x width descriptor", () => {
    for (const id of ZONE_IDS) {
      const { src, srcSet, sizes } = getZoneArtSrcSet(id);
      expect(src).toBe(`/adventures/zones/${id}.png`);
      expect(srcSet).toContain(`${id}.png ${ZONE_ART_TILE_WIDTH}w`);
      expect(srcSet).toContain(`${id}@2x.png ${ZONE_ART_TILE_WIDTH * 2}w`);
      expect(srcSet).toContain(`${id}@3x.png ${ZONE_ART_TILE_WIDTH * 3}w`);
      expect(sizes).toBe(`${Math.ceil(ZONE_ART_TILE_WIDTH * ZONE_ART_SRC_MAX_SCALE)}px`);
    }
  });
});
