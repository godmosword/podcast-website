import { describe, expect, it } from "vitest";
import { getIslandGround, islandGroundFor } from "./island-ground";
import { getZoneArtTile } from "./zone-art-tile";

const BASE = { w: 264, h: 260 } as const;
const ANCHOR = { x: 400, y: 500 } as const;

describe("islandGroundFor", () => {
  it("reproduces the pre-refactor hardcoded shadow for the base 264x260 tile", () => {
    // 重構前 UniverseMap.tsx 對每島硬寫 rx=112 ry=34 cy=+30；基準島須零視覺差。
    const { shadow } = islandGroundFor(BASE, ANCHOR);
    expect(shadow).toEqual({ cx: 400, cy: 530, rx: 112, ry: 34 });
  });

  it("scales the shadow with the hero tile so car-park stops floating", () => {
    const hero = { w: 330, h: 325 };
    const { shadow } = islandGroundFor(hero, ANCHOR);
    expect(shadow.rx).toBeGreaterThan(112);
    expect(shadow.ry).toBeGreaterThan(34);
    // 1.25x tile ⇒ 1.25x 影子，比例維持不變
    expect(shadow.rx / shadow.ry).toBeCloseTo(112 / 34, 1);
  });

  it("drops the shadow further below the anchor for a taller tile", () => {
    const base = islandGroundFor(BASE, ANCHOR).shadow;
    const hero = islandGroundFor({ w: 330, h: 325 }, ANCHOR).shadow;
    expect(hero.cy).toBeGreaterThan(base.cy);
  });

  it("puts the shoal wider and flatter than the shadow, sharing the anchor x", () => {
    const { shadow, shoal } = islandGroundFor(BASE, ANCHOR);
    expect(shoal.rx).toBeGreaterThan(shadow.rx);
    expect(shoal.cx).toBe(ANCHOR.x);
    // 淺灘比接地影更扁 ⇒ 讀作水面向外散開，而非第二顆影子
    expect(shoal.ry / shoal.rx).toBeLessThan(shadow.ry / shadow.rx);
  });

  it("sits the shoal above the shadow so the shadow reads as the contact point", () => {
    const { shadow, shoal } = islandGroundFor(BASE, ANCHOR);
    expect(shoal.cy).toBeLessThan(shadow.cy);
  });

  it("scales the shoal with the tile too", () => {
    const base = islandGroundFor(BASE, ANCHOR).shoal;
    const hero = islandGroundFor({ w: 330, h: 325 }, ANCHOR).shoal;
    expect(hero.rx).toBeGreaterThan(base.rx);
  });

  it("returns integers so the SVG markup stays stable across renders", () => {
    const { shadow, shoal } = islandGroundFor({ w: 331, h: 327 }, { x: 1, y: 2 });
    for (const v of [shadow.rx, shadow.ry, shadow.cy, shoal.rx, shoal.ry, shoal.cy]) {
      expect(Number.isInteger(v)).toBe(true);
    }
  });
});

describe("getIslandGround", () => {
  it("derives car-park from its hero stageSize, not from the base tile", () => {
    const carPark = getIslandGround("car-park", ANCHOR);
    const dino = getIslandGround("dino", ANCHOR);
    expect(carPark).not.toBeNull();
    expect(dino).not.toBeNull();
    expect(carPark!.shadow.rx).toBeGreaterThan(dino!.shadow.rx);
  });

  it("matches islandGroundFor fed with the same tile stageSize", () => {
    const tile = getZoneArtTile("dino");
    if (tile.mode !== "island") throw new Error("dino should be an island tile");
    expect(getIslandGround("dino", ANCHOR)).toEqual(
      islandGroundFor(tile.stageSize, ANCHOR),
    );
  });

  it("gives every island zone a ground so no island is left unanchored", () => {
    for (const id of ["car-park", "dino", "rescue", "ocean", "forest"] as const) {
      expect(getIslandGround(id, ANCHOR)).not.toBeNull();
    }
  });
});
