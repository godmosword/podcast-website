"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zoneById, type ZoneId } from "@/data/universe";
import {
  hotspotDetailHref,
  hotspotPrefetchHrefs,
  hotspotToStage,
  resolvedZoneById,
} from "@/lib/universe/hotspot";
import { mapDepthZ } from "@/lib/universe-depth";
import styles from "./HotspotLayer.module.css";

type HotspotLayerProps = {
  zoneId: ZoneId;
};

/**
 * 標籤翻到圓點上方的門檻（tile 本地 UV）：島下半部若把名字放在圓點下方，
 * 會撞到沙岸錨點的島名木牌，也容易與鄰近探索點的標籤重疊。
 */
const FLIP_LABEL_ABOVE_UV = 0.6;

/**
 * 島內熱點座標層：掛在 stage 上，隨相機 transform。
 * 點擊走 `/adventures/[zone]/[hotspot]`（可被 @modal 攔截）。
 */
export default function HotspotLayer({ zoneId }: HotspotLayerProps) {
  const router = useRouter();
  const zone = zoneById(zoneId);
  const resolved = resolvedZoneById(zoneId);

  useEffect(() => {
    if (!zone) return;
    for (const href of hotspotPrefetchHrefs(zone)) {
      try {
        router.prefetch(href);
      } catch {
        // prefetch 失敗不阻斷互動
      }
    }
  }, [zone, router]);

  if (!zone || !resolved || zone.hotspots.length === 0) return null;

  return (
    <div
      className={styles.layer}
      style={{ zIndex: mapDepthZ(resolved.depthY, "hotspot") }}
      aria-label={`${zone.name}探索點`}
    >
      {zone.hotspots.map((hotspot) => {
        const pt = hotspotToStage(resolved, hotspot);
        const href = hotspotDetailHref(zoneId, hotspot);
        const locked = hotspot.action.type === "locked";
        return (
          <Link
            key={hotspot.id}
            id={`hotspot-${zoneId}-${hotspot.id}`}
            href={href}
            prefetch
            className={locked ? styles.pinLocked : styles.pin}
            /* 島下半部的標籤翻到圓點上方，避開島名木牌與彼此的橫向碰撞。 */
            data-flip={hotspot.pos.y > FLIP_LABEL_ABOVE_UV ? "up" : undefined}
            style={{ left: pt.x, top: pt.y }}
            aria-label={
              locked
                ? `${hotspot.name}（尚未開放）`
                : `打開${hotspot.name}`
            }
            data-hotspot-id={hotspot.id}
            scroll={false}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className={styles.dot} aria-hidden="true" />
            <span className={styles.label}>{hotspot.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
