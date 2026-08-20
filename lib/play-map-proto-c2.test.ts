import { describe, expect, it } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import { clusterPlaygroundsByCity } from "@/lib/playground-clusters";
import {
  PROTO_CONTAINER_PRESETS,
  computeProtoMetrics,
} from "./play-map-proto-metrics";
import { nationalWebMercatorProjector } from "./play-map-proto-project";
import { taiwanNationalWestEdge } from "./play-map-camera";
import {
  C2_MAX_LEADER_PX,
  clusterPlaygroundsByCityBbox,
  displaceCityMarkers,
  estimateClusterEntranceRect,
  listCircleOverlapPairs,
  listEntranceOverlapPairs,
} from "./play-map-proto-c2";

function layoutFor(preset: (typeof PROTO_CONTAINER_PRESETS)[number]) {
  const clusters = clusterPlaygroundsByCityBbox(listPlaygrounds());
  return displaceCityMarkers({
    clusters,
    width: preset.width,
    height: preset.height,
    projector: nationalWebMercatorProjector(preset.width, preset.height),
  });
}

function projected(
  clusters: ReturnType<typeof clusterPlaygroundsByCity>,
  width: number,
  height: number,
) {
  const projector = nationalWebMercatorProjector(width, height);
  return clusters.map((cluster) => {
    const point = projector.toPoint(cluster.lat, cluster.lng);
    return { city: cluster.city, x: point.x, y: point.y };
  });
}

describe("clusterPlaygroundsByCityBbox", () => {
  it("15 縣市，座標為該縣市場館 bounding box 中心", () => {
    const clusters = clusterPlaygroundsByCityBbox(listPlaygrounds());
    expect(clusters).toHaveLength(15);
    const tainanPlaces = listPlaygrounds().filter((place) => place.city === "台南市");
    const tainan = clusters.find((row) => row.city === "台南市");
    const lats = tainanPlaces.map((place) => place.lat);
    const lngs = tainanPlaces.map((place) => place.lng);
    expect(tainan?.lat).toBeCloseTo((Math.min(...lats) + Math.max(...lats)) / 2, 10);
    expect(tainan?.lng).toBeCloseTo((Math.min(...lngs) + Math.max(...lngs)) / 2, 10);
    expect(tainan?.count).toBe(tainanPlaces.length);
  });
});

describe("C2 gate", () => {
  it("算術質心＋44px 圓在 z=8 有 7 對重疊，對齊 Phase 0", () => {
    const preset = PROTO_CONTAINER_PRESETS[1]!;
    const pairs = listCircleOverlapPairs(
      projected(
        clusterPlaygroundsByCity(listPlaygrounds()),
        preset.width,
        preset.height,
      ),
    );
    expect(pairs).toHaveLength(7);
    expect(pairs[0]).toMatchObject({ a: "嘉義市", b: "嘉義縣" });
    expect(pairs[0]?.gapPx).toBeCloseTo(13.3, 1);
  });

  it("bbox 質心修前仍有入口 rect 重疊；位移後兩種容器都 15/15、0 重疊、西緣≥120.35", () => {
    for (const preset of PROTO_CONTAINER_PRESETS) {
      const before = listEntranceOverlapPairs(
        projected(
          clusterPlaygroundsByCityBbox(listPlaygrounds()),
          preset.width,
          preset.height,
        ),
      );
      expect(before.length).toBeGreaterThan(0);

      const layout = layoutFor(preset);
      expect(layout.unsolved).toEqual([]);
      expect(layout.markers).toHaveLength(15);
      expect(
        layout.markers.every((marker) => marker.leaderPx <= C2_MAX_LEADER_PX + 1e-6),
      ).toBe(true);

      const after = listEntranceOverlapPairs(
        layout.markers.map((marker) => ({
          city: marker.city,
          x: marker.displayX,
          y: marker.displayY,
        })),
      );
      expect(after).toEqual([]);

      const metrics = computeProtoMetrics({
        variant: "C2",
        preset,
        items: layout.markers.map((marker) => ({
          id: marker.city,
          rect: estimateClusterEntranceRect(
            marker.city,
            marker.displayX,
            marker.displayY,
          ),
        })),
        westEdge: taiwanNationalWestEdge(preset.width),
        c2Unsolved: layout.unsolved,
      });
      expect(metrics.entranceCount).toBe(15);
      expect(metrics.fullyInFrame).toBe(15);
      expect(metrics.partiallyClipped).toBe(0);
      expect(metrics.overlapPairs).toBe(0);
      expect(metrics.westEdgeOk).toBe(true);
    }
  });

  it("位移是決定性的：同樣輸入永遠同樣輸出", () => {
    const preset = PROTO_CONTAINER_PRESETS[1]!;
    expect(layoutFor(preset)).toEqual(layoutFor(preset));
  });
});
