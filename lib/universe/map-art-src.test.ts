import { describe, expect, it } from "vitest";
import { CLOUD_IDS, cloudPath, moonPath, seaTexturePath, sunPath } from "./map-art-src";

describe("seaTexturePath", () => {
  it("日/夜對應不同海面素材", () => {
    expect(seaTexturePath(false)).toBe("/adventures/map/sea.png");
    expect(seaTexturePath(true)).toBe("/adventures/map/sea-night.png");
    expect(seaTexturePath()).toBe("/adventures/map/sea.png");
  });
});

describe("cloudPath", () => {
  it("三朵雲皆為 map 目錄透明 PNG", () => {
    expect(CLOUD_IDS).toHaveLength(3);
    for (const id of CLOUD_IDS) {
      expect(cloudPath(id)).toBe(`/adventures/map/${id}.png`);
    }
  });
});

describe("sun/moon", () => {
  it("日月為 map 目錄透明 PNG", () => {
    expect(sunPath()).toBe("/adventures/map/sun.png");
    expect(moonPath()).toBe("/adventures/map/moon.png");
  });
});
