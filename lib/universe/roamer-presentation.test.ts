import { describe, expect, it } from "vitest";
import type { Roamer } from "@/data/universe-roamers";
import {
  MAX_MAP_ROAMERS,
  MAX_ISLAND_SIGNBOARD,
  roamerLayer,
  selectIslandRoamers,
  selectMapRoamers,
} from "./roamer-presentation";

function roamer(partial: Partial<Roamer> & Pick<Roamer, "id">): Roamer {
  return {
    characterId: "xiao-hong",
    routeId: "car-park-walkway",
    speed: 20,
    src: "/adventures/roamers/xiao-hong.png",
    enabled: true,
    ...partial,
  };
}

describe("roamerLayer", () => {
  it("有 zoneId → island", () => {
    expect(roamerLayer(roamer({ id: "a", zoneId: "car-park" }))).toBe("island");
  });

  it("無 zoneId → map", () => {
    expect(roamerLayer(roamer({ id: "b", routeId: "map-bridge-car-park-dino" }))).toBe(
      "map",
    );
  });
});

describe("selectMapRoamers", () => {
  const mapA = roamer({
    id: "map-a",
    routeId: "map-bridge-car-park-dino",
    idleSpot: { x: 346, y: 442 },
  });
  const mapB = roamer({
    id: "map-b",
    routeId: "map-bridge-dino-forest",
    idleSpot: { x: 250, y: 280 },
  });
  const mapC = roamer({
    id: "map-c",
    routeId: "map-bridge-car-park-dino",
    idleSpot: { x: 300, y: 400 },
  });
  const island = roamer({ id: "island-a", zoneId: "car-park" });

  it("未聚焦時只回 map 層，最多 MAX_MAP_ROAMERS", () => {
    const selected = selectMapRoamers([mapA, mapB, mapC, island], null, {
      devRoamers: false,
    });
    expect(selected.every((r) => roamerLayer(r) === "map")).toBe(true);
    expect(selected.length).toBeLessThanOrEqual(MAX_MAP_ROAMERS);
    expect(selected.map((r) => r.id)).toEqual(["map-a", "map-b"]);
  });

  it("聚焦島時隱藏全部 map roamer", () => {
    expect(
      selectMapRoamers([mapA, mapB], "car-park", { devRoamers: false }),
    ).toEqual([]);
  });

  it("enabled=false 預設不進遠景；devRoamers 可放行", () => {
    const disabled = roamer({
      id: "map-off",
      routeId: "map-bridge-car-park-dino",
      enabled: false,
      idleSpot: { x: 1, y: 2 },
    });
    expect(selectMapRoamers([disabled], null, { devRoamers: false })).toEqual([]);
    expect(selectMapRoamers([disabled], null, { devRoamers: true }).map((r) => r.id)).toEqual([
      "map-off",
    ]);
  });
});

describe("selectIslandRoamers", () => {
  const signA = roamer({ id: "roam-xiaohong", zoneId: "car-park" });
  const signB = roamer({ id: "roam-extra", zoneId: "car-park" });
  const dino = roamer({ id: "roam-aku", zoneId: "dino", characterId: "a-ku" });

  it("未聚焦時不顯示島內車", () => {
    expect(
      selectIslandRoamers([signA, dino], "car-park", null, { devRoamers: false }),
    ).toEqual([]);
  });

  it("聚焦該島時最多一台招牌", () => {
    const selected = selectIslandRoamers([signA, signB, dino], "car-park", "car-park", {
      devRoamers: false,
    });
    expect(selected).toHaveLength(MAX_ISLAND_SIGNBOARD);
    expect(selected[0]?.id).toBe("roam-xiaohong");
  });

  it("聚焦其他島時本島為空", () => {
    expect(
      selectIslandRoamers([signA], "car-park", "dino", { devRoamers: false }),
    ).toEqual([]);
  });
});
