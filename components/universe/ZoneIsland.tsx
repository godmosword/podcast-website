"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
import { ZONE_STATUS_META, type ZoneDef, type ZoneStatus } from "@/data/universe-zones";
import { mapDepthZ } from "@/lib/universe-depth";
import type { ResolvedZone } from "@/lib/universe-map";
import { getZoneArtTile, getZoneArtSrcSet } from "@/lib/universe/zone-art-tile";
import { getZoneNightArtSrcSet } from "@/lib/universe/zone-art-src";
import { playSfx } from "@/lib/sfx";
import IslandRoamerLayer from "./IslandRoamerLayer";
import ZoneLandmark from "./ZoneLandmark";
import ZoneMotionLayer from "./ZoneMotionLayer";
import StatusOverlay from "./StatusOverlay";
import { useZoneTransition } from "./useZoneTransition";
import ZoneIslandTileArt from "./ZoneIslandTileArt";
import type { ZoneProgress } from "@/hooks/useZoneProgress";
import styles from "./ZoneIsland.module.css";

/** 點島慶祝的星星迸發（重用 app/motion.css 的 star-burst-particle）；色票取各園區點綴色。 */
const BURST_PARTICLES = [
  { x: "-46px", y: "-62px", symbol: "✦", color: "#ffb03a" },
  { x: "44px", y: "-56px", symbol: "✧", color: "#ff8c2b" },
  { x: "-64px", y: "-8px", symbol: "✦", color: "#f7a8c4" },
  { x: "62px", y: "-14px", symbol: "✦", color: "#8fcde8" },
  { x: "-24px", y: "-84px", symbol: "✧", color: "#ffd866" },
  { x: "26px", y: "-88px", symbol: "✦", color: "#c5b3e6" },
] as const;

/** 慶祝動畫長度（毫秒），與 CSS islandBounce／star-burst-particle 對齊。 */
const CELEBRATE_MS = 640;

/**
 * srcset `sizes` 用的縮放級距（0.25 一階）。連續 zoom 時 mapScale 逐 tick 變動，
 * 若每 tick 都重算 sizes 字串，瀏覽器會頻繁重新評估圖片候選來源；量化成離散級距降低
 * 抖動，純屬圖片載入的網路策略調整。label 反縮放（`scale(1/mapScale)`）仍吃連續值，
 * 視覺不受影響。
 */
const SIZES_SCALE_BUCKET = 0.25;

function bucketSizesScale(mapScale: number): number {
  return Math.round(mapScale / SIZES_SCALE_BUCKET) * SIZES_SCALE_BUCKET;
}

type ZoneIslandProps = {
  zone: ResolvedZone;
  /** 統一點擊語意：點任何島（開放或鎖島本體）→ fly-to＋開介紹 sheet。 */
  onActivate: (zone: ZoneDef) => void;
  reduced?: boolean;
  paused?: boolean;
  night?: boolean;
  /** 地圖鏡頭縮放（標籤反縮放用） */
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
  const burstTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [jelly, setJelly] = useState(0);

  const handleActivate = () => {
    if (isOpen) {
      if (!reduced) {
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
    const sizesScale = bucketSizesScale(mapScale);
    const artSrc = getZoneArtSrcSet(zone.id, sizesScale);
    const nightArtSrc = getZoneNightArtSrcSet(zone.id, sizesScale);
    const labelOffsetY = mapScale < 0.5 ? -140 : 6;
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
                {BURST_PARTICLES.map((p, i) => (
                  <span
                    key={`${burst}-${i}`}
                    className="star-burst-particle"
                    style={
                      {
                        "--burst-x": p.x,
                        "--burst-y": p.y,
                        color: p.color,
                        fontSize: 15,
                      } as CSSProperties
                    }
                  >
                    {p.symbol}
                  </span>
                ))}
              </span>
            )}
          </div>
        </button>
        {/* 木牌欄：島名＋狀態 pill（裝飾，島 button 已含同名 aria-label）。
            點島（含鎖島）一律由島 button 本體開 sheet，木牌欄純展示。 */}
        <span
          className={styles.tileLabel}
          style={{
            left: `${zone.px.x}px`,
            top: `${zone.px.y}px`,
            zIndex: mapDepthZ(zone.depthY, "label"),
            transform: `translate(-50%, ${labelOffsetY}px) scale(${1 / mapScale})`,
            transformOrigin: "50% 0",
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

// 地圖平移期間 UniverseMapContent 每 pointer-move 都會重渲染（camera tx/ty 變動），
// 但個別島的 props（zone/callbacks/mapScale 等）在平移中維持不變（callbacks 已在
// UniverseMap.tsx 改用穩定的 cameraFlyTo）；memo 化讓純平移時每座島跳過重渲染。
// zoom 導致 mapScale 改變仍會重渲染，屬階段二範圍。
export default memo(ZoneIsland);
