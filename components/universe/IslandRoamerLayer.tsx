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
  type Roamer,
} from "@/data/universe-roamers";
import { selectIslandRoamers } from "@/lib/universe/roamer-presentation";
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
  /** 鏡頭是否聚焦此島；未聚焦不渲染招牌車 */
  focused: boolean;
};

export default function IslandRoamerLayer({
  zoneId,
  tileW,
  tileH,
  mapScale,
  reduced,
  paused,
  night,
  focused,
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

  const focusedZoneId = focused ? zoneId : null;

  const routes = useMemo(
    () => ROAMER_ROUTES.filter((r) => r.kind === "island" && r.zoneId === zoneId),
    [zoneId],
  );

  const visible = useMemo(
    () =>
      selectIslandRoamers(MAP_ROAMERS, zoneId, focusedZoneId, { devRoamers }),
    [zoneId, focusedZoneId, devRoamers],
  );

  const space = useMemo(
    () => ({ kind: "tile" as const, tileH }),
    [tileH],
  );

  const occluder = ZONE_OCCLUDERS[zoneId];
  const artSrc = getZoneArtSrcSet(zoneId, mapScale);

  const { pauseRoamer, startJoyride } = useRoamerSim({
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
      pauseRoamer(roamer.id, 400);
      if (!reduced && roamer.joyrideRouteId) {
        startJoyride(roamer.id);
      }
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
    [pauseRoamer, startJoyride, reduced],
  );

  if (visible.length === 0 && !(devRoamers && focused && routes.length > 0)) {
    return null;
  }

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {devRoamers &&
        focused &&
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

      {occluder && visible.length > 0 && (
        <ArtSrcPicture
          artSrc={artSrc}
          className={styles.occluder}
          style={{ clipPath: occluder.clipPath, zIndex: occluder.baselineY }}
        />
      )}
    </div>
  );
}
