/** 樂園地圖 resolver：把 zones 資料換算成 SVG 像素座標、橋路徑與 viewBox。 */
import { LANDING_SEGMENTS } from "@/data/landing-segments";
import {
  MAP_STAGE,
  ZONES,
  type ZoneDef,
  type ZoneId,
} from "@/data/universe-zones";

export type ResolvedZone = ZoneDef & { px: { x: number; y: number } };

export type ResolvedBridge = {
  id: string;
  from: ZoneId;
  to: ZoneId;
  /** SVG path（二次貝茲），以 "M" 開頭 */
  d: string;
  /** 未開通（coming/planned）為虛線 */
  dashed: boolean;
};

export type ResolvedUniverseMap = {
  zones: ResolvedZone[];
  bridges: ResolvedBridge[];
  viewBox: string;
};

/** 控制點沿兩點法線偏移量，做出橋的弧度。 */
const BRIDGE_ARC = 40;

function resolveZones(): ResolvedZone[] {
  // R0 採 1:1，px 直接用 coord，讓 SVG 與佔位圖共用座標。
  return ZONES.map((zone) => ({
    ...zone,
    px: { x: zone.coord.x, y: zone.coord.y },
  }));
}

function bridgePath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.hypot(dx, dy) || 1;
  // 單位法線（順時針旋轉 90 度）
  const nx = -dy / len;
  const ny = dx / len;
  const ctrlX = midX + nx * BRIDGE_ARC;
  const ctrlY = midY + ny * BRIDGE_ARC;
  const r = (n: number) => Math.round(n * 100) / 100;
  return `M ${r(from.x)} ${r(from.y)} Q ${r(ctrlX)} ${r(ctrlY)} ${r(to.x)} ${r(to.y)}`;
}

function resolveBridges(zones: ResolvedZone[]): ResolvedBridge[] {
  const byId = new Map<ZoneId, ResolvedZone>(zones.map((z) => [z.id, z]));
  const bridges: ResolvedBridge[] = [];
  for (const zone of zones) {
    if (!zone.bridgeFrom) continue;
    const source = byId.get(zone.bridgeFrom);
    if (!source) continue;
    bridges.push({
      id: `${source.id}-${zone.id}`,
      from: source.id,
      to: zone.id,
      d: bridgePath(source.px, zone.px),
      dashed: zone.status === "coming" || zone.status === "planned",
    });
  }
  return bridges;
}

export function resolveUniverseMap(): ResolvedUniverseMap {
  const zones = resolveZones();
  return {
    zones,
    bridges: resolveBridges(zones),
    viewBox: `0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`,
  };
}

export type CarParkLink = { label: string; href: string; external?: boolean };

/** car-park 子設施連結，衍生自 LANDING_SEGMENTS（單一資料源）。 */
export function getCarParkLinks(): CarParkLink[] {
  const carPark = ZONES.find((z) => z.id === "car-park");
  const ids = carPark?.subSegmentIds ?? [];
  return ids.flatMap((id) => {
    const seg = LANDING_SEGMENTS.find((s) => s.id === id);
    if (!seg) return [];
    return [
      {
        label: seg.cta.label,
        href: seg.cta.href,
        external: seg.cta.external,
      },
    ];
  });
}
