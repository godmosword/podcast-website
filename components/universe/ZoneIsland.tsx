"use client";

import { ZONE_STATUS_META, type ZoneDef, type ZoneStatus } from "@/data/universe-zones";
import type { ResolvedZone } from "@/lib/universe-map";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import ZoneLandmark from "./ZoneLandmark";
import ZoneMotionLayer from "./ZoneMotionLayer";
import StatusOverlay from "./StatusOverlay";
import { useZoneTransition } from "./useZoneTransition";
import styles from "./ZoneIsland.module.css";

type ZoneIslandProps = {
  zone: ResolvedZone;
  onActivate: (zone: ZoneDef) => void;
  reduced?: boolean;
  paused?: boolean;
  night?: boolean;
  /** dev-only：?devStatus=car-park:building */
  devStatusOverride?: ZoneStatus;
};

export default function ZoneIsland({
  zone,
  onActivate,
  reduced = false,
  paused = false,
  night = false,
  devStatusOverride,
}: ZoneIslandProps) {
  const effectiveStatus = devStatusOverride ?? zone.status;
  const meta = ZONE_STATUS_META[effectiveStatus];
  const tile = getZoneArtTile(zone.id);
  const { transition, onTransitionEnd } = useZoneTransition(effectiveStatus, reduced);

  if (tile.mode === "island") {
    const [ax, ay] = tile.anchorUV;
    return (
      <button
        type="button"
        className={styles.islandTile}
        style={{
          left: `${zone.px.x}px`,
          top: `${zone.px.y}px`,
          width: `${tile.stageSize.w}px`,
          height: `${tile.stageSize.h}px`,
          transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
        }}
        data-status={effectiveStatus}
        data-transition={transition ?? undefined}
        aria-label={`${zone.name}，${meta.label}`}
        onClick={() => onActivate(zone)}
        onAnimationEnd={onTransitionEnd}
      >
        <div className={styles.tileStack}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={tile.src}
            alt=""
            aria-hidden="true"
            className={styles.tileImg}
            style={{ transformOrigin: `${ax * 100}% ${ay * 100}%` }}
            draggable={false}
            decoding="async"
          />
          <StatusOverlay status={effectiveStatus} paused={paused} transition={transition} />
          <ZoneMotionLayer
            zoneId={zone.id}
            reduced={reduced}
            paused={paused}
            night={night}
          />
        </div>
        <span
          className={styles.tileLabel}
          style={{ left: `${ax * 100}%`, top: `${ay * 100}%` }}
        >
          <span className={styles.name}>{zone.name}</span>
          <span
            className={styles.pill}
            style={{ background: meta.pillBg, color: meta.pillInk }}
          >
            {meta.label}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={styles.island}
      style={{ left: `${zone.px.x}px`, top: `${zone.px.y}px` }}
      data-status={effectiveStatus}
      aria-label={`${zone.name}，${meta.label}`}
      onClick={() => onActivate(zone)}
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
