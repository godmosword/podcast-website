"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import GameShell from "@/components/games/GameShell";
import PixelGameCanvas, {
  usePixelGameSurface,
} from "@/components/games/PixelGameCanvas";
import { useBestScore } from "@/hooks/useBestScore";
import { useGameAudio } from "@/hooks/useGameAudio";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { canvasPaletteFromKit } from "@/lib/gamekit/bridge";
import { createKitSprite, type SpriteHandle } from "@/lib/gamekit/assets";
import {
  FIREFLY_BLINK,
  TRUCK_DRIVE,
  TRUCK_IDLE,
} from "@/lib/gamekit/sprite-defs";
import { drawPixelText } from "@/lib/gamekit/style";
import type { CanvasPalette } from "@/lib/games/canvas-palette";
import styles from "./CarMissionGame.module.css";

interface Firefly {
  x: number;
  y: number;
  size: number;
  happy: boolean;
}

type GameStatus = "ready" | "playing" | "finished";

const CANVAS_WIDTH = 320;
const CANVAS_HEIGHT = 240;
const LANES = 3;
const LANE_WIDTH = CANVAS_WIDTH / LANES;
const BASE_SPEED = 1.2;

function GamePill({ children }: { children: React.ReactNode }) {
  return <span className={styles.pill}>{children}</span>;
}

type PlayfieldProps = {
  status: GameStatus;
  setStatus: (s: GameStatus) => void;
  gentleness: number;
  setGentleness: React.Dispatch<React.SetStateAction<number>>;
  distance: number;
  setDistance: React.Dispatch<React.SetStateAction<number>>;
  score: number;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  combo: number;
  setCombo: React.Dispatch<React.SetStateAction<number>>;
  saveBest: (n: number) => void;
  reduced: boolean;
  ensureAudio: () => void;
  tone: (
    f: number,
    d: number,
    type?: OscillatorType,
    vol?: number,
  ) => void;
  onStart: () => void;
  onRestart: () => void;
};

function CarMissionPlayfield({
  status,
  setStatus,
  gentleness,
  setGentleness,
  distance,
  setDistance,
  score,
  setScore,
  combo,
  setCombo,
  saveBest,
  reduced,
  ensureAudio,
  tone,
  onStart,
  onRestart,
}: PlayfieldProps) {
  const { rendererRef, present } = usePixelGameSurface();
  const animationRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>(status);
  const paletteRef = useRef<CanvasPalette>(canvasPaletteFromKit("car-mission"));
  const slowRef = useRef(false);
  const frameRef = useRef(0);
  const truckSpriteRef = useRef<SpriteHandle | null>(null);
  const fireflySpriteRef = useRef<SpriteHandle | null>(null);

  const gameStateRef = useRef({
    truckX: LANE_WIDTH * 1.5,
    truckLane: 1,
    speed: BASE_SPEED,
    fireflies: [] as Firefly[],
    distance: 0,
    gentleCombo: 0,
  });

  statusRef.current = status;

  const sRoll = useCallback(() => tone(520, 0.05, "square", 0.03), [tone]);
  const sHonk = useCallback(() => tone(180, 0.18, "sawtooth", 0.06), [tone]);
  const sBump = useCallback(() => tone(110, 0.28, "sawtooth", 0.06), [tone]);
  const sGentle = useCallback(() => tone(660, 0.12, "triangle", 0.045), [tone]);
  const sWin = useCallback(() => {
    [523, 659, 784].forEach((f, i) =>
      setTimeout(() => tone(f, 0.18, "triangle", 0.06), i * 140),
    );
  }, [tone]);

  const initFireflies = useCallback(() => {
    const flies: Firefly[] = [];
    for (let i = 0; i < 8; i++) {
      flies.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 60 + Math.random() * (CANVAS_HEIGHT - 120),
        size: 5 + Math.random() * 4,
        happy: false,
      });
    }
    gameStateRef.current.fireflies = flies;
  }, []);

  const draw = useCallback(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    const ctx = renderer.context;
    const state = gameStateRef.current;
    const p = paletteRef.current;

    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = p.road;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = p.roadMark;
    ctx.lineWidth = 1;
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }

    const truckY = CANVAS_HEIGHT - 52;
    const truckSprite = truckSpriteRef.current;
    if (truckSprite) {
      truckSprite.play(state.speed < 0.85 ? TRUCK_IDLE : TRUCK_DRIVE, false);
      truckSprite.draw(ctx, state.truckX, truckY + 24, 1);
    }

    const fireflySprite = fireflySpriteRef.current;
    if (fireflySprite) {
      state.fireflies.forEach((fly) => {
        if (!fly.happy) {
          ctx.fillStyle = p.fireflyGlow;
          ctx.beginPath();
          ctx.arc(fly.x, fly.y, fly.size * 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
        fireflySprite.draw(ctx, fly.x, fly.y, fly.size / 4);
      });
    }

    if (state.speed < 0.8) {
      drawPixelText(ctx, "溫柔", state.truckX - 12, truckY - 14, {
        color: p.gentleHint,
        scale: 1,
      });
    }

    present();
  }, [present, rendererRef]);

  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;

    frameRef.current += 1;
    const motionScale = reduced ? 0.45 : 1;
    const frameSkip = reduced ? 2 : 1;
    const dt = (1 / 60) * motionScale;
    truckSpriteRef.current?.update(dt);
    fireflySpriteRef.current?.update(dt);
    if (frameRef.current % frameSkip !== 0) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return;
    }

    const state = gameStateRef.current;

    if (slowRef.current) {
      state.speed = Math.max(0.5, state.speed - 0.08 * motionScale);
    }

    const paceBoost = 1 + state.distance * 0.003;
    state.distance += state.speed * 0.6 * motionScale * paceBoost;
    const newDistance = Math.min(100, Math.floor(state.distance));
    setDistance(newDistance);

    state.fireflies.forEach((fly) => {
      fly.y += 0.8 * motionScale;
      if (fly.y > CANVAS_HEIGHT) {
        fly.y = 45;
        fly.x = Math.random() * CANVAS_WIDTH;
        fly.happy = false;
      }
    });

    const truckY = CANVAS_HEIGHT - 52;
    state.fireflies.forEach((fly) => {
      const distX = Math.abs(fly.x - state.truckX);
      const distY = Math.abs(fly.y - truckY);

      if (distX < 24 && distY < 24 && !fly.happy) {
        if (state.speed > 1.0) {
          state.gentleCombo = 0;
          setCombo(0);
          setGentleness((prev) => Math.max(0, prev - 8));
          sBump();
        } else {
          fly.happy = true;
          state.gentleCombo += 1;
          const comboBonus =
            state.gentleCombo >= 2 ? 5 * (state.gentleCombo - 1) : 0;
          setCombo(state.gentleCombo);
          setScore((prev) => prev + 15 + comboBonus);
          setGentleness((prev) => Math.min(100, prev + 5));
          sGentle();
        }
      }
    });

    const targetSpeed = Math.min(
      BASE_SPEED + state.distance * 0.003,
      1.35,
    );
    if (state.speed < targetSpeed) {
      state.speed += 0.015 * motionScale;
    }

    draw();

    if (newDistance >= 100) {
      statusRef.current = "finished";
      setStatus("finished");
      setGentleness((g) => {
        setScore((prev) => {
          const finalScore = prev + Math.floor(g / 2);
          saveBest(finalScore);
          return finalScore;
        });
        return g;
      });
      sWin();
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [
    draw,
    reduced,
    saveBest,
    sBump,
    sGentle,
    sWin,
    setCombo,
    setDistance,
    setGentleness,
    setScore,
    setStatus,
  ]);

  const startGame = useCallback(() => {
    ensureAudio();
    paletteRef.current = canvasPaletteFromKit("car-mission");
    gameStateRef.current = {
      truckX: LANE_WIDTH * 1.5,
      truckLane: 1,
      speed: BASE_SPEED,
      fireflies: [],
      distance: 0,
      gentleCombo: 0,
    };
    frameRef.current = 0;
    initFireflies();
    setGentleness(100);
    setDistance(0);
    setScore(0);
    setCombo(0);
    statusRef.current = "playing";
    setStatus("playing");
    onStart();

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [
    ensureAudio,
    gameLoop,
    initFireflies,
    onStart,
    setCombo,
    setDistance,
    setGentleness,
    setScore,
    setStatus,
  ]);

  const changeLane = useCallback(
    (direction: number) => {
      const state = gameStateRef.current;
      const newLane = Math.max(
        0,
        Math.min(LANES - 1, state.truckLane + direction),
      );
      if (newLane !== state.truckLane) {
        state.truckLane = newLane;
        state.truckX = LANE_WIDTH * (newLane + 0.5);
        sRoll();
      }
    },
    [sRoll],
  );

  const setSlow = useCallback((pressing: boolean) => {
    slowRef.current = pressing;
  }, []);

  const honk = useCallback(() => {
    const state = gameStateRef.current;
    let hit = false;

    state.fireflies.forEach((fly) => {
      const dist = Math.abs(fly.x - state.truckX);
      if (dist < 56 && !fly.happy) {
        fly.happy = true;
        hit = true;
      }
    });

    sHonk();
    if (hit) {
      setScore((prev) => prev + 25);
      setGentleness((prev) => Math.min(100, prev + 8));
    }
  }, [sHonk, setGentleness, setScore]);

  const restart = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    statusRef.current = "ready";
    setStatus("ready");
    paletteRef.current = canvasPaletteFromKit("car-mission");
    draw();
    onRestart();
  }, [draw, onRestart, setStatus]);

  useEffect(() => {
    truckSpriteRef.current = createKitSprite("truck-mission", TRUCK_IDLE, 0.5, 1);
    fireflySpriteRef.current = createKitSprite("firefly", FIREFLY_BLINK, 0.5, 0.5);
    paletteRef.current = canvasPaletteFromKit("car-mission");
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== "playing") return;
      const key = e.key.toLowerCase();
      if (key === "arrowleft" || key === "a") changeLane(-1);
      if (key === "arrowright" || key === "d") changeLane(1);
      if (key === "arrowup" || key === "w") {
        e.preventDefault();
        setSlow(true);
      }
      if (key === "arrowdown" || key === "s") {
        e.preventDefault();
        honk();
      }
      if (e.key === " ") {
        e.preventDefault();
        honk();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") setSlow(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [changeLane, honk, setSlow]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      } else if (!document.hidden && statusRef.current === "playing") {
        animationRef.current = requestAnimationFrame(gameLoop);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [gameLoop]);

  useEffect(
    () => () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    },
    [],
  );

  return (
    <>
      {status === "ready" && (
        <div className={styles.overlay}>
          <button type="button" onClick={startGame} className={styles.bigButton}>
            開始溫柔任務
          </button>
          <p className={styles.hint}>慢慢開、輕輕對待螢火蟲</p>
        </div>
      )}

      {status === "finished" && (
        <div className={styles.overlay}>
          <h3>太棒了！</h3>
          <p>你讓怪獸卡車溫柔完成了任務！</p>
          <p>最終分數：{score}</p>
          <div className={styles.endButtons}>
            <button type="button" onClick={restart} className={styles.bigButton}>
              再玩一次
            </button>
            <Link href="/" className={styles.secondaryButton}>
              回故事屋
            </Link>
          </div>
        </div>
      )}

      {status === "playing" && (
        <div className={styles.controlsOverlay}>
          <div className={styles.controlRow}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => changeLane(-1)}
            >
              ←
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => changeLane(1)}
            >
              →
            </button>
          </div>
          <div className={styles.controlRow}>
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.slowBtn}`}
              onPointerDown={(e) => {
                e.preventDefault();
                setSlow(true);
              }}
              onPointerUp={() => setSlow(false)}
              onPointerLeave={() => setSlow(false)}
              onPointerCancel={() => setSlow(false)}
            >
              慢
            </button>
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.honkBtn}`}
              onClick={honk}
            >
              叭
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function CarMissionGame() {
  const reduced = useReducedMotion();
  const shellRef = useRef<HTMLDivElement>(null);
  const { ensureAudio, tone, soundUi, toggleSound } = useGameAudio(true);
  const [best, saveBest] = useBestScore("car-mission-best");

  const [gentleness, setGentleness] = useState(100);
  const [distance, setDistance] = useState(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);

  const liveSummary = `溫柔度 ${Math.floor(gentleness)}%，距離 ${distance}%，分數 ${score}${
    combo >= 2 ? `，連續溫柔 ${combo} 次` : ""
  }`;

  return (
    <GameShell
      shellRef={shellRef}
      frameColor="var(--c-pink)"
      frameAccent="var(--c-pink)"
      title="🚚 怪獸卡車的溫柔任務"
      subtitle="慢慢開、輕輕對待螢火蟲"
      hud={
        <>
          <GamePill>⭐ {score}</GamePill>
          {best != null && <GamePill>最佳 ⭐ {best}</GamePill>}
          <button
            type="button"
            onClick={toggleSound}
            className={styles.soundBtn}
            aria-label={soundUi ? "關閉音效" : "開啟音效"}
            aria-pressed={soundUi}
          >
            {soundUi ? "🔊" : "🔇"}
          </button>
        </>
      }
    >
      <div
        className={styles.liveStats}
        role="status"
        aria-live="polite"
        aria-label={liveSummary}
      >
        <GamePill>溫柔度 {Math.floor(gentleness)}%</GamePill>
        <GamePill>距離 {distance}%</GamePill>
      </div>

      {combo >= 2 && status === "playing" && (
        <p className={styles.comboHint} aria-hidden="true">
          連續溫柔 x{combo}！
        </p>
      )}

      <div className={styles.canvasWrap}>
        <PixelGameCanvas gameId="car-mission" className={styles.pixelFrame}>
          <CarMissionPlayfield
            status={status}
            setStatus={setStatus}
            gentleness={gentleness}
            setGentleness={setGentleness}
            distance={distance}
            setDistance={setDistance}
            score={score}
            setScore={setScore}
            combo={combo}
            setCombo={setCombo}
            saveBest={saveBest}
            reduced={reduced}
            ensureAudio={ensureAudio}
            tone={tone}
            onStart={() => {}}
            onRestart={() => {}}
          />
        </PixelGameCanvas>
      </div>

      {status === "playing" && (
        <div className={styles.controls}>
          <p className={styles.hint} aria-hidden="true">
            方向鍵或下方按鈕：左右換道、按住「慢」溫柔前進、按「叭」輕按喇叭
          </p>
        </div>
      )}
    </GameShell>
  );
}
