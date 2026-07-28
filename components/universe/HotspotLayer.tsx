"use client";

import Link from "next/link";
import { useEffect, type CSSProperties } from "react";
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
  /** 分頁隱藏／地圖不可見／拖曳中：暫停連續動畫 */
  paused?: boolean;
};

/** 泡泡進場錯開（毫秒）；僅 transform／opacity。 */
const BUBBLE_STAGGER_MS = 70;

/**
 * 島內熱點座標層：掛在 stage 上，隨相機 transform。
 * 點擊走 `/adventures/[zone]/[hotspot]`（可被 @modal 攔截）。
 * 字永遠在圓點上方；進場以泡泡上飄，圓點有呼吸光暈。
 */
export default function HotspotLayer({
  zoneId,
  paused = false,
}: HotspotLayerProps) {
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
      data-paused={paused || undefined}
      aria-label={`${zone.name}探索點`}
    >
      {zone.hotspots.map((hotspot, index) => {
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
            style={
              {
                left: pt.x,
                top: pt.y,
                "--bubble-delay": `${index * BUBBLE_STAGGER_MS}ms`,
              } as CSSProperties
            }
            aria-label={
              locked
                ? `${hotspot.name}（尚未開放）`
                : `打開${hotspot.name}`
            }
            data-hotspot-id={hotspot.id}
            data-label="above"
            scroll={false}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* 標籤在上：泡泡進場；圓點在下：呼吸光暈／微浮 */}
            <span className={styles.label}>{hotspot.name}</span>
            <span className={styles.dot} aria-hidden="true" />
          </Link>
        );
      })}
    </div>
  );
}
