import { describe, expect, it } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  INDIVIDUAL_MARKER_MIN_ZOOM,
  clusterPlaygroundsByZoom,
  playMapMarkerMode,
} from "./playground-clusters";

const base = {
  district: "區",
  address: "x",
  type: "公園" as const,
  ageRange: [3, 8] as [number, number],
  indoor: false,
  free: true,
  facilities: [] as string[],
  tags: [] as string[],
  sources: [],
  lastVerified: "2026-01-01",
  tips: "",
};

describe("zoom-aware marker modes", () => {
  it("z9–12 走 spatial，z13 以上走 individual", () => {
    expect(playMapMarkerMode(8)).toBe("spatial");
    expect(playMapMarkerMode(11)).toBe("spatial");
    expect(playMapMarkerMode(INDIVIDUAL_MARKER_MIN_ZOOM)).toBe("individual");
  });
});

describe("clusterPlaygroundsByZoom", () => {
  it("相同網格 deterministic 聚合，單筆格保留原 place", () => {
    const places = [
      {
        ...base,
        id: "a",
        name: "A",
        city: "台北市",
        lat: 25.02,
        lng: 121.52,
      },
      {
        ...base,
        id: "b",
        name: "B",
        city: "台北市",
        lat: 25.04,
        lng: 121.54,
      },
      {
        ...base,
        id: "c",
        name: "C",
        city: "新竹市",
        lat: 24.8,
        lng: 120.96,
      },
    ] as Playground[];

    const clusters = clusterPlaygroundsByZoom(places, 11);
    expect(clusters).toHaveLength(2);
    expect(clusters.find((cluster) => cluster.count === 2)?.places.map((place) => place.id)).toEqual([
      "a",
      "b",
    ]);
    expect(clusters.find((cluster) => cluster.count === 1)?.places[0]?.id).toBe(
      "c",
    );
    expect(clusterPlaygroundsByZoom([...places].reverse(), 11)).toEqual(clusters);
  });
});
