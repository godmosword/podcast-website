"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { zoneById, type ZoneId } from "@/data/universe";
import type { MapLayout } from "@/data/universe-zones";
import {
  getFeaturedHotspots,
  hotspotDetailHref,
  hotspotPrefetchHrefs,
  hotspotToStage,
  resolvedZoneById,
} from "@/lib/universe/hotspot";
import { mapDepthZ } from "@/lib/universe-depth";
import styles from "./HotspotLayer.module.css";

type HotspotLayerProps = {
  zoneId: ZoneId;
  /** 分頁隱藏／地圖不可見／拖曳中：保留狀態標記供地圖層協調。 */
  paused?: boolean;
  /** 版面（預設橫式）：熱點座標取該版面的島 tileBox。 */
  layout?: MapLayout;
};

/**
 * 直向（≤480）：`pos.y` 在島下半的熱點，整支標牌下移站到島前沙灘（3/4 視角「畫面下方＝更靠近觀者」），
 * 牌子仍正立、底座仍是接地點、48px 命中區留在錨點——不倒掛（設計審必改 5）。
 */
export const HOTSPOT_BELOW_THRESHOLD = 0.5;

/**
 * 島內熱點座標層：掛在 stage 上，隨相機 transform。
 * 點擊走 `/adventures/[zone]/[hotspot]`（可被 @modal 攔截）。
 * 預設只顯示安靜標記，名稱在滑過／鍵盤聚焦時才顯現，避免小島被文字淹沒。
 */
export default function HotspotLayer({
  zoneId,
  paused = false,
  layout = "landscape",
}: HotspotLayerProps) {
  const router = useRouter();
  const zone = zoneById(zoneId);
  const resolved = resolvedZoneById(zoneId, layout);

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
      data-layout={layout}
      aria-label={`${zone.name}探索點`}
    >
      {getFeaturedHotspots(zone.hotspots).map((hotspot) => {
        const pt = hotspotToStage(resolved, hotspot);
        const href = hotspotDetailHref(zoneId, hotspot);
        const locked = hotspot.action.type === "locked";
        const kind = locked ? "locked" : hotspot.action.type;
        const icon =
          kind === "story" ? "✦" : kind === "link" ? "↗" : "·";
        return (
          <Link
            key={hotspot.id}
            id={`hotspot-${zoneId}-${hotspot.id}`}
            href={href}
            prefetch
            className={locked ? styles.pinLocked : styles.pin}
            style={{ left: pt.x, top: pt.y }}
            aria-label={
              locked
                ? `${hotspot.name}（尚未開放）`
                : `打開${hotspot.name}`
            }
            data-hotspot-id={hotspot.id}
            data-kind={kind}
            data-featured="true"
            data-side={hotspot.pos.y >= HOTSPOT_BELOW_THRESHOLD ? "below" : "above"}
            scroll={false}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <span className={styles.sign} aria-hidden="true">
              <span className={styles.signPlate}>
                <span className={styles.signIcon}>{icon}</span>
                <span className={styles.label}>{hotspot.name}</span>
              </span>
              <span className={styles.signStem} />
              <span className={styles.signBase} />
            </span>
          </Link>
        );
      })}
    </div>
  );
}
