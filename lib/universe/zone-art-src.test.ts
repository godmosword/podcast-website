import { describe, expect, it } from "vitest";
import { ZONE_IDS } from "@/data/universe-zones";
import {
  ZONE_ART_SRC_MAX_SCALE,
  ZONE_ART_TILE_WIDTH,
  getZoneArtSizes,
  getZoneArtSrcSet,
} from "./zone-art-src";

describe("getZoneArtSrcSet", () => {
  it("四島皆有 1x/2x/3x width descriptor", () => {
    for (const id of ZONE_IDS) {
      const { src, srcSet, webpSrc, webpSrcSet, sizes } = getZoneArtSrcSet(id);
      expect(src).toBe(`/adventures/zones/${id}.png`);
      expect(webpSrc).toBe(`/adventures/zones/${id}.webp`);
      expect(srcSet).toContain(`${id}.png ${ZONE_ART_TILE_WIDTH}w`);
      expect(srcSet).toContain(`${id}@2x.png ${ZONE_ART_TILE_WIDTH * 2}w`);
      expect(srcSet).toContain(`${id}@3x.png ${ZONE_ART_TILE_WIDTH * 3}w`);
      expect(webpSrcSet).toContain(`${id}.webp ${ZONE_ART_TILE_WIDTH}w`);
      expect(webpSrcSet).toContain(`${id}@2x.webp ${ZONE_ART_TILE_WIDTH * 2}w`);
      expect(webpSrcSet).toContain(`${id}@3x.webp ${ZONE_ART_TILE_WIDTH * 3}w`);
      expect(sizes).toBe(getZoneArtSizes(ZONE_ART_SRC_MAX_SCALE));
    }
  });

  it("sizes 隨 mapScale 縮小以減少 overfetch", () => {
    const zoomedOut = getZoneArtSrcSet("car-park", 1);
    const zoomedIn = getZoneArtSrcSet("car-park", 2.4);
    expect(parseInt(zoomedOut.sizes, 10)).toBeLessThan(parseInt(zoomedIn.sizes, 10));
  });
});

describe("getZoneArtSizes", () => {
  it("clamp 在 MIN_SCALE 0.6 與 MAX_SCALE 2.4", () => {
    expect(getZoneArtSizes(0.3)).toBe(`${Math.ceil(ZONE_ART_TILE_WIDTH * 0.6)}px`);
    expect(getZoneArtSizes(3)).toBe(`${Math.ceil(ZONE_ART_TILE_WIDTH * 2.4)}px`);
  });
});
