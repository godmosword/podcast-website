"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ZoneId } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  ZONE_OCCLUDERS,
  getRoutePathD,
  isDevRoamersQuery,
  roamerGreeting,
  shouldRenderRoamer,
  type Roamer,
} from "@/data/universe-roamers";
import { getZoneArtSrcSet } from "@/lib/universe/zone-art-tile";
import { trackUniverseRoamerTap } from "@/lib/analytics";
import { playSfx } from "@/lib/sfx";
import { useRoamerSim } from "./useRoamerSim";
import ArtSrcPicture from "./ArtSrcPicture";
import RoamerVehicle, { type RoamerGreetingState } from "./RoamerVehicle";
import styles from "./IslandRoamerLayer.module.css";

type Props = {
  zoneId: ZoneId;
  tileW: number;
  tileH: number;
  mapScale: number;
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

export default function IslandRoamerLayer({
  zoneId,
  tileW,
  tileH,
  mapScale,
  reduced,
  paused,
  night,
}: Props) {
  const [devRoamers, setDevRoamers] = useState(false);
  const [greeting, setGreeting] =
    useState<(RoamerGreetingState & { id: string }) | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const greetingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const greetingKeyRef = useRef(0);

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

  const space = useMemo(
    () => ({ kind: "tile" as const, tileW, tileH }),
    [tileW, tileH],
  );

  const occluder = ZONE_OCCLUDERS[zoneId];
  const artSrc = getZoneArtSrcSet(zoneId, mapScale);

  const { pauseRoamer } = useRoamerSim({
    roamers: visible,
    routes,
    space,
    layerRef,
    reduced,
    paused,
  });

  useEffect(() => {
    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    };
  }, []);

  const handleRoamerTap = useCallback(
    (roamer: Roamer) => {
      pauseRoamer(roamer.id, 1400);
      playSfx("horn");
      trackUniverseRoamerTap(roamer.characterId);
      greetingKeyRef.current += 1;
      setGreeting({
        id: roamer.id,
        message: roamerGreeting(roamer.characterId),
        key: greetingKeyRef.current,
      });
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
      greetingTimerRef.current = setTimeout(() => setGreeting(null), 1500);
    },
    [pauseRoamer],
  );

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
            <path className={styles.devPathLine} d={getRoutePathD(route)} />
          </svg>
        ))}

      {visible.map((roamer) => {
        const usePlaceholder = devRoamers && !roamer.enabled;

        return (
          <RoamerVehicle
            key={roamer.id}
            roamer={roamer}
            usePlaceholder={usePlaceholder}
            night={night}
            sizeKind="island"
            onTap={handleRoamerTap}
            greeting={greeting?.id === roamer.id ? greeting : null}
            reduced={reduced}
          />
        );
      })}

      {occluder && (
        <ArtSrcPicture
          artSrc={artSrc}
          className={styles.occluder}
          style={{ clipPath: occluder.clipPath, zIndex: occluder.baselineY }}
        />
      )}
    </div>
  );
}
