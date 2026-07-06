"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
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

type ZoneIslandProps = {
  zone: ResolvedZone;
  /** 開放島點擊（fly-to／開 dock）。 */
  onActivate: (zone: ZoneDef) => void;
  /** 鎖島探索按鈕：開啟 bottom dock。 */
  onWish: (zone: ZoneDef) => void;
  /** 鎖島本體點擊：僅回饋，不開 sheet。 */
  onLockedTap?: (zone: ZoneDef) => void;
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

export default function ZoneIsland({
  zone,
  onActivate,
  onWish,
  onLockedTap,
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
      onActivate(zone);
      return;
    }

    playSfx("tap");
    if (!reduced) {
      setJelly((n) => n + 1);
    }
    onLockedTap?.(zone);
  };

  useEffect(() => {
    return () => {
      if (burstTimerRef.current) clearTimeout(burstTimerRef.current);
    };
  }, []);

  if (tile.mode === "island") {
    const [ax, ay] = tile.anchorUV;
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
        {/* 木牌欄：島名＋狀態 pill（裝飾，島 button 已含同名 aria-label）＋鎖島「看看」按鈕。
            看看鈕併入木牌欄免費繼承 1/mapScale 反縮放與 label 層 z-index，
            且仍是島 button 的兄弟節點（button 不可巢狀 button，hydration #418）。 */}
        <span
          className={styles.tileLabel}
          style={{
            left: `${zone.px.x}px`,
            top: `${zone.px.y}px`,
            zIndex: mapDepthZ(zone.depthY, "label"),
            transform: `translate(-50%, 6px) scale(${1 / mapScale})`,
            transformOrigin: "50% 0",
          }}
        >
          <span className={styles.name} aria-hidden="true">
            {zone.name}
          </span>
          <span className={styles.pillRow} aria-hidden="true">
            <span
              className={styles.pill}
              style={{ background: meta.pillBg, color: meta.pillInk }}
            >
              {meta.label}
            </span>
            {hasProgress ? (
              <span className={styles.progressChip}>
                ⭐ {progress!.completed}/{progress!.total}
              </span>
            ) : null}
          </span>
          {!isOpen ? (
            <button
              type="button"
              className={styles.wishBtn}
              aria-label={`${zone.name}看看`}
              onClick={(e) => {
                e.stopPropagation();
                playSfx("tap");
                onWish(zone);
              }}
            >
              看看
            </button>
          ) : null}
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
        {meta.label}
      </span>
    </button>
  );
}
