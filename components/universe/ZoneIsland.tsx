"use client";

import { ZONE_STATUS_META, type ZoneDef } from "@/data/universe-zones";
import type { ResolvedZone } from "@/lib/universe-map";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
import ZoneLandmark from "./ZoneLandmark";
import styles from "./ZoneIsland.module.css";

type ZoneIslandProps = {
  zone: ResolvedZone;
  onActivate: (zone: ZoneDef) => void;
};

export default function ZoneIsland({ zone, onActivate }: ZoneIslandProps) {
  const meta = ZONE_STATUS_META[zone.status];
  const tile = getZoneArtTile(zone.id);

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
          // 以圖內錨點（沙岸底中心）對齊 coord
          transform: `translate(${-ax * 100}%, ${-ay * 100}%)`,
        }}
        data-status={zone.status}
        aria-label={`${zone.name}，${meta.label}`}
        onClick={() => onActivate(zone)}
      >
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
      data-status={zone.status}
      aria-label={`${zone.name}，${meta.label}`}
      onClick={() => onActivate(zone)}
    >
      <span className={styles.landmark} aria-hidden="true">
        <ZoneLandmark zoneId={zone.id} status={zone.status} artTile={zone.artTile} />
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
