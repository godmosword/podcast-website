import { useEffect, useRef, type RefObject } from "react";
import type { Roamer, RoamerDir, RoamerRoute } from "@/data/universe-roamers";
import { getRoutePathD } from "@/data/universe-roamers";
import { mapDepthZ } from "@/lib/universe-depth";

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
  /** 遲滯狀態：避免 path 切線在零附近抖動造成 sprite 連續翻來翻去。 */
  flip: 1 | -1;
  dir: RoamerDir;
  /** 上一幀 heading 角（rad），用來估角速度做過彎 bank。 */
  angle: number;
  bankDeg: number;
};

/** heading 取樣前瞻距離（px）：比動畫位移大，讓朝向穩定。 */
const HEADING_LOOK_AHEAD = 6;
/** 切線分量門檻（px）：小於此值維持原朝向（遲滯）。 */
const FLIP_THRESH = 0.8;
const DIR_THRESH = 0.8;
const MAX_DT_MS = 50;
/** 景深縮放：tile 頂端（遠）較小、底端（近）較大。 */
const DEPTH_MIN = 0.9;
const DEPTH_MAX = 1.08;
/** 過彎 bank（度）。 */
const BANK_GAIN = 0.55;
const MAX_BANK = 5;
const BANK_SMOOTH = 0.15;
/** 島內 bob 上下浮動。map 層關閉。 */
const BOB_AMP = 2.2;
const BOB_FREQ = 0.005;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

type CoordSpace =
  | { kind: "tile"; tileW: number; tileH: number }
  | { kind: "map"; stageW: number; stageH: number };

function buildRouteMap(routes: RoamerRoute[]): Map<string, RouteMeta> {
  const map = new Map<string, RouteMeta>();
  for (const route of routes) {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "path");
    el.setAttribute("d", getRoutePathD(route));
    map.set(route.id, {
      el,
      length: el.getTotalLength(),
      pingpong: route.pingpong ?? false,
    });
  }
  return map;
}

/** 遲滯：moving left（hx<0）→ 用基準圖（面朝左）；moving right → 鏡像。 */
export function pickFlip(hx: number, current: 1 | -1): 1 | -1 {
  if (hx < -FLIP_THRESH) return 1;
  if (hx > FLIP_THRESH) return -1;
  return current;
}

/** 遲滯：moving down（hy>0，朝觀者）→ front；moving up（hy<0，遠離）→ rear。 */
export function pickDir(hy: number, current: RoamerDir): RoamerDir {
  if (hy > DIR_THRESH) return "front";
  if (hy < -DIR_THRESH) return "rear";
  return current;
}

export type RoamerFrame = {
  /** tile 本地像素：地面接觸點（定位、陰影、z-index 用）。 */
  groundX: number;
  groundY: number;
  flip: 1 | -1;
  dir: RoamerDir;
  bobPx: number;
  bankDeg: number;
  depthScale: number;
  /** 接地陰影縮放（含景深 + bob 起伏）。 */
  shadowScale: number;
  shadowOpacity: number;
  /** 依 groundY 的深度排序值（與遮擋層 baseline 比較）。 */
  z: number;
};

export function computeFrame(
  sim: RoamerSim,
  tileW: number,
  tileH: number,
  dtMs: number,
  now: number,
): RoamerFrame {
  const { route } = sim;
  const length = route.length;
  const dist = clamp(sim.distance, 0, length);
  const P = route.el.getPointAtLength(dist);
  const ahead = clamp(dist + sim.direction * HEADING_LOOK_AHEAD, 0, length);
  const P2 = route.el.getPointAtLength(ahead);
  const hx = (P2.x - P.x) * sim.direction;
  const hy = (P2.y - P.y) * sim.direction;

  sim.flip = pickFlip(hx, sim.flip);
  sim.dir = pickDir(hy, sim.dir);

  const angle = Math.atan2(hy, hx);
  let dAng = angle - sim.angle;
  while (dAng > Math.PI) dAng -= 2 * Math.PI;
  while (dAng < -Math.PI) dAng += 2 * Math.PI;
  sim.angle = angle;
  const angVel = dAng / Math.max(dtMs / 1000, 0.001);
  const targetBank = clamp(-angVel * BANK_GAIN * sim.flip, -MAX_BANK, MAX_BANK);
  sim.bankDeg += (targetBank - sim.bankDeg) * BANK_SMOOTH;

  const bob = Math.sin(now * BOB_FREQ + sim.phase) * BOB_AMP;
  const hop = Math.max(0, -bob);
  const depthScale = DEPTH_MIN + (DEPTH_MAX - DEPTH_MIN) * clamp(P.y / tileH, 0, 1);

  return {
    groundX: P.x,
    groundY: P.y,
    flip: sim.flip,
    dir: sim.dir,
    bobPx: bob,
    bankDeg: sim.bankDeg,
    depthScale,
    shadowScale: depthScale * (1 - hop * 0.05),
    shadowOpacity: 0.82 - hop * 0.04,
    z: Math.round(P.y),
  };
}

/** 每 roamer 的 DOM 節點快取（effect 建立一次），避免每幀 querySelector。 */
type RoamerNodes = {
  node: HTMLElement;
  body: HTMLElement | null;
  shadow: HTMLElement | null;
  lastZ: number | null;
  lastDir: RoamerDir | null;
};

function buildNodeMap(layer: HTMLElement): Map<string, RoamerNodes> {
  const map = new Map<string, RoamerNodes>();
  for (const node of layer.querySelectorAll<HTMLElement>("[data-roamer-id]")) {
    const id = node.dataset.roamerId;
    if (!id) continue;
    map.set(id, {
      node,
      body: node.querySelector<HTMLElement>("[data-roamer-body]"),
      shadow: node.querySelector<HTMLElement>("[data-roamer-shadow]"),
      lastZ: null,
      lastDir: null,
    });
  }
  return map;
}

/** 定位改用 transform（合成層，不觸發 reflow）；z-index／data-dir 僅在變化時寫。 */
function applyFrame(nodes: RoamerNodes, frame: RoamerFrame): void {
  nodes.node.style.transform =
    `translate3d(${frame.groundX}px, ${frame.groundY}px, 0) translate(-50%, -100%)`;
  if (nodes.lastZ !== frame.z) {
    nodes.node.style.zIndex = String(frame.z);
    nodes.lastZ = frame.z;
  }

  if (nodes.body) {
    nodes.body.style.transform =
      `translateY(${frame.bobPx}px) rotate(${frame.bankDeg}deg) ` +
      `scale(${frame.depthScale}) scaleX(${frame.flip})`;
    if (nodes.lastDir !== frame.dir) {
      nodes.body.dataset.dir = frame.dir;
      nodes.lastDir = frame.dir;
    }
  }

  if (nodes.shadow) {
    nodes.shadow.style.transform = `translateX(-50%) scale(${frame.shadowScale})`;
    nodes.shadow.style.opacity = String(frame.shadowOpacity);
  }
}

type UseRoamerSimOptions = {
  roamers: Roamer[];
  routes: RoamerRoute[];
  space: CoordSpace;
  layerRef: RefObject<HTMLDivElement | null>;
  reduced: boolean;
  paused: boolean;
};

/** 依座標空間計算 frame（map 層 z 改用全圖深度）並套用到快取節點。 */
function applySim(
  nodes: RoamerNodes,
  sim: RoamerSim,
  space: CoordSpace,
  dtMs: number,
  now: number,
): void {
  const w = space.kind === "tile" ? space.tileW : space.stageW;
  const h = space.kind === "tile" ? space.tileH : space.stageH;
  const frame = computeFrame(sim, w, h, dtMs, now);
  applyFrame(
    nodes,
    space.kind === "map" ? { ...frame, z: mapDepthZ(frame.groundY, "roamer") } : frame,
  );
}

export function useRoamerSim({
  roamers,
  routes,
  space,
  layerRef,
  reduced,
  paused,
}: UseRoamerSimOptions) {
  const routeMapRef = useRef<Map<string, RouteMeta> | null>(null);
  const simsRef = useRef<RoamerSim[]>([]);
  const nodesRef = useRef<Map<string, RoamerNodes>>(new Map());
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
        flip: 1 as const,
        dir: "front" as RoamerDir,
        angle: 0,
        bankDeg: 0,
      };
    });

    const layer = layerRef.current;
    if (!layer) return;

    nodesRef.current = buildNodeMap(layer);
    const now = performance.now();
    for (const sim of simsRef.current) {
      const nodes = nodesRef.current.get(sim.roamer.id);
      if (nodes) applySim(nodes, sim, space, 16, now);
    }
  }, [roamers, routes, space, layerRef]);

  useEffect(() => {
    if (roamers.length === 0 || reduced) return;

    const tick = (now: number) => {
      if (!paused) {
        const last = lastTimeRef.current ?? now;
        const dt = Math.min(now - last, MAX_DT_MS);
        lastTimeRef.current = now;

        if (dt > 0 && layerRef.current) {
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

            const nodes = nodesRef.current.get(sim.roamer.id);
            if (nodes) applySim(nodes, sim, space, dt, now);
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
  }, [roamers, reduced, paused, space, layerRef]);
}
