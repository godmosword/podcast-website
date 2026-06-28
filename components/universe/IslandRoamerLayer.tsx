"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { ZoneId } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  isDevRoamersQuery,
  shouldRenderRoamer,
} from "@/data/universe-roamers";
import { useRoamerSim } from "./useRoamerSim";
import styles from "./IslandRoamerLayer.module.css";

type Props = {
  zoneId: ZoneId;
  tileW: number;
  tileH: number;
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

export default function IslandRoamerLayer({
  zoneId,
  tileW,
  tileH,
  reduced,
  paused,
  night,
}: Props) {
  const [devRoamers, setDevRoamers] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDevRoamers(isDevRoamersQuery());
  }, []);

  const routes = useMemo(
    () => ROAMER_ROUTES.filter((r) => r.kind === "island" && r.zoneId === zoneId),
    [zoneId],
  );

  const visible = useMemo(
    () =>
      MAP_ROAMERS.filter(
        (r) => r.zoneId === zoneId && shouldRenderRoamer(r, devRoamers),
      ),
    [zoneId, devRoamers],
  );

  useRoamerSim({
    roamers: visible,
    routes,
    tileW,
    tileH,
    layerRef,
    reduced,
    paused,
  });

  if (visible.length === 0 && !(devRoamers && routes.length > 0)) return null;

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {devRoamers &&
        routes.map((route) => (
          <svg
            key={`dev-${route.id}`}
            className={styles.devPath}
            viewBox={`0 0 ${tileW} ${tileH}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path className={styles.devPathLine} d={route.tilePath} />
          </svg>
        ))}

      {visible.map((roamer) => {
        const usePlaceholder = devRoamers && !roamer.enabled;
        const src = night && roamer.srcNight ? roamer.srcNight : roamer.src;

        return (
          <div
            key={roamer.id}
            data-roamer-id={roamer.id}
            className={styles.roamer}
          >
            {usePlaceholder ? (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: 6,
                  background: "#ef476f88",
                }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={src}
                alt=""
                className={styles.img}
                draggable={false}
                decoding="async"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
