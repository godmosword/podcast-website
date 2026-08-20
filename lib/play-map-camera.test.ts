import { describe, expect, it } from "vitest";
import { listPlaygrounds } from "@/data/playgrounds";
import { clusterPlaygroundsByCity } from "@/lib/playground-clusters";
import {
  NATIONAL_MARKER_INSET,
  TAIWAN_MAP_BOUNDS,
  TAIWAN_MAP_CENTER,
  TAIWAN_MAX_BOUNDS,
  TAIWAN_NATIONAL_MAX_ZOOM,
  TAIWAN_NATIONAL_TARGET_WEST,
  TAIWAN_SOFT_MIN_ZOOM,
  isTaiwanFocusedWest,
  nationalViewForClusters,
  taiwanMapBoundsCorners,
  taiwanNationalView,
  taiwanNationalWestEdge,
} from "./play-map-camera";

describe("play-map Taiwan camera", () => {
  it("全國框包住台灣本島，西緣不把福建當主體", () => {
    expect(TAIWAN_MAP_BOUNDS.west).toBeGreaterThan(119.8);
    expect(TAIWAN_MAP_BOUNDS.east).toBeLessThan(122.2);
    expect(TAIWAN_MAP_BOUNDS.south).toBeLessThan(22.2);
    expect(TAIWAN_MAP_BOUNDS.north).toBeGreaterThan(25.2);
    expect(isTaiwanFocusedWest(TAIWAN_MAP_BOUNDS.west)).toBe(true);
    expect(isTaiwanFocusedWest(117.5)).toBe(false);
  });

  it("軟 maxBounds 比全國框寬一點，仍遠小於華東全幅", () => {
    expect(TAIWAN_MAX_BOUNDS.west).toBeLessThan(TAIWAN_MAP_BOUNDS.west);
    expect(TAIWAN_MAX_BOUNDS.west).toBeGreaterThan(119.7);
    expect(TAIWAN_MAX_BOUNDS.east).toBeGreaterThan(TAIWAN_MAP_BOUNDS.east);
    expect(TAIWAN_MAX_BOUNDS.east).toBeLessThan(123);
    expect(TAIWAN_SOFT_MIN_ZOOM).toBeGreaterThanOrEqual(7);
    expect(TAIWAN_NATIONAL_MAX_ZOOM).toBeGreaterThanOrEqual(
      TAIWAN_SOFT_MIN_ZOOM,
    );
  });

  it("中心落在台灣，角落格式可供 Leaflet maxBounds", () => {
    const [sw, ne] = taiwanMapBoundsCorners();
    expect(TAIWAN_MAP_CENTER[0]).toBeGreaterThan(sw[0]);
    expect(TAIWAN_MAP_CENTER[0]).toBeLessThan(ne[0]);
    expect(TAIWAN_MAP_CENTER[1]).toBeGreaterThan(sw[1]);
    expect(TAIWAN_MAP_CENTER[1]).toBeLessThan(ne[1]);
  });

  it("全國鏡頭依地圖寬度東移，西緣釘在海峽而不是福建城市", () => {
    const phone = taiwanNationalView(390);
    const desktop = taiwanNationalView(720);
    expect(phone.zoom).toBe(TAIWAN_NATIONAL_MAX_ZOOM);
    expect(desktop.zoom).toBe(TAIWAN_NATIONAL_MAX_ZOOM);
    expect(desktop.center[1]).toBeGreaterThan(phone.center[1]);
    expect(taiwanNationalWestEdge(390)).toBeCloseTo(
      TAIWAN_NATIONAL_TARGET_WEST,
      5,
    );
    expect(taiwanNationalWestEdge(720)).toBeCloseTo(
      TAIWAN_NATIONAL_TARGET_WEST,
      5,
    );
    expect(taiwanNationalWestEdge(720)).toBeGreaterThan(119.95);
  });
});

/**
 * 全國鏡頭的迴歸護欄。
 *
 * `TAIWAN_NATIONAL_TARGET_WEST` 是資料只收到雲林時訂的常數，南部（台南
 * 120.28、高雄 120.32）進資料後，兩個縣市的 cluster 被推出行動版畫面，
 * 等於點不到。這裡刻意用**真實資料**而非固定座標斷言：資料再往西／往南
 * 長時這組測試會自己壞掉，而不是靜靜地又裁掉一個縣市。
 */
describe("全國鏡頭必須框住所有縣市聚合", () => {
  const TILE = 256;
  const clusters = clusterPlaygroundsByCity(listPlaygrounds());

  /** 與 lib 內部同一組 Web Mercator，用來把 cluster 換算成螢幕座標。 */
  function screenPoint(
    point: { lat: number; lng: number },
    view: { center: [number, number]; zoom: number },
    size: { width: number; height: number },
  ): { x: number; y: number } {
    const world = TILE * 2 ** view.zoom;
    const toX = (lng: number) => ((lng + 180) / 360) * world;
    const toY = (lat: number) => {
      const sin = Math.sin((lat * Math.PI) / 180);
      return (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * world;
    };
    return {
      x: toX(point.lng) - toX(view.center[1]) + size.width / 2,
      y: toY(point.lat) - toY(view.center[0]) + size.height / 2,
    };
  }

  function clippedCities(width: number, height: number): string[] {
    const view = nationalViewForClusters({
      widthPx: width,
      heightPx: height,
      points: clusters,
    });
    return clusters
      .filter((cluster) => {
        const { x, y } = screenPoint(cluster, view, { width, height });
        return (
          x - NATIONAL_MARKER_INSET.left < 0 ||
          x + NATIONAL_MARKER_INSET.right > width ||
          y - NATIONAL_MARKER_INSET.top < 0 ||
          y + NATIONAL_MARKER_INSET.bottom > height
        );
      })
      .map((cluster) => cluster.city);
  }

  const containers = [
    { label: "行動版地圖分頁", width: 366, height: 778 },
    { label: "桌機 split layout", width: 598, height: 576 },
    { label: "手機橫向（矮容器）", width: 700, height: 334 },
    { label: "寬桌機", width: 900, height: 640 },
  ] as const;

  it.each(containers)(
    "$label $width×$height：每個縣市 marker 連同名稱標籤都完整在框內",
    ({ width, height }) => {
      expect(clippedCities(width, height)).toEqual([]);
    },
  );

  it("舊的固定西緣鏡頭會裁掉縣市（證明這組測試真的在守）", () => {
    const width = 366;
    const height = 778;
    const legacy = taiwanNationalView(width);
    const leftOf = (inset: number) =>
      clusters
        .filter(
          (cluster) =>
            screenPoint(cluster, legacy, { width, height }).x - inset < 0,
        )
        .map((cluster) => cluster.city)
        .sort();

    // 錨點本身就落在容器外＝這兩個縣市在行動版根本點不到（Playwright 實測
    // 台南 x=-12、高雄 x=-6，命中測試會落在 <main> 而不是 marker）。
    expect(leftOf(0)).toEqual(["台南市", "高雄市"]);
    // 圓形本體被左緣吃到的有四個。
    expect(leftOf(22)).toEqual(["台南市", "嘉義市", "嘉義縣", "高雄市"]);
    // 連名稱標籤一起算，被左緣吃掉的其實有五個。
    expect(leftOf(NATIONAL_MARKER_INSET.left)).toEqual([
      "台南市",
      "嘉義市",
      "嘉義縣",
      "雲林縣",
      "高雄市",
    ]);
    // 同一組資料、同一個容器，新鏡頭一個都不裁。
    expect(clippedCities(width, height)).toEqual([]);
  });

  it("西緣不越過 TAIWAN_MAP_BOUNDS.west，福建不進主畫面", () => {
    for (const { width, height } of containers) {
      const view = nationalViewForClusters({
        widthPx: width,
        heightPx: height,
        points: clusters,
      });
      const world = TILE * 2 ** view.zoom;
      const centerX = ((view.center[1] + 180) / 360) * world;
      const westLng = ((centerX - width / 2) / world) * 360 - 180;
      expect(westLng).toBeGreaterThanOrEqual(TAIWAN_MAP_BOUNDS.west - 1e-9);
      expect(isTaiwanFocusedWest(westLng)).toBe(true);
    }
  });

  it("容器放不下時降 zoom 而不是裁掉縣市，且不低於軟下限", () => {
    const short = nationalViewForClusters({
      widthPx: 700,
      heightPx: 334,
      points: clusters,
    });
    expect(short.zoom).toBeLessThan(TAIWAN_NATIONAL_MAX_ZOOM);
    expect(short.zoom).toBeGreaterThanOrEqual(TAIWAN_SOFT_MIN_ZOOM);
  });

  it("沒有聚合點時退回寬度感知的後備鏡頭", () => {
    expect(
      nationalViewForClusters({ widthPx: 390, heightPx: 700, points: [] }),
    ).toEqual(taiwanNationalView(390));
  });
});
