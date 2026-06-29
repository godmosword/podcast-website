"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import type { ZoneId } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  ZONE_OCCLUDERS,
  isDevRoamersQuery,
  roamerHasRear,
  roamerSpriteSrc,
  shouldRenderRoamer,
} from "@/data/universe-roamers";
import { getZoneArtTile } from "@/lib/universe/zone-art-tile";
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

  const occluder = ZONE_OCCLUDERS[zoneId];
  const tile = getZoneArtTile(zoneId);

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
        const hasRear = roamerHasRear(roamer);

        return (
          <div
            key={roamer.id}
            data-roamer-id={roamer.id}
            className={styles.roamer}
          >
            <div data-roamer-shadow className={styles.shadow} />
            <div data-roamer-body data-dir="front" className={styles.body}>
              {usePlaceholder ? (
                <div className={styles.placeholder} />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={roamerSpriteSrc(roamer, "front", night)}
                    alt=""
                    className={`${styles.sprite} ${styles.spriteFront}`}
                    draggable={false}
                    decoding="async"
                  />
                  {hasRear && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={roamerSpriteSrc(roamer, "rear", night)}
                      alt=""
                      className={`${styles.sprite} ${styles.spriteRear}`}
                      draggable={false}
                      decoding="async"
                    />
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}

      {/* 深度遮擋：同一張 tile 用 clip-path 露出地標剪影、疊在 roamer 上方。
          z-index = baselineY，groundY 較小（在地標後方）的 roamer 會落到其下被擋住。 */}
      {occluder && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={tile.src}
          alt=""
          aria-hidden="true"
          className={styles.occluder}
          style={{ clipPath: occluder.clipPath, zIndex: occluder.baselineY }}
          draggable={false}
          decoding="async"
        />
      )}
    </div>
  );
}
