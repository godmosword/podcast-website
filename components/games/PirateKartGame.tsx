"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createKarts } from "@/lib/games/pirate-kart/game-state";
import { Kart } from "@/lib/games/pirate-kart/kart";
import {
  advanceCheckpoint,
  aiInput,
  dist,
  isOnTrack,
  kartAngle,
  pushOntoTrack,
} from "@/lib/games/pirate-kart/physics";
import { drawPixelText, drawScene } from "@/lib/games/pirate-kart/render";
import {
  AI_COUNT,
  H,
  resetTreasures,
  TOTAL_LAPS,
  TREASURES,
  W,
} from "@/lib/games/pirate-kart/tracks";
import type { Cannonball, Keys, Phase } from "@/lib/games/pirate-kart/types";
import { reportGameSession } from "@/lib/gamekit/session";
import { GameResultActions } from "@/components/games/GameResultActions";
import styles from "./PirateKartGame.module.css";

export default function PirateKartGame() {
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
  const sessionReportedRef = useRef(false);
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
    sessionReportedRef.current = false;
    setHud({ score: 0, lap: 1, pos: 1, treasures: 0 });
    setPhase("countdown");
  }, []);

  const getPosition = useCallback((player: Kart): number => {
    const sorted = [...kartsRef.current].sort((a, b) => {
      const score = (k: Kart) =>
        k.finished
          ? 1e6 + (100 - k.finishPos)
          : k.lap * 1000 + (k.checkpoint + 1) * 100 + k.treasures;
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
          const prevA =
            prevAnglesRef.current.get(kart.id) ?? kartAngle(kart.x, kart.y);
          const onTrack = isOnTrack(kart.x, kart.y);

          if (phaseNow === "playing" && !kart.finished) {
            const inp = kart.isPlayer ? keys : aiInput(kart, player);
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
                  const bonus =
                    pos === 1 ? 500 : pos === 2 ? 300 : pos === 3 ? 150 : 50;
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
        drawPixelText(
          ctx,
          c > 0 ? String(c) : "GO!",
          W / 2 - 12,
          H / 2,
          "#fef08a",
        );
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
      if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)
      ) {
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

  useEffect(() => {
    if (phase !== "won" || sessionReportedRef.current) return;
    sessionReportedRef.current = true;
    reportGameSession({ gameId: "pirate-kart", score: result.score });
  }, [phase, result.score]);

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
        <span className={styles.pill}>
          名次 {hud.pos}/{AI_COUNT + 1}
        </span>
        <span className={styles.pill}>寶藏 {hud.treasures}</span>
      </div>

      <div className={styles.frame}>
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          aria-label="海盜卡丁車賽道"
        />

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
            <GameResultActions
              onReplay={startGame}
              replayLabel="再玩一次"
              replayClassName={styles.btn}
              extraActions={
                <button
                  type="button"
                  className={styles.btn}
                  style={{
                    background: "linear-gradient(180deg,#64748b,#475569)",
                    boxShadow: "0 4px 0 #334155",
                  }}
                  onClick={() => setPhase("start")}
                >
                  回主選單
                </button>
              }
            />
          </div>
        )}
      </div>

      <p className={styles.hint}>
        方向鍵轉向與前進 · Shift 張帆加速 · 空白鍵大砲 · 收集金色寶藏、跑完三圈即獲勝
      </p>
    </main>
  );
}
