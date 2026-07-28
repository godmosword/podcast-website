import { useCallback, useEffect, useRef, type RefObject } from "react";
import type { Roamer, RoamerDir, RoamerRoute } from "@/data/universe-roamers";
import { getRoutePathD, roamerUsesIdleSpot } from "@/data/universe-roamers";
import { mapDepthZ } from "@/lib/universe-depth";

export type RouteMeta = {
  el: SVGPathElement;
  length: number;
  pingpong: boolean;
};

/** idle＝定點；joyride／crossing＝path 移動；path＝無 idleSpot 的舊行為／dev */
export type RoamerDrive = "idle" | "joyride" | "crossing" | "path";

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
  pausedUntil: number;
  drive: RoamerDrive;
  /** joyride 結束時刻（performance.now）。 */
  driveUntil: number;
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
/** 點擊短兜風時長。 */
export const JOYRIDE_MS = 2600;

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

type CoordSpace =
  | { kind: "tile"; tileH: number }
  | { kind: "map"; stageH: number };

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
  idle: boolean;
};

/** tile＝島內近景（bob／bank）；map＝全圖遠距（關 bob／bank，少搶戲）。 */
export type RoamerMotionSpace = "tile" | "map";

export function computeIdleFrame(sim: RoamerSim, height: number): RoamerFrame {
  const spot = sim.roamer.idleSpot;
  if (!spot) {
    throw new Error(`roamer ${sim.roamer.id} 缺少 idleSpot`);
  }
  const depthScale =
    DEPTH_MIN + (DEPTH_MAX - DEPTH_MIN) * clamp(spot.y / height, 0, 1);
  return {
    groundX: spot.x,
    groundY: spot.y,
    flip: spot.flip ?? 1,
    dir: spot.facing ?? "front",
    bobPx: 0,
    bankDeg: 0,
    depthScale,
    shadowScale: depthScale,
    shadowOpacity: 0.82,
    z: Math.round(spot.y),
    idle: true,
  };
}

export function computeFrame(
  sim: RoamerSim,
  height: number,
  dtMs: number,
  now: number,
  motionSpace: RoamerMotionSpace = "tile",
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

  const mapMotion = motionSpace === "map";
  if (mapMotion) {
    sim.bankDeg = 0;
  } else {
    const angVel = dAng / Math.max(dtMs / 1000, 0.001);
    const targetBank = clamp(-angVel * BANK_GAIN * sim.flip, -MAX_BANK, MAX_BANK);
    sim.bankDeg += (targetBank - sim.bankDeg) * BANK_SMOOTH;
  }

  const bob = mapMotion ? 0 : Math.sin(now * BOB_FREQ + sim.phase) * BOB_AMP;
  const hop = Math.max(0, -bob);
  const depthScale = DEPTH_MIN + (DEPTH_MAX - DEPTH_MIN) * clamp(P.y / height, 0, 1);

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
    idle: false,
  };
}

export function advanceDistance(sim: RoamerSim, dtMs: number, now: number): void {
  if (now < sim.pausedUntil) return;

  const { roamer, route } = sim;
  let dist = sim.distance + roamer.speed * (dtMs / 1000) * sim.direction;

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
}

/** 單程前進；抵達終點回 true（用於 rareCrossing）。 */
export function advanceDistanceOneShot(
  sim: RoamerSim,
  dtMs: number,
  now: number,
): boolean {
  if (now < sim.pausedUntil) return false;
  const dist = sim.distance + sim.roamer.speed * (dtMs / 1000);
  if (dist >= sim.route.length) {
    sim.distance = sim.route.length;
    return true;
  }
  sim.distance = dist;
  return false;
}

/** 每 roamer 的 DOM 節點快取（effect 建立一次），避免每幀 querySelector。 */
type RoamerNodes = {
  node: HTMLElement;
  body: HTMLElement | null;
  shadow: HTMLElement | null;
  lastZ: number | null;
  lastDir: RoamerDir | null;
  lastIdle: boolean | null;
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
      lastIdle: null,
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
  if (nodes.lastIdle !== frame.idle) {
    nodes.node.dataset.idle = frame.idle ? "true" : "false";
    nodes.lastIdle = frame.idle;
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

function initialDrive(roamer: Roamer): RoamerDrive {
  return roamerUsesIdleSpot(roamer) ? "idle" : "path";
}

/** 依座標空間計算 frame（map 層 z 改用全圖深度）並套用到快取節點。 */
function applySim(
  nodes: RoamerNodes,
  sim: RoamerSim,
  space: CoordSpace,
  dtMs: number,
  now: number,
): void {
  const height = space.kind === "tile" ? space.tileH : space.stageH;
  const frame =
    sim.drive === "idle" && sim.roamer.idleSpot
      ? computeIdleFrame(sim, height)
      : computeFrame(sim, height, dtMs, now, space.kind);
  applyFrame(
    nodes,
    space.kind === "map" ? { ...frame, z: mapDepthZ(frame.groundY, "roamer") } : frame,
  );
}

function finishDriveToIdle(sim: RoamerSim): void {
  sim.drive = "idle";
  sim.driveUntil = 0;
  sim.distance = 0;
  sim.direction = 1;
  sim.bankDeg = 0;
  if (sim.roamer.idleSpot) {
    sim.flip = sim.roamer.idleSpot.flip ?? 1;
    sim.dir = sim.roamer.idleSpot.facing ?? "front";
  }
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
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  useEffect(() => {
    if (roamers.length === 0) return;

    routeMapRef.current = buildRouteMap(routes);
    simsRef.current = roamers.map((roamer, i) => {
      const route = routeMapRef.current!.get(roamer.routeId);
      if (!route) throw new Error(`roamer ${roamer.id} 缺少 route ${roamer.routeId}`);
      const drive = initialDrive(roamer);
      return {
        roamer,
        distance: drive === "idle" ? 0 : (roamer.startOffset ?? 0) * route.length,
        direction: 1 as const,
        route,
        phase: i * 1.7,
        flip: (roamer.idleSpot?.flip ?? 1) as 1 | -1,
        dir: (roamer.idleSpot?.facing ?? "front") as RoamerDir,
        angle: 0,
        bankDeg: 0,
        pausedUntil: 0,
        drive,
        driveUntil: 0,
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
    if (roamers.length === 0 || reduced) {
      // reduced：仍套一次 idle／靜態位置，但不開 rAF。
      if (roamers.length > 0 && layerRef.current) {
        nodesRef.current = buildNodeMap(layerRef.current);
        const now = performance.now();
        for (const sim of simsRef.current) {
          if (sim.roamer.idleSpot) finishDriveToIdle(sim);
          const nodes = nodesRef.current.get(sim.roamer.id);
          if (nodes) applySim(nodes, sim, space, 16, now);
        }
      }
      return;
    }

    const tick = (now: number) => {
      if (!paused) {
        const last = lastTimeRef.current ?? now;
        const dt = Math.min(now - last, MAX_DT_MS);
        lastTimeRef.current = now;

        if (dt > 0 && layerRef.current) {
          for (const sim of simsRef.current) {
            if (sim.drive === "joyride" && now >= sim.driveUntil) {
              finishDriveToIdle(sim);
            } else if (sim.drive === "crossing") {
              if (advanceDistanceOneShot(sim, dt, now)) {
                finishDriveToIdle(sim);
              }
            } else if (sim.drive === "path" || sim.drive === "joyride") {
              advanceDistance(sim, dt, now);
            }

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

  const pauseRoamer = useCallback((id: string, ms: number) => {
    const now = performance.now();
    for (const sim of simsRef.current) {
      if (sim.roamer.id === id) {
        sim.pausedUntil = Math.max(sim.pausedUntil, now + ms);
      }
    }
  }, []);

  const startJoyride = useCallback((id: string) => {
    if (reducedRef.current) return;
    const now = performance.now();
    const routesMap = routeMapRef.current;
    if (!routesMap) return;
    for (const sim of simsRef.current) {
      if (sim.roamer.id !== id) continue;
      const routeId = sim.roamer.joyrideRouteId ?? sim.roamer.routeId;
      const route = routesMap.get(routeId);
      if (!route) return;
      sim.route = route;
      sim.distance = (sim.roamer.startOffset ?? 0) * route.length;
      sim.direction = 1;
      sim.drive = "joyride";
      sim.driveUntil = now + JOYRIDE_MS;
    }
  }, []);

  const startCrossing = useCallback((id: string) => {
    if (reducedRef.current) return;
    const routesMap = routeMapRef.current;
    if (!routesMap) return;
    for (const sim of simsRef.current) {
      if (sim.roamer.id !== id) continue;
      if (sim.drive !== "idle") return;
      const routeId = sim.roamer.crossingRouteId;
      if (!routeId) return;
      const route = routesMap.get(routeId);
      if (!route) return;
      // 單程：關閉 pingpong，走到終點回 idle。
      sim.route = { ...route, pingpong: false };
      sim.distance = 0;
      sim.direction = 1;
      sim.drive = "crossing";
      sim.driveUntil = 0;
    }
  }, []);

  const isCrossing = useCallback((id: string): boolean => {
    return simsRef.current.some((s) => s.roamer.id === id && s.drive === "crossing");
  }, []);

  const anyCrossing = useCallback((): boolean => {
    return simsRef.current.some((s) => s.drive === "crossing");
  }, []);

  return { pauseRoamer, startJoyride, startCrossing, isCrossing, anyCrossing };
}
