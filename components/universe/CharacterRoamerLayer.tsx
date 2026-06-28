"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  MAP_ROAMERS,
  ROAMER_ROUTES,
  isDevRoamersQuery,
  shouldRenderRoamer,
  type Roamer,
} from "@/data/universe-roamers";
import styles from "./CharacterRoamerLayer.module.css";

type Props = {
  reduced: boolean;
  paused: boolean;
  night: boolean;
};

type RouteMeta = {
  el: SVGPathElement;
  length: number;
  pingpong: boolean;
};

type RoamerSim = {
  roamer: Roamer;
  distance: number;
  direction: 1 | -1;
  route: RouteMeta;
};

const LOOK_AHEAD = 2;
const MAX_DT_MS = 50;

function buildRouteMap(): Map<string, RouteMeta> {
  const map = new Map<string, RouteMeta>();
  for (const route of ROAMER_ROUTES) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", route.d);
    map.set(route.id, {
      el,
      length: el.getTotalLength(),
      pingpong: route.pingpong ?? false,
    });
  }
  return map;
}

function samplePoint(sim: RoamerSim): { x: number; y: number; flip: number } {
  const { distance, direction, route } = sim;
  const length = route.length;
  const dist = Math.max(0, Math.min(length, distance));
  const P = route.el.getPointAtLength(dist);
  const P2 = route.el.getPointAtLength(
    Math.max(0, Math.min(length, dist + direction * LOOK_AHEAD)),
  );
  // 素材朝左；往右行進時水平翻轉（不用 offset-rotate，保持直立）
  const flip = P2.x >= P.x ? -1 : 1;
  return { x: P.x, y: P.y, flip };
}

function applyTransform(el: HTMLElement, x: number, y: number, flip: number) {
  el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -100%) scaleX(${flip})`;
}

export default function CharacterRoamerLayer({ reduced, paused, night }: Props) {
  const [devRoamers, setDevRoamers] = useState(false);
  const layerRef = useRef<HTMLDivElement>(null);
  const routeMapRef = useRef<Map<string, RouteMeta> | null>(null);
  const simsRef = useRef<RoamerSim[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  const visible = useMemo(
    () => MAP_ROAMERS.filter((r) => shouldRenderRoamer(r, devRoamers)),
    [devRoamers],
  );

  useEffect(() => {
    setDevRoamers(isDevRoamersQuery());
  }, []);

  useEffect(() => {
    if (visible.length === 0) return;

    routeMapRef.current = buildRouteMap();
    simsRef.current = visible.map((roamer) => {
      const route = routeMapRef.current!.get(roamer.routeId);
      if (!route) throw new Error(`roamer ${roamer.id} 缺少 route ${roamer.routeId}`);
      return {
        roamer,
        distance: (roamer.startOffset ?? 0) * route.length,
        direction: 1 as const,
        route,
      };
    });

    const layer = layerRef.current;
    if (!layer) return;

    for (const sim of simsRef.current) {
      const el = layer.querySelector<HTMLElement>(`[data-roamer-id="${sim.roamer.id}"]`);
      if (!el) continue;
      const { x, y, flip } = samplePoint(sim);
      applyTransform(el, x, y, flip);
    }
  }, [visible]);

  useEffect(() => {
    if (visible.length === 0 || reduced) return;

    const tick = (now: number) => {
      if (!paused) {
        const last = lastTimeRef.current ?? now;
        const dt = Math.min(now - last, MAX_DT_MS);
        lastTimeRef.current = now;

        if (dt > 0) {
          const layer = layerRef.current;
          for (const sim of simsRef.current) {
            const { roamer, route } = sim;
            let dist = sim.distance + roamer.speed * (dt / 1000) * sim.direction;

            if (route.pingpong) {
              if (dist >= route.length) {
                dist = route.length;
                sim.direction = -1;
              } else if (dist <= 0) {
                dist = 0;
                sim.direction = 1;
              }
            } else {
              dist = ((dist % route.length) + route.length) % route.length;
            }
            sim.distance = dist;

            if (layer) {
              const el = layer.querySelector<HTMLElement>(
                `[data-roamer-id="${roamer.id}"]`,
              );
              if (el) {
                const { x, y, flip } = samplePoint(sim);
                applyTransform(el, x, y, flip);
              }
            }
          }
        }
      } else {
        lastTimeRef.current = null;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      lastTimeRef.current = null;
    };
  }, [visible, reduced, paused]);

  if (visible.length === 0) return null;

  return (
    <div ref={layerRef} className={styles.layer} aria-hidden="true">
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
              <div className={styles.placeholder}>
                <div className={styles.placeholderBody} />
                <span className={styles.placeholderWheel} />
                <span className={styles.placeholderWheel} />
              </div>
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
