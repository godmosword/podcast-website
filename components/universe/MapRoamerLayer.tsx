"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  getRoutePathD,
  isDevRoamersQuery,
  roamerGreeting,
  shouldRenderRoamer,
  type Roamer,
} from "@/data/universe-roamers";
import { trackUniverseRoamerTap } from "@/lib/analytics";
import { playSfx } from "@/lib/sfx";
import RoamerVehicle from "./RoamerVehicle";
import type { RoamerGreetingState } from "./RoamerVehicle";
import { useRoamerSim } from "./useRoamerSim";
import styles from "./MapRoamerLayer.module.css";

type Props = {
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

export default function MapRoamerLayer({ reduced, paused, night }: Props) {
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
    () => ROAMER_ROUTES.filter((r) => r.kind === "map"),
    [],
  );

  const mapRouteIds = useMemo(() => new Set(routes.map((r) => r.id)), [routes]);

  const visible = useMemo(
    () =>
      MAP_ROAMERS.filter(
        (r) => mapRouteIds.has(r.routeId) && shouldRenderRoamer(r, devRoamers),
      ),
    [mapRouteIds, devRoamers],
  );

  const space = useMemo(
    () => ({
      kind: "map" as const,
      stageW: MAP_STAGE.width,
      stageH: MAP_STAGE.height,
    }),
    [],
  );

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
      {devRoamers && (
        <svg
          className={styles.devPath}
          viewBox={`0 0 ${MAP_STAGE.width} ${MAP_STAGE.height}`}
          aria-hidden="true"
        >
          {routes.map((route) => (
            <path
              key={`dev-${route.id}`}
              className={styles.devPathLine}
              d={getRoutePathD(route)}
            />
          ))}
        </svg>
      )}

      {visible.map((roamer) => {
        const usePlaceholder = devRoamers && !roamer.enabled;
        return (
          <RoamerVehicle
            key={roamer.id}
            roamer={roamer}
            usePlaceholder={usePlaceholder}
            night={night}
            sizeKind="map"
            onTap={handleRoamerTap}
            greeting={greeting?.id === roamer.id ? greeting : null}
            reduced={reduced}
          />
        );
      })}
    </div>
  );
}
