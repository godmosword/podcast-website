"use client";

import { ZONE_STATUS_META, type ZoneDef } from "@/data/universe-zones";
import type { ResolvedZone } from "@/lib/universe-map";
import ZoneLandmark from "./ZoneLandmark";
import styles from "./ZoneIsland.module.css";

type ZoneIslandProps = {
  zone: ResolvedZone;
  onActivate: (zone: ZoneDef) => void;
};

export default function ZoneIsland({ zone, onActivate }: ZoneIslandProps) {
  const meta = ZONE_STATUS_META[zone.status];

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
