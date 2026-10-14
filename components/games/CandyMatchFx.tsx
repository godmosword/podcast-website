"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { PieceArt } from "@/components/games/CandyMatchPieceArt";
import {
  CANDY_MATCH_BOARD_PADDING,
  CANDY_MATCH_CELL_GAP,
  candyMatchBoardOuterWidth,
} from "@/lib/games/candy-match/cell-size";
import {
  BURST_FX_MS,
  COLOR_FX_MS,
  LINE_FX_MS,
  MAX_COLOR_BEAMS,
  PARTICLE_MS,
  PARTICLES_PER_CELL,
  PARTICLE_CAP,
  SHAKE_MS,
  SHAKE_PX,
  confettiPieces,
  type CandyFxPraise,
  type ClearFx,
  type ColorFx,
  type ParticleSeed,
} from "@/lib/games/candy-match/effects";
import styles from "./CandyMatchFx.module.css";

type CandyMatchFxProps = {
  cols: number;
  rows: number;
  cellPx: number;
  fx: readonly ClearFx[];
  praise: CandyFxPraise | null;
  particles: readonly ParticleSeed[];
  particleBurst: number;
  reduced: boolean;
};

const SHARD_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

function cellOrigin(index: number, cols: number, cellPx: number): { x: number; y: number } {
  const col = index % cols;
  const row = Math.floor(index / cols);
  const step = cellPx + CANDY_MATCH_CELL_GAP;
  return {
    x: CANDY_MATCH_BOARD_PADDING + col * step,
    y: CANDY_MATCH_BOARD_PADDING + row * step,
  };
}

function lineStyle(axis: "row" | "col", index: number, cellPx: number, span: number): CSSProperties {
  const travel = candyMatchBoardOuterWidth(cellPx, span);
  const along = CANDY_MATCH_BOARD_PADDING + index * (cellPx + CANDY_MATCH_CELL_GAP);
  return {
    ["--fx-size" as string]: `${cellPx}px`,
    ["--fx-ms" as string]: `${LINE_FX_MS}ms`,
    ["--fx-travel" as string]: `${travel}px`,
    ["--fx-top" as string]: `${along}px`,
    ["--fx-left" as string]: `${along}px`,
  };
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outer = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const inner = outer + Math.PI / 5;
    const ox = x + Math.cos(outer) * radius;
    const oy = y + Math.sin(outer) * radius;
    const ix = x + Math.cos(inner) * radius * 0.42;
    const iy = y + Math.sin(inner) * radius * 0.42;
    if (i === 0) ctx.moveTo(ox, oy);
    else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
}

type MatchDot = { x: number; y: number; vx: number; vy: number; color: string };

function paintMatchStars(ctx: CanvasRenderingContext2D, dots: readonly MatchDot[], t: number) {
  const alpha = 0.92 * (1 - t);
  for (const dot of dots) {
    const x = dot.x + dot.vx * t;
    const y = dot.y + dot.vy * t;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#fff";
    drawStar(ctx, x, y, 6.4);
    ctx.fillStyle = dot.color;
    drawStar(ctx, x, y, 4.4);
  }
  ctx.globalAlpha = 1;
}

function MatchParticles({
  burstId,
  seeds,
  cols,
  cellPx,
}: {
  burstId: number;
  seeds: readonly ParticleSeed[];
  cols: number;
  cellPx: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const seedsRef = useRef(seeds);
  seedsRef.current = seeds;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (burstId === 0 || !canvas) return;
    let frame = 0;
    let stopped = false;
    const stop = () => {
      stopped = true;
      cancelAnimationFrame(frame);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
    const begin = () => {
      if (stopped || document.hidden) return;
      const parent = canvas.parentElement;
      const width = parent?.clientWidth ?? 0;
      const height = parent?.clientHeight ?? 0;
      if (width <= 0 || height <= 0) {
        frame = requestAnimationFrame(begin);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const dots: MatchDot[] = [];
      let budget = PARTICLE_CAP;
      for (const seed of seedsRef.current) {
        if (budget <= 0) break;
        const origin = cellOrigin(seed.cell, cols, cellPx);
        const cx = origin.x + cellPx / 2;
        const cy = origin.y + cellPx / 2;
        const count = Math.min(PARTICLES_PER_CELL, budget);
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count + 0.35;
          dots.push({
            x: cx,
            y: cy,
            vx: Math.cos(angle) * 48,
            vy: Math.sin(angle) * 48 - 10,
            color: seed.color,
          });
        }
        budget -= count;
      }

      const start = performance.now();
      const tick = (now: number) => {
        if (stopped || document.hidden) {
          stop();
          return;
        }
        const t = Math.min(1, (now - start) / PARTICLE_MS);
        ctx.clearRect(0, 0, width, height);
        if (t >= 1) return;
        paintMatchStars(ctx, dots, t);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    };
    begin();
    const onHide = () => {
      if (document.hidden) stop();
    };
    document.addEventListener("visibilitychange", onHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      stop();
    };
  }, [burstId, cellPx, cols]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.particles}
      data-testid="candy-match-particles"
      aria-hidden
    />
  );
}

function RainbowBeams({
  fx,
  cols,
  rows,
  cellPx,
}: {
  fx: ColorFx;
  cols: number;
  rows: number;
  cellPx: number;
}) {
  const from = cellOrigin(fx.origin, cols, cellPx);
  const x1 = from.x + cellPx / 2;
  const y1 = from.y + cellPx / 2;
  const width = candyMatchBoardOuterWidth(cellPx, cols);
  const height = candyMatchBoardOuterWidth(cellPx, rows);
  const gradientId = `candy-rainbow-${fx.origin}`;
  const cells = fx.cells.filter((cell) => cell !== fx.origin).slice(0, MAX_COLOR_BEAMS);
  return (
    <svg className={styles.rainbow} viewBox={`0 0 ${width} ${height}`} data-testid="candy-fx-color" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ff7a9c" />
          <stop offset="0.2" stopColor="#ffd34d" />
          <stop offset="0.45" stopColor="#7fd4a8" />
          <stop offset="0.7" stopColor="#6fc3f0" />
          <stop offset="1" stopColor="#c9a8ff" />
        </linearGradient>
      </defs>
      <circle
        cx={x1}
        cy={y1}
        r={Math.max(8, cellPx * 0.42)}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth="6"
        pathLength={1}
        className={styles.beam}
        style={{ ["--fx-ms" as string]: `${COLOR_FX_MS}ms` }}
      />
      {cells.map((cell) => {
        const to = cellOrigin(cell, cols, cellPx);
        return (
          <line
            key={cell}
            className={styles.beam}
            x1={x1}
            y1={y1}
            x2={to.x + cellPx / 2}
            y2={to.y + cellPx / 2}
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            pathLength={1}
            style={{ ["--fx-ms" as string]: `${COLOR_FX_MS}ms` }}
          />
        );
      })}
    </svg>
  );
}

function StillMarks({
  fx,
  cols,
  rows,
  cellPx,
}: {
  fx: readonly ClearFx[];
  cols: number;
  rows: number;
  cellPx: number;
}) {
  return (
    <>
      {fx.map((item, index) => {
        if (item.kind === "line") {
          const along = CANDY_MATCH_BOARD_PADDING + item.index * (cellPx + CANDY_MATCH_CELL_GAP);
          const style: CSSProperties =
            item.axis === "row"
              ? { left: 0, top: along, width: candyMatchBoardOuterWidth(cellPx, cols), height: cellPx }
              : { left: along, top: 0, width: cellPx, height: candyMatchBoardOuterWidth(cellPx, rows) };
          return <span key={`still-${index}`} className={styles.stillBar} style={style} data-testid="candy-fx-still" />;
        }
        const origin = cellOrigin(item.origin, cols, cellPx);
        return (
          <span
            key={`still-${index}`}
            className={styles.stillBar}
            data-testid="candy-fx-still"
            style={{ left: origin.x, top: origin.y, width: cellPx, height: cellPx }}
          />
        );
      })}
    </>
  );
}

export function CandyMatchFx({
  cols,
  rows,
  cellPx,
  fx,
  praise,
  particles,
  particleBurst,
  reduced,
}: CandyMatchFxProps) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const showMotion = !reduced && !paused;
  const praiseStep = Math.min(3, Math.max(1, praise?.step ?? 1));
  const confetti = praise?.confetti && showMotion ? confettiPieces(praise.step) : [];
  const boardHeight = candyMatchBoardOuterWidth(cellPx, rows);

  return (
    <div
      className={styles.layer}
      data-paused={paused ? "true" : undefined}
      data-reduced={reduced ? "true" : undefined}
      data-shake-ms={SHAKE_MS}
      data-shake-px={SHAKE_PX}
      aria-hidden
    >
      {showMotion
        ? fx.map((item, index) => {
            if (item.kind === "line") {
              const span = item.axis === "row" ? cols : rows;
              const style = lineStyle(item.axis, item.index, cellPx, span);
              return (
                <span key={`line-${item.axis}-${item.index}-${index}`} data-testid="candy-fx-line" data-axis={item.axis}>
                  <span className={styles.trail} data-axis={item.axis} style={style} />
                  <span className={styles.car} data-axis={item.axis} style={style}>
                    <PieceArt piece={0} size={cellPx} />
                  </span>
                </span>
              );
            }
            if (item.kind === "burst") {
              const origin = cellOrigin(item.origin, cols, cellPx);
              const style: CSSProperties = {
                ["--fx-size" as string]: `${cellPx}px`,
                ["--fx-ms" as string]: `${BURST_FX_MS}ms`,
                ["--fx-left" as string]: `${origin.x}px`,
                ["--fx-top" as string]: `${origin.y}px`,
              };
              return (
                <span key={`burst-${item.origin}`} data-testid="candy-fx-burst">
                  <span className={styles.ring} style={style} />
                  {SHARD_ANGLES.map((angle) => (
                    <i
                      key={angle}
                      className={styles.shard}
                      style={{ ...style, ["--a" as string]: `${angle}deg` }}
                    />
                  ))}
                  <span className={styles.cone} style={style}>
                    <svg viewBox="0 0 48 48" width={cellPx} height={cellPx} aria-hidden focusable="false">
                      <path d="M24 4 37 39H11Z" fill="#ff8a3d" stroke="#c95a14" strokeWidth="2" />
                      <path d="M18.5 22h11l2 6h-15Z" fill="#fff" />
                    </svg>
                  </span>
                </span>
              );
            }
            return <RainbowBeams key={`color-${item.origin}`} fx={item} cols={cols} rows={rows} cellPx={cellPx} />;
          })
        : null}
      {reduced && fx.length > 0 ? <StillMarks fx={fx} cols={cols} rows={rows} cellPx={cellPx} /> : null}
      {particleBurst > 0 && showMotion ? (
        <MatchParticles burstId={particleBurst} seeds={particles} cols={cols} cellPx={cellPx} />
      ) : null}
      {praise ? (
        <span
          key={praise.id}
          className={styles.praise}
          data-testid="candy-fx-praise"
          data-step={praiseStep}
          data-still={showMotion ? undefined : "true"}
        >
          {praise.text}
        </span>
      ) : null}
      {confetti.map((piece, index) => (
        <i
          key={`${praise?.id ?? 0}-${index}`}
          className={styles.confetti}
          data-testid="candy-fx-confetti"
          style={{
            left: `${piece.left}%`,
            background: piece.color,
            animationDelay: `${piece.delayMs}ms`,
            ["--fall" as string]: `${Math.max(80, boardHeight - 8)}px`,
          }}
        />
      ))}
    </div>
  );
}
