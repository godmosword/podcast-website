import { describe, expect, it } from "vitest";
import {
  TAIWAN_NATIONAL_MAX_ZOOM,
  taiwanNationalView,
  taiwanNationalWestEdge,
} from "./play-map-camera";
import {
  nationalWebMercatorProjector,
} from "./play-map-proto-project";

describe("nationalWebMercatorProjector", () => {
  it("與 taiwanNationalView 對齊：中心在容器正中、西緣 120.35、zoom 8", () => {
    for (const width of [366, 600]) {
      const view = taiwanNationalView(width);
      const projector = nationalWebMercatorProjector(width, 512);
      const center = projector.toPoint(view.center[0], view.center[1]);
      expect(center.x).toBeCloseTo(width / 2, 5);
      expect(center.y).toBeCloseTo(256, 5);
      expect(view.zoom).toBe(TAIWAN_NATIONAL_MAX_ZOOM);
      expect(taiwanNationalWestEdge(width)).toBeCloseTo(120.35, 5);
    }
  });
});
