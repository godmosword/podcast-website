"use client";

import Link from "next/link";
import { useRef, useEffect, useState, useCallback } from "react";
import styles from "./CarMissionGame.module.css";

interface Firefly {
  x: number;
  y: number;
  size: number;
  happy: boolean;
}

type GameStatus = "ready" | "playing" | "finished";

const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 320;
const LANES = 3;
const LANE_WIDTH = CANVAS_WIDTH / LANES;
const BASE_SPEED = 1.2;

export default function CarMissionGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const statusRef = useRef<GameStatus>("ready");

  const [gentleness, setGentleness] = useState(100);
  const [distance, setDistance] = useState(0);
  const [status, setStatus] = useState<GameStatus>("ready");
  const [score, setScore] = useState(0);

  statusRef.current = status;

  const gameStateRef = useRef({
    truckX: LANE_WIDTH * 1.5,
    truckLane: 1,
    speed: BASE_SPEED,
    fireflies: [] as Firefly[],
    distance: 0,
  });

  const initFireflies = useCallback(() => {
    const flies: Firefly[] = [];
    for (let i = 0; i < 8; i++) {
      flies.push({
        x: Math.random() * CANVAS_WIDTH,
        y: 80 + Math.random() * (CANVAS_HEIGHT - 160),
        size: 8 + Math.random() * 6,
        happy: false,
      });
    }
    gameStateRef.current.fireflies = flies;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    const state = gameStateRef.current;

    ctx.fillStyle = "#3a4a3f";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = "#ffffff55";
    ctx.lineWidth = 2;
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, 0);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }

    const truckY = CANVAS_HEIGHT - 70;
    ctx.fillStyle = "#ff6b6b";
    ctx.fillRect(state.truckX - 22, truckY, 44, 32);
    ctx.fillStyle = "#222";
    ctx.fillRect(state.truckX - 18, truckY + 24, 12, 8);
    ctx.fillRect(state.truckX + 6, truckY + 24, 12, 8);

    state.fireflies.forEach((fly) => {
      ctx.fillStyle = "#ffeb3b";
      ctx.beginPath();
      ctx.arc(fly.x, fly.y, fly.size, 0, Math.PI * 2);
      ctx.fill();

      if (!fly.happy) {
        ctx.fillStyle = "#ffffff33";
        ctx.beginPath();
        ctx.arc(fly.x, fly.y, fly.size * 1.6, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    if (state.speed < 0.8) {
      ctx.fillStyle = "#4ade80";
      ctx.font = "14px sans-serif";
      ctx.fillText("溫柔模式", state.truckX - 30, truckY - 15);
    }
  }, []);

  const gameLoop = useCallback(() => {
    if (statusRef.current !== "playing") return;

    const state = gameStateRef.current;

    state.distance += state.speed * 0.6;
    const newDistance = Math.min(100, Math.floor(state.distance));
    setDistance(newDistance);

    state.fireflies.forEach((fly) => {
      fly.y += 0.8;
      if (fly.y > CANVAS_HEIGHT) {
        fly.y = 60;
        fly.x = Math.random() * CANVAS_WIDTH;
        fly.happy = false;
      }
    });

    const truckY = CANVAS_HEIGHT - 70;
    state.fireflies.forEach((fly) => {
      const distX = Math.abs(fly.x - state.truckX);
      const distY = Math.abs(fly.y - truckY);

      if (distX < 35 && distY < 35 && !fly.happy) {
        if (state.speed > 1.0) {
          setGentleness((prev) => Math.max(0, prev - 8));
        } else {
          fly.happy = true;
          setScore((prev) => prev + 15);
          setGentleness((prev) => Math.min(100, prev + 5));
        }
      }
    });

    if (state.speed < BASE_SPEED) {
      state.speed += 0.015;
    }

    draw();

    if (newDistance >= 100) {
      statusRef.current = "finished";
      setStatus("finished");
      setGentleness((g) => {
        setScore((prev) => prev + Math.floor(g / 2));
        return g;
      });
      return;
    }

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [draw]);

  const startGame = useCallback(() => {
    gameStateRef.current = {
      truckX: LANE_WIDTH * 1.5,
      truckLane: 1,
      speed: BASE_SPEED,
      fireflies: [],
      distance: 0,
    };
    initFireflies();
    setGentleness(100);
    setDistance(0);
    setScore(0);
    statusRef.current = "playing";
    setStatus("playing");

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameLoop, initFireflies]);

  const changeLane = useCallback((direction: number) => {
    const state = gameStateRef.current;
    const newLane = Math.max(0, Math.min(LANES - 1, state.truckLane + direction));
    state.truckLane = newLane;
    state.truckX = LANE_WIDTH * (newLane + 0.5);
  }, []);

  const handleSlowDown = useCallback((isPressing: boolean) => {
    const state = gameStateRef.current;
    if (isPressing) {
      state.speed = Math.max(0.5, state.speed - 0.6);
    }
  }, []);

  const honk = useCallback(() => {
    const state = gameStateRef.current;
    let hit = false;

    state.fireflies.forEach((fly) => {
      const dist = Math.abs(fly.x - state.truckX);
      if (dist < 80 && !fly.happy) {
        fly.happy = true;
        hit = true;
      }
    });

    if (hit) {
      setScore((prev) => prev + 25);
      setGentleness((prev) => Math.min(100, prev + 8));
    }
  }, []);

  const restart = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    statusRef.current = "ready";
    setStatus("ready");
    draw();
  }, [draw]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== "playing") return;
      if (e.key === "ArrowLeft") changeLane(-1);
      if (e.key === "ArrowRight") changeLane(1);
      if (e.key === " ") {
        e.preventDefault();
        honk();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [changeLane, honk]);

  useEffect(
    () => () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    },
    [],
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>怪獸卡車的溫柔任務</h2>
        <div className={styles.stats}>
          <div>溫柔度：{Math.floor(gentleness)}%</div>
          <div>距離：{distance}%</div>
          <div>分數：{score}</div>
        </div>
      </div>

      <div className={styles.canvasWrap}>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className={styles.canvas}
          aria-label="怪獸卡車溫柔任務遊戲畫面"
        />

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
      </div>

      {status === "playing" && (
        <div className={styles.controls}>
          <div className={styles.controlRow}>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => changeLane(-1)}
            >
              ← 向左
            </button>
            <button
              type="button"
              className={styles.controlBtn}
              onClick={() => changeLane(1)}
            >
              向右 →
            </button>
          </div>

          <div className={styles.controlRow}>
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.slowBtn}`}
              onMouseDown={() => handleSlowDown(true)}
              onMouseUp={() => handleSlowDown(false)}
              onMouseLeave={() => handleSlowDown(false)}
              onTouchStart={() => handleSlowDown(true)}
              onTouchEnd={() => handleSlowDown(false)}
            >
              溫柔前進
            </button>
            <button
              type="button"
              className={`${styles.controlBtn} ${styles.honkBtn}`}
              onClick={honk}
            >
              輕輕喇叭
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
