import { useEffect, useRef, type RefObject } from "react";
import type { Roamer, RoamerRoute } from "@/data/universe-roamers";

export type RouteMeta = {
  el: SVGPathElement;
  length: number;
  pingpong: boolean;
};

export type RoamerSim = {
  roamer: Roamer;
  distance: number;
  direction: 1 | -1;
  route: RouteMeta;
  phase: number;
};

const LOOK_AHEAD = 2;
const MAX_DT_MS = 50;

export function buildRouteMap(routes: RoamerRoute[]): Map<string, RouteMeta> {
  const map = new Map<string, RouteMeta>();
  for (const route of routes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", route.tilePath);
    map.set(route.id, {
      el,
      length: el.getTotalLength(),
      pingpong: route.pingpong ?? false,
    });
  }
  return map;
}

export function sampleTilePoint(sim: RoamerSim): {
  x: number;
  y: number;
  flip: number;
  bob: number;
  now: number;
} {
  const { distance, direction, route } = sim;
  const length = route.length;
  const dist = Math.max(0, Math.min(length, distance));
  const P = route.el.getPointAtLength(dist);
  const P2 = route.el.getPointAtLength(
    Math.max(0, Math.min(length, dist + direction * LOOK_AHEAD)),
  );
  const flip = P2.x >= P.x ? -1 : 1;
  const now = performance.now();
  const bob = Math.sin(now * 0.004 + sim.phase) * 1.2;
  return { x: P.x, y: P.y, flip, bob, now };
}

export type TileTransform = {
  leftPct: number;
  topPct: number;
  flip: number;
  bobPx: number;
};

export function toTileTransform(
  point: { x: number; y: number; flip: number; bob: number },
  tileW: number,
  tileH: number,
): TileTransform {
  return {
    leftPct: (point.x / tileW) * 100,
    topPct: (point.y / tileH) * 100,
    flip: point.flip,
    bobPx: point.bob,
  };
}

export function applyTileTransform(el: HTMLElement, t: TileTransform) {
  el.style.left = `${t.leftPct}%`;
  el.style.top = `${t.topPct}%`;
  el.style.transform = `translate(-50%, -100%) translateY(${t.bobPx}px) scaleX(${t.flip})`;
}

type UseRoamerSimOptions = {
  roamers: Roamer[];
  routes: RoamerRoute[];
  tileW: number;
  tileH: number;
  layerRef: RefObject<HTMLDivElement | null>;
  reduced: boolean;
  paused: boolean;
};

export function useRoamerSim({
  roamers,
  routes,
  tileW,
  tileH,
  layerRef,
  reduced,
  paused,
}: UseRoamerSimOptions) {
  const routeMapRef = useRef<Map<string, RouteMeta> | null>(null);
  const simsRef = useRef<RoamerSim[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (roamers.length === 0) return;

    routeMapRef.current = buildRouteMap(routes);
    simsRef.current = roamers.map((roamer, i) => {
      const route = routeMapRef.current!.get(roamer.routeId);
      if (!route) throw new Error(`roamer ${roamer.id} 缺少 route ${roamer.routeId}`);
      return {
        roamer,
        distance: (roamer.startOffset ?? 0) * route.length,
        direction: 1 as const,
        route,
        phase: i * 1.7,
      };
    });

    const layer = layerRef.current;
    if (!layer) return;

    for (const sim of simsRef.current) {
      const el = layer.querySelector<HTMLElement>(`[data-roamer-id="${sim.roamer.id}"]`);
      if (!el) continue;
      applyTileTransform(el, toTileTransform(sampleTilePoint(sim), tileW, tileH));
    }
  }, [roamers, routes, tileW, tileH, layerRef]);

  useEffect(() => {
    if (roamers.length === 0 || reduced) return;

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
                applyTileTransform(
                  el,
                  toTileTransform(sampleTilePoint(sim), tileW, tileH),
                );
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
  }, [roamers, reduced, paused, tileW, tileH, layerRef]);
}
