"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAP_STAGE } from "@/data/universe-zones";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  getRoutePathD,
  isDevRoamersQuery,
  shouldRenderRoamer,
} from "@/data/universe-roamers";
import RoamerVehicle from "./RoamerVehicle";
import { useRoamerSim } from "./useRoamerSim";
import styles from "./MapRoamerLayer.module.css";

type Props = {
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

export default function MapRoamerLayer({ reduced, paused, night }: Props) {
  const [devRoamers, setDevRoamers] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);

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

  useRoamerSim({
    roamers: visible,
    routes,
    space,
    layerRef,
    reduced,
    paused,
  });

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
        const src = night && roamer.srcNight ? roamer.srcNight : roamer.src;
        return (
          <RoamerVehicle
            key={roamer.id}
            roamer={roamer}
            usePlaceholder={usePlaceholder}
            src={src}
            sizeKind="map"
          />
        );
      })}
    </div>
  );
}
