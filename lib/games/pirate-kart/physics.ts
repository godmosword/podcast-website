import { Kart } from "./kart";
import {
  CHECK_ANGLES,
  CX,
  CY,
  RX_IN,
  RX_OUT,
  RY_IN,
  RY_OUT,
  WAYPOINTS,
} from "./tracks";
import type { Keys } from "./types";

// ── 賽道與碰撞工具 ──────────────────────────────────────────
function ellipseNorm(x: number, y: number, rx: number, ry: number): number {
  const nx = (x - CX) / rx;
  const ny = (y - CY) / ry;
  return nx * nx + ny * ny;
}

export function isOnTrack(x: number, y: number): boolean {
  const outer = ellipseNorm(x, y, RX_OUT, RY_OUT);
  const inner = ellipseNorm(x, y, RX_IN, RY_IN);
  return outer <= 1 && inner >= 1;
}

export function pushOntoTrack(x: number, y: number): { x: number; y: number } {
  const outer = ellipseNorm(x, y, RX_OUT, RY_OUT);
  const inner = ellipseNorm(x, y, RX_IN, RY_IN);
  const angle = Math.atan2(x - CX, -(y - CY));
  if (outer > 1) {
    const rx = RX_OUT * 0.97;
    const ry = RY_OUT * 0.97;
    return { x: CX + Math.sin(angle) * rx, y: CY - Math.cos(angle) * ry };
  }
  if (inner < 1) {
    const rx = RX_IN * 1.03;
    const ry = RY_IN * 1.03;
    return { x: CX + Math.sin(angle) * rx, y: CY - Math.cos(angle) * ry };
  }
  return { x, y };
}

export function kartAngle(x: number, y: number): number {
  return Math.atan2(x - CX, -(y - CY));
}

export function advanceCheckpoint(kart: Kart, prevAngle: number): boolean {
  const a = kartAngle(kart.x, kart.y);
  let lapDone = false;
  const next = kart.checkpoint + 1;
  if (next >= CHECK_ANGLES.length) return false;
  const target = CHECK_ANGLES[next];
  const crossed = crossedAngle(prevAngle, a, target);
  if (crossed || Math.abs(angleDiff(a, target)) < 0.25) {
    kart.checkpoint = next;
    if (kart.checkpoint === CHECK_ANGLES.length - 1) {
      kart.lap += 1;
      kart.checkpoint = -1;
      lapDone = true;
    }
  }
  return lapDone;
}

function crossedAngle(prev: number, curr: number, target: number): boolean {
  const norm = (v: number) => ((v % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const p = norm(prev);
  const c = norm(curr);
  const t = norm(target);
  if (p <= c) return p < t && t <= c;
  return p < t || t <= c;
}

function angleDiff(a: number, b: number): number {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

// ── AI 駕駛 ─────────────────────────────────────────────────
export function aiInput(kart: Kart, player: Kart): Keys {
  const wp = WAYPOINTS[kart.wp % WAYPOINTS.length];
  const dx = wp.x - kart.x;
  const dy = wp.y - kart.y;
  if (Math.hypot(dx, dy) < 18) kart.wp += 1;

  const desired = Math.atan2(dx, -dy);
  const diff = angleDiff(desired, kart.angle);
  const band =
    player.lap * 10 +
    player.checkpoint -
    (kart.lap * 10 + kart.checkpoint);
  const rubber = Math.max(-0.25, Math.min(0.35, band * 0.04));

  return {
    up: Math.abs(diff) < 1.2,
    down: false,
    left: diff < -0.08,
    right: diff > 0.08,
    boost: rubber > 0.15 && kart.boostCd <= 0 && Math.random() < 0.02,
    fire:
      dist(kart.x, kart.y, player.x, player.y) < 90 &&
      kart.fireCd <= 0 &&
      Math.random() < 0.03,
  };
}
