"use client";

import { memo, useEffect, useRef, useState } from "react";
import { ZONE_STATUS_META, type ZoneDef, type ZoneStatus } from "@/data/universe-zones";
import { mapDepthZ } from "@/lib/universe-depth";
import type { ResolvedZone } from "@/lib/universe-map";
import { getZoneArtTile, getZoneArtSrcSet } from "@/lib/universe/zone-art-tile";
import { getZoneNightArtSrcSet } from "@/lib/universe/zone-art-src";
import { playSfx } from "@/lib/sfx";
import { requestCelebration } from "@/lib/celebration";
import { ISLAND_BURST_PRESET, createRadialBurstParticles } from "@/lib/celebration-dom";
import StarBurst from "@/components/celebration/StarBurst";
import IslandRoamerLayer from "./IslandRoamerLayer";
import ZoneLandmark from "./ZoneLandmark";
import ZoneMotionLayer from "./ZoneMotionLayer";
import StatusOverlay from "./StatusOverlay";
import { useZoneTransition } from "./useZoneTransition";
import ZoneIslandTileArt from "./ZoneIslandTileArt";
import type { ZoneProgress } from "@/hooks/useZoneProgress";
import styles from "./ZoneIsland.module.css";

/** 點島慶祝動畫長度（毫秒），與 CSS islandBounce／star-burst-particle 對齊。 */
const CELEBRATE_MS = 640;

type ZoneIslandProps = {
  zone: ResolvedZone;
  /** 統一點擊語意：點任何島（開放或鎖島本體）→ fly-to＋開介紹 sheet。 */
  onActivate: (zone: ZoneDef) => void;
  reduced?: boolean;
  paused?: boolean;
  night?: boolean;
  /**
   * 地圖鏡頭縮放（應傳 `bucketMapScale` 量化值）。
   * 僅供 srcset sizes；木牌反縮放改吃舞台 CSS `--map-scale`，避免 zoom 每 tick 打穿 memo。
   */
  mapScale?: number;
  /** dev-only：?devStatus=car-park:building */
  devStatusOverride?: ZoneStatus;
  /** 進度中樞：該島「已聽完／總集數」（無進度或零進度時不顯示星章）。 */
  progress?: ZoneProgress | null;
};

function ZoneIsland({
  zone,
  onActivate,
  reduced = false,
  paused = false,
  night = false,
  mapScale = 1,
  devStatusOverride,
  progress = null,
}: ZoneIslandProps) {
  const effectiveStatus = devStatusOverride ?? zone.status;
  const meta = ZONE_STATUS_META[effectiveStatus];
  const isOpen = effectiveStatus === "open";
  const hasProgress = (progress?.completed ?? 0) > 0;
  const tile = getZoneArtTile(zone.id);
  const { transition, onTransitionEnd } = useZoneTransition(effectiveStatus, reduced);

  const [burst, setBurst] = useState(0);
  const [burstParticles, setBurstParticles] = useState(
    createRadialBurstParticles({ ...ISLAND_BURST_PRESET, seed: 0 }),
  );
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [jelly, setJelly] = useState(0);

  const handleActivate = () => {
    if (isOpen) {
      const decision = requestCelebration("island_open_tap");
      if (!reduced && decision.allowed && decision.particleCount > 0) {
        const seed = Date.now();
        setBurstParticles(
          createRadialBurstParticles({ ...ISLAND_BURST_PRESET, seed }),
        );
        setBurst((n) => n + 1);
        if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
        burstTimerRef.current = setTimeout(() => setBurst(0), CELEBRATE_MS);
      }
    } else {
      // 鎖島保留果凍晃動＋輕音效回饋；sheet 由 onActivate 統一開啟。
      playSfx("tap");
      if (!reduced) {
        setJelly((n) => n + 1);
      }
    }
    onActivate(zone);
  };

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  if (tile.mode === "island") {
    const [ax, ay] = tile.anchorUV;
    // mapScale 由呼叫端傳入 bucketMapScale；此處不再二次量化
    const artSrc = getZoneArtSrcSet(zone.id, mapScale);
    const nightArtSrc = getZoneNightArtSrcSet(zone.id, mapScale);
    return (
      <>
        <button
          type="button"
          className={styles.islandTile}
          style={{
            left: `${zone.px.x}px`,
            top: `${zone.px.y}px`,
            width: `${tile.stageSize.w}px`,
            height: `${tile.stageSize.h}px`,
            transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
            zIndex: mapDepthZ(zone.depthY, "island"),
          }}
          data-status={effectiveStatus}
          data-transition={transition ?? undefined}
          data-celebrate={isOpen && burst > 0 ? true : undefined}
          data-jelly={!isOpen && jelly > 0 ? jelly : undefined}
          data-progress={hasProgress ? true : undefined}
          aria-label={
            hasProgress
              ? `${zone.name}，${meta.label}，已聽完 ${progress!.completed} 集`
              : `${zone.name}，${meta.label}`
          }
          onClick={handleActivate}
          onAnimationEnd={onTransitionEnd}
        >
          <div className={styles.tileStack}>
            <ZoneIslandTileArt
              zoneId={zone.id}
              artSrc={artSrc}
              anchorUV={[ax, ay]}
              reduced={reduced}
              nightArtSrc={nightArtSrc}
              night={night}
            />
            <IslandRoamerLayer
              zoneId={zone.id}
              tileW={tile.stageSize.w}
              tileH={tile.stageSize.h}
              mapScale={mapScale}
              reduced={reduced}
              paused={paused}
              night={night}
            />
            <StatusOverlay status={effectiveStatus} paused={paused} transition={transition} />
            <ZoneMotionLayer
              zoneId={zone.id}
              reduced={reduced}
              paused={paused}
              night={night}
            />
            {burst > 0 && isOpen && (
              <span className={styles.burstLayer} aria-hidden="true">
                <StarBurst particles={burstParticles} />
              </span>
            )}
          </div>
        </button>
        {/* 木牌欄：島名＋狀態 pill（裝飾，島 button 已含同名 aria-label）。
            點島（含鎖島）一律由島 button 本體開 sheet，木牌欄純展示。
            反縮放／遠距偏移由舞台 --map-scale／--label-offset-y 驅動。 */}
        <span
          className={styles.tileLabel}
          style={{
            left: `${zone.px.x}px`,
            top: `${zone.px.y}px`,
            zIndex: mapDepthZ(zone.depthY, "label"),
          }}
        >
          <span className={styles.name} aria-hidden="true">
            {isOpen ? (
              <span className={styles.openBeacon} aria-hidden="true">
                🎈
              </span>
            ) : null}
            {zone.name}
          </span>
          <span className={styles.pillRow}>
            <span
              className={styles.pill}
              aria-hidden="true"
              style={{ background: meta.pillBg, color: meta.pillInk }}
            >
              {meta.icon} {meta.label}
            </span>
            {hasProgress ? (
              <span className={styles.progressChip} aria-hidden="true">
                ⭐ {progress!.completed}/{progress!.total}
              </span>
            ) : null}
          </span>
        </span>
      </>
    );
  }

  return (
    <button
      type="button"
      className={styles.island}
      style={{
        left: `${zone.px.x}px`,
        top: `${zone.px.y}px`,
        zIndex: mapDepthZ(zone.depthY, "island"),
      }}
      data-status={effectiveStatus}
      aria-label={`${zone.name}，${meta.label}`}
      onClick={handleActivate}
    >
      <span className={styles.landmark} aria-hidden="true">
        <ZoneLandmark zoneId={zone.id} status={effectiveStatus} artTile={zone.artTile} />
      </span>
      <span className={styles.name}>{zone.name}</span>
      <span
        className={styles.pill}
        style={{ background: meta.pillBg, color: meta.pillInk }}
      >
        {meta.icon} {meta.label}
      </span>
    </button>
  );
}

// 地圖平移／同桶 zoom 期間 UniverseMap 會重渲染，但島 props（含 bucket 後的
// mapScale）維持不變；memo 化跳過島樹。木牌反縮放改吃舞台 CSS 變數，不依賴 props。
export default memo(ZoneIsland);
