"use client";

import { useEffect, useState } from "react";
import type { ZoneId } from "@/data/universe-zones";
import {
  ZONE_MOTION,
  isDevMotionQuery,
  shouldRenderMotionPart,
} from "@/data/universe-zone-motion";
import ZoneMotionPart from "./ZoneMotionPart";
import styles from "./ZoneMotionLayer.module.css";

type Props = {
  zoneId: ZoneId;
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

export default function ZoneMotionLayer({ zoneId, reduced, paused, night }: Props) {
  const [devMotion, setDevMotion] = useState(false);

  useEffect(() => {
    setDevMotion(isDevMotionQuery());
  }, []);

  const parts = ZONE_MOTION[zoneId] ?? [];
  const visible = parts.filter((p) => shouldRenderMotionPart(p, devMotion));

  if (visible.length === 0) return null;

  return (
    <div
      className={styles.layer}
      data-paused={paused || undefined}
      aria-hidden="true"
    >
      {visible.map((part) => (
        <ZoneMotionPart
          key={part.name}
          part={part}
          reduced={reduced}
          night={night}
          usePlaceholder={devMotion && !part.enabled}
        />
      ))}
    </div>
  );
}
