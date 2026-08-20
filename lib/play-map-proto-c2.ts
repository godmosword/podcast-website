/**
 * Variant C2：bbox 質心＋決定性位移。
 *
 * 質心改 bounding box 中心，不是算術平均。場館常堆在都會一側，算術質心
 * 會被密度拉走；bbox 中心是覆蓋範圍的幾何中間。它不能單獨拆開嘉義市／縣
 * 這種天生靠近的對，位移才是解重疊與出框的手段。
 *
 * 連接線上限 104px。全國鏡頭西緣釘在 120.35，西部縣市的真位置會在容器外；
 * 入口 rect 含縣市名標籤，只入框就需要約 65–75px。北部四縣市被夾到頂緣後
 * 還要再分開。104px 是此演算法在 366×780 與 600×512、保守字寬下能 15/15
 * 且 0 重疊的最小 8px 節奏上限。z=8 時約 0.57°／58km，仍在單一縣市尺度；
 * 再長就無法主張「這根針代表那個位置」。
 */
import { listCities, listPlaygrounds, type Playground } from "@/data/playgrounds";
import type { CityCluster } from "@/lib/playground-clusters";
import {
  rectFullyContained,
  rectsIntersect,
  type RectBox,
} from "@/lib/play-map-proto-metrics";
import type { PointProjector } from "@/lib/play-map-proto-project";

export const C2_MAX_LEADER_PX = 104;
export const C2_CLUSTER_ICON_SIZE = 44;
const LABEL_CHAR_PX = 13;
const LABEL_PAD_X = 20;
const LABEL_HEIGHT = 26;
const NAME_OVERLAP = 4;
const FRAME_INSET = 2;
const SPIRAL_STEP = 4;

const SPIRAL_DIRS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
  [0, -1],
  [1, -1],
  [2, 1],
  [1, 2],
  [-1, 2],
  [-2, 1],
  [-2, -1],
  [-1, -2],
  [1, -2],
  [2, -1],
];

export function clusterPlaygroundsByCityBbox(
  places: readonly Playground[] = listPlaygrounds(),
): CityCluster[] {
  const buckets = new Map<
    string,
    {
      count: number;
      minLat: number;
      maxLat: number;
      minLng: number;
      maxLng: number;
    }
  >();

  for (const place of places) {
    const prev = buckets.get(place.city);
    if (prev) {
      prev.count += 1;
      prev.minLat = Math.min(prev.minLat, place.lat);
      prev.maxLat = Math.max(prev.maxLat, place.lat);
      prev.minLng = Math.min(prev.minLng, place.lng);
      prev.maxLng = Math.max(prev.maxLng, place.lng);
    } else {
      buckets.set(place.city, {
        count: 1,
        minLat: place.lat,
        maxLat: place.lat,
        minLng: place.lng,
        maxLng: place.lng,
      });
    }
  }

  return listCities()
    .filter((city) => buckets.has(city))
    .map((city) => {
      const bucket = buckets.get(city)!;
      return {
        city,
        count: bucket.count,
        lat: (bucket.minLat + bucket.maxLat) / 2,
        lng: (bucket.minLng + bucket.maxLng) / 2,
      };
    });
}

export function estimateClusterEntranceRect(
  city: string,
  x: number,
  y: number,
): RectBox {
  const labelWidth = city.length * LABEL_CHAR_PX + LABEL_PAD_X;
  const halfW = Math.max(C2_CLUSTER_ICON_SIZE / 2, labelWidth / 2);
  return {
    left: x - halfW,
    right: x + halfW,
    top: y - C2_CLUSTER_ICON_SIZE / 2 - (LABEL_HEIGHT - NAME_OVERLAP),
    bottom: y + C2_CLUSTER_ICON_SIZE / 2,
  };
}

function clampToFrame(
  city: string,
  x: number,
  y: number,
  width: number,
  height: number,
): { x: number; y: number } {
  const rect = estimateClusterEntranceRect(city, x, y);
  let nextX = x;
  let nextY = y;
  if (rect.left < FRAME_INSET) nextX += FRAME_INSET - rect.left;
  if (rect.right > width - FRAME_INSET) {
    nextX -= rect.right - (width - FRAME_INSET);
  }
  if (rect.top < FRAME_INSET) nextY += FRAME_INSET - rect.top;
  if (rect.bottom > height - FRAME_INSET) {
    nextY -= rect.bottom - (height - FRAME_INSET);
  }
  return { x: nextX, y: nextY };
}

export type C2OverlapPair = {
  a: string;
  b: string;
  gapPx: number;
};

export function listEntranceOverlapPairs(
  items: ReadonlyArray<{ city: string; x: number; y: number }>,
): C2OverlapPair[] {
  const pairs: C2OverlapPair[] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i]!;
      const right = items[j]!;
      if (
        rectsIntersect(
          estimateClusterEntranceRect(left.city, left.x, left.y),
          estimateClusterEntranceRect(right.city, right.x, right.y),
        )
      ) {
        const dx = left.x - right.x;
        const dy = left.y - right.y;
        pairs.push({
          a: left.city,
          b: right.city,
          gapPx: Math.hypot(dx, dy),
        });
      }
    }
  }
  return pairs.sort((a, b) => a.gapPx - b.gapPx);
}

export function listCircleOverlapPairs(
  items: ReadonlyArray<{ city: string; x: number; y: number }>,
  diameterPx: number = C2_CLUSTER_ICON_SIZE,
): C2OverlapPair[] {
  const pairs: C2OverlapPair[] = [];
  for (let i = 0; i < items.length; i += 1) {
    for (let j = i + 1; j < items.length; j += 1) {
      const left = items[i]!;
      const right = items[j]!;
      const gapPx = Math.hypot(left.x - right.x, left.y - right.y);
      if (gapPx < diameterPx) {
        pairs.push({ a: left.city, b: right.city, gapPx });
      }
    }
  }
  return pairs.sort((a, b) => a.gapPx - b.gapPx);
}

export type C2PlacedMarker = {
  city: string;
  count: number;
  trueLat: number;
  trueLng: number;
  displayLat: number;
  displayLng: number;
  trueX: number;
  trueY: number;
  displayX: number;
  displayY: number;
  leaderPx: number;
  unsolved: boolean;
};

export type C2Layout = {
  markers: C2PlacedMarker[];
  unsolved: string[];
};

export function displaceCityMarkers(args: {
  clusters: readonly CityCluster[];
  width: number;
  height: number;
  projector: PointProjector;
  maxLeaderPx?: number;
}): C2Layout {
  const maxLeaderPx = args.maxLeaderPx ?? C2_MAX_LEADER_PX;
  const placed: C2PlacedMarker[] = [];
  const unsolved: string[] = [];

  const fits = (city: string, x: number, y: number, trueX: number, trueY: number) => {
    if (Math.hypot(x - trueX, y - trueY) > maxLeaderPx + 1e-6) return false;
    const rect = estimateClusterEntranceRect(city, x, y);
    if (!rectFullyContained(rect, {
      left: FRAME_INSET,
      top: FRAME_INSET,
      right: args.width - FRAME_INSET,
      bottom: args.height - FRAME_INSET,
    })) {
      return false;
    }
    for (const prev of placed) {
      if (
        rectsIntersect(
          rect,
          estimateClusterEntranceRect(prev.city, prev.displayX, prev.displayY),
        )
      ) {
        return false;
      }
    }
    return true;
  };

  for (const cluster of args.clusters) {
    const truePoint = args.projector.toPoint(cluster.lat, cluster.lng);
    const clamped = clampToFrame(
      cluster.city,
      truePoint.x,
      truePoint.y,
      args.width,
      args.height,
    );
    let found: { x: number; y: number } | null = null;
    if (fits(cluster.city, clamped.x, clamped.y, truePoint.x, truePoint.y)) {
      found = clamped;
    } else {
      outerSearch: for (
        let radius = SPIRAL_STEP;
        radius <= maxLeaderPx + SPIRAL_STEP;
        radius += SPIRAL_STEP
      ) {
        for (const [dx, dy] of SPIRAL_DIRS) {
          const length = Math.hypot(dx, dy);
          const x = clamped.x + (dx / length) * radius;
          const y = clamped.y + (dy / length) * radius;
          if (fits(cluster.city, x, y, truePoint.x, truePoint.y)) {
            found = { x, y };
            break outerSearch;
          }
        }
      }
    }

    const display = found ?? clamped;
    const leaderPx = Math.hypot(display.x - truePoint.x, display.y - truePoint.y);
    const failed = found === null;
    if (failed) unsolved.push(cluster.city);
    const latLng = args.projector.toLatLng(display.x, display.y);
    placed.push({
      city: cluster.city,
      count: cluster.count,
      trueLat: cluster.lat,
      trueLng: cluster.lng,
      displayLat: latLng.lat,
      displayLng: latLng.lng,
      trueX: truePoint.x,
      trueY: truePoint.y,
      displayX: display.x,
      displayY: display.y,
      leaderPx,
      unsolved: failed,
    });
  }

  return { markers: placed, unsolved };
}
