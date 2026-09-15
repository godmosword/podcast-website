"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMapStage, type MapLayout, type ZoneId } from "@/data/universe-zones";
import {
  getMapRoamers,
  getRoamerRoutes,
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
  /** 版面（預設橫式）：橋線路線與跨橋 idleSpot 由該版面的橋推導，舞台尺寸跟著換。 */
  layout?: MapLayout;
};

export default function MapRoamerLayer({
  reduced,
  paused,
  night,
  focusedZoneId,
  layout = "landscape",
}: Props) {
  const stage = getMapStage(layout);
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
    () => getRoamerRoutes(layout).filter((r) => r.kind === "map"),
    [layout],
  );

  const visible = useMemo(
    () => selectMapRoamers(getMapRoamers(layout), focusedZoneId, { devRoamers }),
    [focusedZoneId, devRoamers, layout],
  );

  const space = useMemo(
    () => ({
      kind: "map" as const,
      stageH: stage.height,
    }),
    [stage.height],
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
    <div
      ref={layerRef}
      className={styles.layer}
      style={{ width: stage.width, height: stage.height }}
      aria-hidden="true"
    >
      {devRoamers && !focusedZoneId && (
        <svg
          className={styles.devPath}
          viewBox={`0 0 ${stage.width} ${stage.height}`}
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
