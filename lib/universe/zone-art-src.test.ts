import { describe, expect, it } from "vitest";
import { ZONE_IDS } from "@/data/universe-zones";
import {
  ZONE_ART_SRC_MAX_SCALE,
  ZONE_ART_TILE_WIDTH,
  buildZoneArtSrcSet,
  getZoneArtSizes,
  getZoneArtSrcSet,
  getZoneNightArtSrcSet,
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

describe("getZoneNightArtSrcSet", () => {
  it("hasNightArt 未備（現況所有島）回傳 null，夜間沿用日圖零 404", () => {
    for (const id of ZONE_IDS) {
      expect(getZoneNightArtSrcSet(id)).toBeNull();
    }
  });

  it("night 變體組 .night 系列路徑（§12.6 點號慣例；資產解凍後翻 hasNightArt 即點亮）", () => {
    const night = buildZoneArtSrcSet("dino", ZONE_ART_SRC_MAX_SCALE, "night");
    expect(night.src).toBe("/adventures/zones/dino.night.png");
    expect(night.webpSrc).toBe("/adventures/zones/dino.night.webp");
    expect(night.srcSet).toContain(`dino.night@2x.png ${ZONE_ART_TILE_WIDTH * 2}w`);
    expect(night.webpSrcSet).toContain(
      `dino.night@3x.webp ${ZONE_ART_TILE_WIDTH * 3}w`,
    );
  });
});

describe("getZoneArtSizes", () => {
  it("clamp 在 MIN_SCALE 0.6 與 MAX_SCALE 2.4", () => {
    expect(getZoneArtSizes(0.3)).toBe(`${Math.ceil(ZONE_ART_TILE_WIDTH * 0.6)}px`);
    expect(getZoneArtSizes(3)).toBe(`${Math.ceil(ZONE_ART_TILE_WIDTH * 2.4)}px`);
  });
});
