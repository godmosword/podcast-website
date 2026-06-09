"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./page.module.css";

// ── 畫布與賽道常數 ──────────────────────────────────────────
const W = 400;
const H = 300;
const CX = 200;
const CY = 150;
const RX_OUT = 168;
const RY_OUT = 112;
const RX_IN = 72;
const RY_IN = 48;
const TOTAL_LAPS = 3;
const AI_COUNT = 3;

// TODO: 抽到 lib/gamekit/ 或獨立 tracks 模組
const TREASURES: { x: number; y: number; taken: boolean }[] = [
  { x: 200, y: 28, taken: false },
  { x: 355, y: 150, taken: false },
  { x: 200, y: 272, taken: false },
  { x: 45, y: 150, taken: false },
  { x: 280, y: 70, taken: false },
  { x: 120, y: 230, taken: false },
];

const WAYPOINTS = Array.from({ length: 20 }, (_, i) => {
  const a = (i / 20) * Math.PI * 2;
  const rx = (RX_OUT + RX_IN) * 0.5;
  const ry = (RY_OUT + RY_IN) * 0.5;
  return { x: CX + Math.sin(a) * rx, y: CY - Math.cos(a) * ry };
});

const CHECK_ANGLES = [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5];

// ── 型別 ────────────────────────────────────────────────────
type Phase = "start" | "countdown" | "playing" | "won";

type Keys = {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  boost: boolean;
  fire: boolean;
};

type Cannonball = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  owner: string;
  life: number;
};

// ── Kart 類別（核心載具）────────────────────────────────────
class Kart {
  id: string;
  name: string;
  isPlayer: boolean;
  color: string;
  sailColor: string;
  x: number;
  y: number;
  angle = 0;
  speed = 0;
  lap = 0;
  checkpoint = -1;
  score = 0;
  treasures = 0;
  boostTimer = 0;
  boostCd = 0;
  stunTimer = 0;
  fireCd = 0;
  finished = false;
  finishPos = 0;
  wp = 0;
  skill = 0.6;

  constructor(opts: {
    id: string;
    name: string;
    isPlayer: boolean;
    color: string;
    sailColor: string;
    x: number;
    y: number;
    angle?: number;
    skill?: number;
  }) {
    this.id = opts.id;
    this.name = opts.name;
    this.isPlayer = opts.isPlayer;
    this.color = opts.color;
    this.sailColor = opts.sailColor;
    this.x = opts.x;
    this.y = opts.y;
    this.angle = opts.angle ?? 0;
    this.skill = opts.skill ?? 0.6;
  }

  get maxSpeed(): number {
    const base = this.isPlayer ? 3.4 : 3.0 + this.skill * 0.35;
    return this.boostTimer > 0 ? base * 1.55 : base;
  }

  update(
    dt: number,
    input: Keys | null,
    onTrack: boolean,
  ): void {
    if (this.stunTimer > 0) {
      this.stunTimer -= dt;
      this.speed *= 0.9;
      this.integrate(dt);
      return;
    }

    if (this.boostTimer > 0) this.boostTimer -= dt;
    if (this.boostCd > 0) this.boostCd -= dt;
    if (this.fireCd > 0) this.fireCd -= dt;

    const turnRate = 2.8 * dt * (0.45 + Math.min(1, Math.abs(this.speed) / 2.5));
    const accel = 7.5 * dt;
    const brake = 10 * dt;
    const drag = onTrack ? 0.88 : 0.78;

    if (input) {
      if (input.left) this.angle -= turnRate;
      if (input.right) this.angle += turnRate;
      if (input.up) this.speed += accel;
      else if (input.down) this.speed -= brake;
      else this.speed *= drag;

      if (input.boost && this.boostCd <= 0 && this.boostTimer <= 0) {
        this.boostTimer = 1.2;
        this.boostCd = 3.2;
      }
    } else {
      this.speed *= drag;
    }

    const cap = this.maxSpeed;
    this.speed = Math.max(-1.2, Math.min(cap, this.speed));
  }

  integrate(dt: number): void {
    const vx = Math.sin(this.angle) * this.speed;
    const vy = -Math.cos(this.angle) * this.speed;
    this.x += vx * dt * 60;
    this.y += vy * dt * 60;
  }

  tryFire(balls: Cannonball[]): boolean {
    if (this.fireCd > 0 || this.stunTimer > 0) return false;
    this.fireCd = 0.75;
    const spd = 6.5;
    balls.push({
      x: this.x + Math.sin(this.angle) * 10,
      y: this.y - Math.cos(this.angle) * 10,
      vx: Math.sin(this.angle) * spd,
      vy: -Math.cos(this.angle) * spd,
      owner: this.id,
      life: 1.8,
    });
    return true;
  }
}

// ── 賽道與碰撞工具 ──────────────────────────────────────────
function ellipseNorm(x: number, y: number, rx: number, ry: number): number {
  const nx = (x - CX) / rx;
  const ny = (y - CY) / ry;
  return nx * nx + ny * ny;
}

function isOnTrack(x: number, y: number): boolean {
  const outer = ellipseNorm(x, y, RX_OUT, RY_OUT);
  const inner = ellipseNorm(x, y, RX_IN, RY_IN);
  return outer <= 1 && inner >= 1;
}

function pushOntoTrack(x: number, y: number): { x: number; y: number } {
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

function kartAngle(x: number, y: number): number {
  return Math.atan2(x - CX, -(y - CY));
}

function advanceCheckpoint(kart: Kart, prevAngle: number): boolean {
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

function dist(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

// ── AI 駕駛 ─────────────────────────────────────────────────
function aiInput(kart: Kart, player: Kart): Keys {
  const wp = WAYPOINTS[kart.wp % WAYPOINTS.length];
  const dx = wp.x - kart.x;
  const dy = wp.y - kart.y;
  if (Math.hypot(dx, dy) < 18) kart.wp += 1;

  const desired = Math.atan2(dx, -dy);
  let diff = angleDiff(desired, kart.angle);
  const band = (player.lap * 10 + player.checkpoint) - (kart.lap * 10 + kart.checkpoint);
  const rubber = Math.max(-0.25, Math.min(0.35, band * 0.04));

  return {
    up: Math.abs(diff) < 1.2,
    down: false,
    left: diff < -0.08,
    right: diff > 0.08,
    boost: rubber > 0.15 && kart.boostCd <= 0 && Math.random() < 0.02,
    fire: dist(kart.x, kart.y, player.x, player.y) < 90 && kart.fireCd <= 0 && Math.random() < 0.03,
  };
}

// ── 繪圖（16-bit 熱帶像素風）────────────────────────────────
function drawScene(
  ctx: CanvasRenderingContext2D,
  karts: Kart[],
  balls: Cannonball[],
  wave: number,
): void {
  ctx.imageSmoothingEnabled = false;

  // 海水
  ctx.fillStyle = "#0284c7";
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 8) {
    ctx.fillStyle = y % 16 === 0 ? "#0369a1" : "#0ea5e9";
    ctx.fillRect(0, y, W, 4);
  }

  // 沙洲賽道
  ctx.fillStyle = "#fde68a";
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_OUT, RY_OUT, 0, 0, Math.PI * 2);
  ctx.fill();

  // 內島草地
  ctx.fillStyle = "#4ade80";
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_IN, RY_IN, 0, 0, Math.PI * 2);
  ctx.fill();

  // 賽道邊線
  ctx.strokeStyle = "#b45309";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_OUT, RY_OUT, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(CX, CY, RX_IN, RY_IN, 0, 0, Math.PI * 2);
  ctx.stroke();

  // 起點線
  ctx.fillStyle = "#fff";
  for (let i = 0; i < 6; i++) {
    ctx.fillRect(CX - 3 + (i % 2) * 6, CY - RY_OUT - 2, 6, 8);
  }

  // 棕櫚樹（障礙裝飾）
  drawPalm(ctx, 250, 95);
  drawPalm(ctx, 145, 210);
  drawPalm(ctx, 310, 200);

  // 寶藏
  for (const t of TREASURES) {
    if (t.taken) continue;
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(t.x - 5, t.y - 4, 10, 8);
    ctx.fillStyle = "#92400e";
    ctx.fillRect(t.x - 6, t.y + 2, 12, 3);
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(t.x - 2, t.y - 6, 4, 3);
  }

  // 卡丁車
  for (const k of karts) drawKart(ctx, k, wave);

  // 砲彈
  for (const b of balls) {
    ctx.fillStyle = "#1e293b";
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.fillRect(b.x - 1, b.y - 1, 2, 2);
  }
}

function drawPalm(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.fillStyle = "#92400e";
  ctx.fillRect(x - 2, y, 4, 14);
  ctx.fillStyle = "#15803d";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(a) * 8, y - 4 + Math.sin(a) * 4, 8, 4, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawKart(ctx: CanvasRenderingContext2D, k: Kart, wave: number): void {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.angle);

  // 船身
  ctx.fillStyle = k.color;
  ctx.fillRect(-8, -12, 16, 22);
  ctx.fillStyle = "#78350f";
  ctx.fillRect(-9, 8, 18, 3);

  // 帆
  const sailWave = k.boostTimer > 0 ? Math.sin(wave * 0.3) * 2 : 0;
  ctx.fillStyle = k.sailColor;
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -24 + sailWave);
  ctx.lineTo(10, -12);
  ctx.closePath();
  ctx.fill();

  // 海盜旗
  if (k.isPlayer) {
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(-1, -22, 2, 8);
    ctx.fillStyle = "#fff";
    ctx.fillRect(1, -22, 6, 5);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(2, -20, 1, 1);
    ctx.fillRect(4, -19, 1, 1);
    ctx.fillRect(3, -18, 1, 1);
  }

  if (k.stunTimer > 0) {
    ctx.strokeStyle = "#facc15";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawPixelText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = "#fff",
): void {
  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.font = "bold 10px monospace";
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

// ── 遊戲狀態初始化 ──────────────────────────────────────────
function createKarts(): Kart[] {
  const starts = [
    { x: CX, y: CY - RY_OUT + 18, angle: 0 },
    { x: CX - 14, y: CY - RY_OUT + 24, angle: 0.1 },
    { x: CX + 14, y: CY - RY_OUT + 24, angle: -0.1 },
    { x: CX, y: CY - RY_OUT + 32, angle: 0 },
  ];
  return [
    new Kart({
      id: "player",
      name: "小海盜",
      isPlayer: true,
      color: "#ef4444",
      sailColor: "#fecaca",
      ...starts[0],
    }),
    new Kart({
      id: "ai-1",
      name: "章魚船長",
      isPlayer: false,
      color: "#8b5cf6",
      sailColor: "#ddd6fe",
      skill: 0.55,
      ...starts[1],
    }),
    new Kart({
      id: "ai-2",
      name: "鯊魚水手",
      isPlayer: false,
      color: "#06b6d4",
      sailColor: "#cffafe",
      skill: 0.72,
      ...starts[2],
    }),
    new Kart({
      id: "ai-3",
      name: "鸚鵡舵手",
      isPlayer: false,
      color: "#22c55e",
      sailColor: "#bbf7d0",
      skill: 0.62,
      ...starts[3],
    }),
  ];
}

function resetTreasures(): void {
  for (const t of TREASURES) t.taken = false;
}

// ── React 頁面元件 ────────────────────────────────────────────
export default function PirateKartPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [phase, setPhase] = useState<Phase>("start");
  const [hud, setHud] = useState({ score: 0, lap: 1, pos: 1, treasures: 0 });
  const [result, setResult] = useState({ pos: 1, score: 0, treasures: 0 });

  const phaseRef = useRef<Phase>("start");
  const keysRef = useRef<Keys>({
    up: false,
    down: false,
    left: false,
    right: false,
    boost: false,
    fire: false,
  });
  const kartsRef = useRef<Kart[]>(createKarts());
  const ballsRef = useRef<Cannonball[]>([]);
  const prevAnglesRef = useRef<Map<string, number>>(new Map());
  const countdownRef = useRef(3.2);
  const waveRef = useRef(0);
  const finishOrderRef = useRef(0);
  const fireQueuedRef = useRef(false);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  phaseRef.current = phase;

  const startGame = useCallback(() => {
    resetTreasures();
    kartsRef.current = createKarts();
    ballsRef.current = [];
    prevAnglesRef.current.clear();
    countdownRef.current = 3.2;
    finishOrderRef.current = 0;
    setHud({ score: 0, lap: 1, pos: 1, treasures: 0 });
    setPhase("countdown");
  }, []);

  const getPosition = useCallback((player: Kart): number => {
    const sorted = [...kartsRef.current].sort((a, b) => {
      const score = (k: Kart) =>
        k.finished ? 1e6 + (100 - k.finishPos) : k.lap * 1000 + (k.checkpoint + 1) * 100 + k.treasures;
      return score(b) - score(a);
    });
    return sorted.findIndex((k) => k.id === player.id) + 1;
  }, []);

  const tick = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(0.05, (now - (lastRef.current || now)) / 1000);
      lastRef.current = now;
      waveRef.current += dt;

      const phaseNow = phaseRef.current;
      const karts = kartsRef.current;
      const player = karts.find((k) => k.isPlayer)!;

      if (phaseNow === "countdown") {
        countdownRef.current -= dt;
        if (countdownRef.current <= 0) setPhase("playing");
      }

      if (phaseNow === "playing" || phaseNow === "countdown") {
        const keys = keysRef.current;

        for (const kart of karts) {
          const prevA = prevAnglesRef.current.get(kart.id) ?? kartAngle(kart.x, kart.y);
          const onTrack = isOnTrack(kart.x, kart.y);

          if (phaseNow === "playing" && !kart.finished) {
            const inp = kart.isPlayer
              ? keys
              : aiInput(kart, player);
            kart.update(dt, inp, onTrack);

            if (kart.isPlayer && keys.fire && fireQueuedRef.current) {
              if (kart.tryFire(ballsRef.current)) fireQueuedRef.current = false;
            } else if (!kart.isPlayer && inp.fire) {
              kart.tryFire(ballsRef.current);
            }

            kart.integrate(dt);

            if (!onTrack) {
              const pushed = pushOntoTrack(kart.x, kart.y);
              kart.x = pushed.x;
              kart.y = pushed.y;
              kart.speed *= 0.85;
            }

            if (advanceCheckpoint(kart, prevA)) {
              if (kart.isPlayer) kart.score += 120;
              if (kart.lap >= TOTAL_LAPS && !kart.finished) {
                kart.finished = true;
                kart.finishPos = ++finishOrderRef.current;
                if (kart.isPlayer) {
                  const pos = kart.finishPos;
                  const bonus = pos === 1 ? 500 : pos === 2 ? 300 : pos === 3 ? 150 : 50;
                  kart.score += bonus;
                  setResult({
                    pos,
                    score: kart.score,
                    treasures: kart.treasures,
                  });
                  setPhase("won");
                }
              }
            }

            for (const t of TREASURES) {
              if (!t.taken && dist(kart.x, kart.y, t.x, t.y) < 14) {
                t.taken = true;
                kart.treasures += 1;
                kart.score += 80;
              }
            }
          }

          prevAnglesRef.current.set(kart.id, kartAngle(kart.x, kart.y));
        }

        // 砲彈
        const balls = ballsRef.current;
        for (let i = balls.length - 1; i >= 0; i--) {
          const b = balls[i];
          b.life -= dt;
          b.x += b.vx * dt * 60;
          b.y += b.vy * dt * 60;
          if (b.life <= 0 || !isOnTrack(b.x, b.y)) {
            balls.splice(i, 1);
            continue;
          }
          for (const kart of karts) {
            if (kart.id === b.owner || kart.finished) continue;
            if (dist(b.x, b.y, kart.x, kart.y) < 12) {
              kart.stunTimer = 0.55;
              kart.speed *= 0.4;
              kart.score = Math.max(0, kart.score - (kart.isPlayer ? 30 : 0));
              balls.splice(i, 1);
              break;
            }
          }
        }

        // 車車互撞
        for (let i = 0; i < karts.length; i++) {
          for (let j = i + 1; j < karts.length; j++) {
            const a = karts[i];
            const b = karts[j];
            const d = dist(a.x, a.y, b.x, b.y);
            if (d < 16 && d > 0) {
              const push = (16 - d) * 0.5;
              const nx = (a.x - b.x) / d;
              const ny = (a.y - b.y) / d;
              a.x += nx * push;
              a.y += ny * push;
              b.x -= nx * push;
              b.y -= ny * push;
              a.speed *= 0.92;
              b.speed *= 0.92;
            }
          }
        }

        setHud({
          score: player.score,
          lap: Math.min(TOTAL_LAPS, player.lap + 1),
          pos: getPosition(player),
          treasures: player.treasures,
        });
      }

      drawScene(ctx, karts, ballsRef.current, waveRef.current);

      if (phaseNow === "countdown") {
        const c = Math.ceil(countdownRef.current);
        drawPixelText(ctx, c > 0 ? String(c) : "GO!", W / 2 - 12, H / 2, "#fef08a");
      }

      if (phaseNow === "playing") {
        drawPixelText(
          ctx,
          `圈 ${Math.min(TOTAL_LAPS, player.lap + 1)}/${TOTAL_LAPS}  寶藏 ${player.treasures}  分 ${player.score}`,
          8,
          14,
        );
        if (player.boostTimer > 0) {
          drawPixelText(ctx, "張帆加速！", 8, 26, "#fde047");
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    },
    [getPosition],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup") keysRef.current.up = true;
      if (k === "arrowdown") keysRef.current.down = true;
      if (k === "arrowleft") keysRef.current.left = true;
      if (k === "arrowright") keysRef.current.right = true;
      if (k === "shift") keysRef.current.boost = true;
      if (k === " ") {
        keysRef.current.fire = true;
        fireQueuedRef.current = true;
        e.preventDefault();
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup") keysRef.current.up = false;
      if (k === "arrowdown") keysRef.current.down = false;
      if (k === "arrowleft") keysRef.current.left = false;
      if (k === "arrowright") keysRef.current.right = false;
      if (k === "shift") keysRef.current.boost = false;
      if (k === " ") keysRef.current.fire = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  return (
    <main className={styles.main} aria-label="海盜卡丁車大賽小遊戲">
      <Link href="/games" className={styles.back}>
        ← 回遊樂園
      </Link>

      <div className={styles.hud}>
        <span className={styles.pill}>分數 {hud.score}</span>
        <span className={styles.pill}>
          第 {hud.lap}/{TOTAL_LAPS} 圈
        </span>
        <span className={styles.pill}>名次 {hud.pos}/{AI_COUNT + 1}</span>
        <span className={styles.pill}>寶藏 {hud.treasures}</span>
      </div>

      <div className={styles.frame}>
        <canvas ref={canvasRef} className={styles.canvas} aria-label="海盜卡丁車賽道" />

        {phase === "start" && (
          <div className={styles.overlay} role="dialog" aria-modal="true">
            <h1>🏴‍☠️ 海盜卡丁車大賽</h1>
            <p>
              駕駛海盜船繞島三圈！收集寶藏加分，用 Shift 張帆加速、空白鍵發射大砲。
            </p>
            <div className={styles.scoreRow}>
              <span className={styles.pill}>16-bit 像素風</span>
              <span className={styles.pill}>{AI_COUNT} 台 AI 對手</span>
            </div>
            <button type="button" className={styles.btn} onClick={startGame}>
              開始航行
            </button>
          </div>
        )}

        {phase === "won" && (
          <div className={styles.overlay} role="dialog" aria-modal="true">
            <h1>🏁 航程結束！</h1>
            <p>
              你獲得第 <strong>{result.pos}</strong> 名 · 總分{" "}
              <strong>{result.score}</strong> · 寶藏{" "}
              <strong>{result.treasures}</strong> 個
            </p>
            <button type="button" className={styles.btn} onClick={startGame}>
              再玩一次
            </button>
            <button
              type="button"
              className={styles.btn}
              style={{ background: "linear-gradient(180deg,#64748b,#475569)", boxShadow: "0 4px 0 #334155" }}
              onClick={() => setPhase("start")}
            >
              回主選單
            </button>
          </div>
        )}
      </div>

      <p className={styles.hint}>
        方向鍵轉向與前進 · Shift 張帆加速 · 空白鍵大砲 · 收集金色寶藏、跑完三圈即獲勝
      </p>

      {/* TODO: 觸控虛擬按鈕 */}
      {/* TODO: 接入 lib/gamekit/session reportGameSession */}
      {/* TODO: 抽到 lib/gamekit/ 共用 Kart 物理與賽道資料 */}
      {/* TODO: 更多賽道／道具種類／本地最高分 */}
    </main>
  );
}
