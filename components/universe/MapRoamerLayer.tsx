"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MAP_STAGE, type ZoneId } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  getRoutePathD,
  isDevRoamersQuery,
  roamerGreeting,
  type Roamer,
} from "@/data/universe-roamers";
import { selectMapRoamers } from "@/lib/universe/roamer-presentation";
import { trackUniverseRoamerTap } from "@/lib/analytics";
import { playSfx } from "@/lib/sfx";
import RoamerVehicle from "./RoamerVehicle";
import type { RoamerGreetingState } from "./RoamerVehicle";
import { useRoamerSim } from "./useRoamerSim";
import styles from "./MapRoamerLayer.module.css";

/** 遠景稀有跨島最小間隔（毫秒）。 */
const CROSSING_MIN_INTERVAL_MS = 45_000;
/** 進場後再開始排程，避免首屏立刻過場。 */
const CROSSING_INITIAL_DELAY_MS = 12_000;

type Props = {
  reduced: boolean;
  paused: boolean;
  night: boolean;
  /** 鏡頭聚焦的島；有值時隱藏遠景車 */
  focusedZoneId: ZoneId | null;
};

export default function MapRoamerLayer({
  reduced,
  paused,
  night,
  focusedZoneId,
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
    () => ROAMER_ROUTES.filter((r) => r.kind === "map"),
    [],
  );

  const visible = useMemo(
    () => selectMapRoamers(MAP_ROAMERS, focusedZoneId, { devRoamers }),
    [focusedZoneId, devRoamers],
  );

  const space = useMemo(
    () => ({
      kind: "map" as const,
      stageH: MAP_STAGE.height,
    }),
    [],
  );

  const { pauseRoamer, startCrossing, anyCrossing } = useRoamerSim({
    roamers: visible,
    routes,
    space,
    layerRef,
    reduced,
    paused,
  });

  // 稀有跨島：長間隔、同時最多一台；reduced／聚焦／暫停時不排程。
  useEffect(() => {
    if (reduced || paused || focusedZoneId || visible.length === 0) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (delay: number) => {
      timer = setTimeout(() => {
        if (cancelled) return;
        if (!anyCrossing()) {
          const candidates = visible.filter((r) => r.crossingRouteId);
          const pick = candidates[0];
          if (pick) startCrossing(pick.id);
        }
        schedule(CROSSING_MIN_INTERVAL_MS);
      }, delay);
    };

    schedule(CROSSING_INITIAL_DELAY_MS);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    reduced,
    paused,
    focusedZoneId,
    visible,
    startCrossing,
    anyCrossing,
  ]);

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

  if (visible.length === 0 && !(devRoamers && routes.length > 0 && !focusedZoneId)) {
    return null;
  }

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
      {devRoamers && !focusedZoneId && (
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
