import { describe, expect, it } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import {
  playgroundCityShortName,
  playgroundDetailDescription,
  playgroundDetailPath,
  playgroundDetailTitle,
  playgroundFromRouteParam,
  RESERVED_PLAY_MAP_SEGMENTS,
} from "./playground-detail";

describe("playground detail route helpers", () => {
  it("uses Playground.id and resolves encoded route params", () => {
    const place = listPlaygrounds()[0];

    expect(playgroundFromRouteParam(place.id)).toEqual(place);
    expect(playgroundFromRouteParam(encodeURIComponent(place.id))).toEqual(place);
    expect(playgroundFromRouteParam("google-place-id")).toBeUndefined();
    expect(playgroundFromRouteParam("%E0%A4%A")).toBeUndefined();
  });

  it("keeps current IDs unique and produces the canonical path", () => {
    const places = listPlaygrounds();
    const ids = places.map((place) => place.id);

    expect(places).toHaveLength(98);
    expect(new Set(ids).size).toBe(98);
    expect(playgroundDetailPath("ty-kids-museum")).toBe(
      "/for-parents/play-map/ty-kids-museum",
    );
  });

  it("reserves the future collections namespace", () => {
    expect(RESERVED_PLAY_MAP_SEGMENTS.has("collections")).toBe(true);
  });

  it("uses the short city name only in the title", () => {
    const place = listPlaygrounds().find((item) => item.id === "ty-kids-museum");
    expect(place).toBeDefined();
    expect(playgroundCityShortName("桃園市")).toBe("桃園");
    expect(playgroundDetailTitle(place!)).toBe(
      "桃園市立兒童美術館｜桃園親子景點｜車車遊樂園",
    );
    expect(playgroundDetailDescription(place!)).toContain(place!.tips);
    expect(playgroundDetailDescription(place!)).toContain("室內");
    expect(playgroundDetailDescription(place!)).toContain("免費");
  });
});
