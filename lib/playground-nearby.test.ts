import { describe, expect, it } from "vitest";
import type { Playground } from "@/data/playgrounds";
import {
  formatNearbyDistanceLabel,
  resolveNearbyPlaces,
} from "./playground-nearby";

const base = {
  district: "區",
  address: "x",
  type: "公園" as const,
  ageRange: [3, 8] as [number, number],
  free: true,
  indoor: false,
  facilities: ["遊戲場"],
  tags: ["免費"],
  tips: "這是一段足夠描述親子使用情境的測試資料。",
  sources: [{ kind: "gov" as const, name: "政府資料", url: "https://example.com" }],
  lastVerified: "2026-01-01",
};

function place(
  id: string,
  city: string,
  lat: number,
  lng: number,
  status?: Playground["status"],
): Playground {
  return { ...base, id, name: id, city, lat, lng, status };
}

describe("resolveNearbyPlaces", () => {
  it("sorts globally by geography, not by city", () => {
    const current = place("current", "台北市", 25, 121);
    const places = [
      place("far-taipei", "台北市", 25.1, 121),
      place("near-new-taipei", "新北市", 25.01, 121),
    ];

    expect(resolveNearbyPlaces(current, places, 2).map((item) => item.place.id)).toEqual([
      "near-new-taipei",
      "far-taipei",
    ]);
  });

  it("excludes the current and temporarily closed places", () => {
    const current = place("current", "台北市", 25, 121);
    const places = [
      current,
      place("closed", "台北市", 25.001, 121, "temporarily-closed"),
      place("open", "台北市", 25.002, 121),
    ];

    expect(resolveNearbyPlaces(current, places).map((item) => item.place.id)).toEqual([
      "open",
    ]);
  });

  it("uses ID as a deterministic tie-break and caps at three", () => {
    const current = place("current", "台北市", 25, 121);
    const places = [
      place("c", "台北市", 25.01, 121),
      place("a", "台北市", 25.01, 121),
      place("b", "台北市", 25.01, 121),
      place("d", "台北市", 25.01, 121),
    ];

    expect(resolveNearbyPlaces(current, places).map((item) => item.place.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("formatNearbyDistanceLabel", () => {
  it("states that the distance is straight-line proximity", () => {
    expect(formatNearbyDistanceLabel(2.345)).toBe("直線距離約 2.3 公里");
  });
});
