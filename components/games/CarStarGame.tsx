"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import RoughFrame from "@/components/decor/RoughFrame";
import { CAR_STAR_CAST, CAR_STAR_TUTORIAL } from "@/lib/games/car-star-cast";
import styles from "./CarStarGame.module.css";

// ── 型別 ────────────────────────────────────────────────
type Dir = "up" | "down" | "left" | "right";
type GhostRole = "police" | "red";
type CarRole = GhostRole | "player";
type Status = "start" | "playing" | "won" | "lost";
type Difficulty = "easy" | "normal";

interface Player {
  r: number;
  c: number;
  dir: Dir | null;
  desired: Dir | null;
}
interface Ghost {
  r: number;
  c: number;
  dir: Dir;
  role: GhostRole;
}
interface Popup {
  id: number;
  r: number;
  c: number;
  text: string;
  color: string;
}
interface GameState {
  player: Player;
  ghosts: Ghost[];
  stars: Set<string>;
  powers: Set<string>;
  score: number;
  lives: number;
  status: Status;
  scaredUntil: number;
  tick: number;
}

// webkit 舊版前綴
type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// ── 迷宮地圖 ─────────────────────────────────────────────
// #=牆  .=金幣  o=加速道具  P=玩家起點  G=追逐車起點
const MAZE = [
  "###############",
  "#o...........o#",
  "#.##.##.##.##.#",
  "#.##.##.##.##.#",
  "#.............#",
  "#.##.##.##.##.#",
  "#.##.##G##.##.#",
  "#.##.##.##.##.#",
  "#.............#",
  "#.##.##.##.##.#",
  "#.##.##P##.##.#",
  "#o...........o#",
  "###############",
] as const;

const ROWS = MAZE.length;
const COLS = MAZE[0].length;
const CELL = 34;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const TICK = 260; // ms，數字越大車子越慢（給 3–7 歲）
const GHOST_MOVE_EVERY: Record<Difficulty, number> = { easy: 2, normal: 1 };

const DIRS: Record<Dir, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};
const OPP: Record<Dir, Dir> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};
const ALL_DIRS: readonly Dir[] = ["up", "down", "left", "right"];

// ── 車輛美術設定（素材：public/games/cars/）────────────────
const CAR_ORIENTATION: "topdown" | "sideview" = "topdown";
const CAR_SCARED_MODE: "tint" | "variant" = "tint";

const CAR_ART: Record<CarRole, { src: string; scaredSrc?: string }> = {
  player: { src: CAR_STAR_CAST.player.art },
  police: { src: CAR_STAR_CAST.police.art },
  red: { src: CAR_STAR_CAST.red.art },
};

function carTransform(dir: Dir | null, orientation: "topdown" | "sideview"): string {
  if (orientation === "topdown") {
    const angle = { up: 0, right: 90, down: 180, left: 270 }[dir ?? "up"];
    return `rotate(${angle}deg)`;
  }
  return dir === "left" ? "scaleX(-1)" : "none";
}

// 解析地圖
const grid: string[][] = MAZE.map((r) => r.split(""));
const initStars = new Set<string>();
const initPowers = new Set<string>();
let playerStart = { r: 10, c: 7 };
let ghostStart = { r: 6, c: 7 };
grid.forEach((row, r) =>
  row.forEach((ch, c) => {
    if (ch === ".") initStars.add(`${r},${c}`);
    else if (ch === "o") initPowers.add(`${r},${c}`);
    else if (ch === "P") playerStart = { r, c };
    else if (ch === "G") ghostStart = { r, c };
  }),
);

function canMove(r: number, c: number, dir: Dir): boolean {
  const d = DIRS[dir];
  const nr = r + d.dr;
  const nc = c + d.dc;
  if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return false;
  return grid[nr][nc] !== "#";
}

function freshState(): GameState {
  return {
    player: { ...playerStart, dir: null, desired: null },
    ghosts: [
      { r: ghostStart.r, c: ghostStart.c, dir: "up", role: "police" },
      { r: ghostStart.r, c: ghostStart.c, dir: "down", role: "red" },
    ],
    stars: new Set(initStars),
    powers: new Set(initPowers),
    score: 0,
    lives: 3,
    status: "playing",
    scaredUntil: 0,
    tick: 0,
  };
}

// ── 車輛算繪（素材圖 + 內建 SVG fallback）────────────────────
interface CarProps {
  role: CarRole;
  dir: Dir | null;
  scared?: boolean;
  reduced?: boolean;
}

function CarFallbackSvg({ role, scared = false }: { role: CarRole; scared?: boolean }) {
  let body = "#ff6b6b";
  const glass = "#bfe8ff";
  let roof = "#d64545";
  if (role === "player") {
    body = "#ffd23f";
    roof = "#e0a800";
  } else if (scared) {
    body = "#8fd0ff";
    roof = "#4d90d6";
  } else if (role === "police") {
    body = "#f4f6fb";
    roof = "#c7cedd";
  }
  return (
    <svg
      viewBox="0 0 100 100"
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        filter: "drop-shadow(0 2px 1.5px rgba(0,0,0,.4))",
      }}
    >
      <rect x="17" y="24" width="9" height="18" rx="4" fill="#23262f" />
      <rect x="74" y="24" width="9" height="18" rx="4" fill="#23262f" />
      <rect x="17" y="58" width="9" height="18" rx="4" fill="#23262f" />
      <rect x="74" y="58" width="9" height="18" rx="4" fill="#23262f" />
      <rect
        x="25"
        y="13"
        width="50"
        height="74"
        rx="17"
        fill={body}
        stroke="rgba(0,0,0,.22)"
        strokeWidth="2"
      />
      <rect x="29" y="14" width="13" height="7" rx="3" fill="#fff3b0" />
      <rect x="58" y="14" width="13" height="7" rx="3" fill="#fff3b0" />
      <rect x="32" y="23" width="36" height="19" rx="8" fill={glass} opacity="0.92" />
      <rect x="34" y="44" width="32" height="14" rx="6" fill={roof} opacity="0.55" />
      <rect x="34" y="60" width="32" height="15" rx="7" fill={glass} opacity="0.7" />
      {role === "player" && (
        <rect x="41" y="46" width="18" height="9" rx="2" fill="#fff" stroke="#c79a00" strokeWidth="1.5" />
      )}
      {role === "police" && !scared && (
        <g>
          <rect x="37" y="46" width="13" height="9" rx="2" fill="#ff4d4d" />
          <rect x="50" y="46" width="13" height="9" rx="2" fill="#4d7dff" />
        </g>
      )}
    </svg>
  );
}

function Car({ role, scared = false, dir, reduced = false }: CarProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const art = CAR_ART[role];
  const useVariantScared =
    scared && CAR_SCARED_MODE === "variant" && Boolean(art.scaredSrc);
  const imgSrc = useVariantScared ? art.scaredSrc! : art.src;
  const showImg = Boolean(imgSrc) && !imgFailed;

  const scaredFilter =
    scared && !useVariantScared
      ? "saturate(.55) hue-rotate(175deg) brightness(1.2) drop-shadow(0 0 4px #6cf)"
      : "drop-shadow(0 2px 1.5px rgba(0,0,0,.4))";

  const shellStyle: CSSProperties = {
    width: "100%",
    height: "100%",
    transform: carTransform(dir, CAR_ORIENTATION),
    transition: reduced ? "none" : "transform .15s ease",
  };

  if (showImg) {
    return (
      <div style={shellStyle}>
        <img
          src={imgSrc}
          alt=""
          aria-hidden="true"
          draggable={false}
          onError={() => setImgFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: scaredFilter,
            pointerEvents: "none",
          }}
        />
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <CarFallbackSvg role={role} scared={scared} />
    </div>
  );
}

export default function CarStarGame() {
  const reduced = useReducedMotion();

  const game = useRef<GameState>(freshState());
  const actx = useRef<AudioContext | null>(null);
  const soundOn = useRef<boolean>(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const popupId = useRef<number>(0);

  const [, force] = useState(0);
  const [status, setStatus] = useState<Status>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const difficultyRef = useRef<Difficulty>("easy");
  const [soundUi, setSoundUi] = useState(true);
  const [scale, setScale] = useState(1);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [best, setBest] = useState<number | null>(null);

  const rerender = useCallback(() => force((n) => n + 1), []);
  const addPopup = useCallback(
    (r: number, c: number, text: string, color: string) => {
      const id = popupId.current++;
      setPopups((ps) => [...ps, { id, r, c, text, color }]);
      setTimeout(() => setPopups((ps) => ps.filter((p) => p.id !== id)), 800);
    },
    [],
  );

  // 最佳分數（localStorage，掛載後才讀）
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem("car-star-best");
      if (raw != null) {
        const n = Number(raw);
        if (Number.isFinite(n)) setBest(n);
      }
    } catch {
      // localStorage 不可用時略過
    }
  }, []);

  const saveBest = useCallback((score: number) => {
    setBest((prev) => {
      if (prev != null && score <= prev) return prev;
      try {
        window.localStorage.setItem("car-star-best", String(score));
      } catch {
        // 略過
      }
      return score;
    });
  }, []);

  // 響應式縮放
  useEffect(() => {
    const onResize = () => {
      const w = wrapRef.current ? wrapRef.current.clientWidth : BOARD_W;
      setScale(Math.min(1, w / BOARD_W));
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── 音效 ───────────────────────────────────────────
  const ensureAudio = useCallback(() => {
    if (!actx.current) {
      try {
        const Ctor =
          window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
        if (Ctor) actx.current = new Ctor();
      } catch {
        // 無音訊環境時略過
      }
    }
    if (actx.current && actx.current.state === "suspended") {
      void actx.current.resume();
    }
  }, []);

  const tone = useCallback(
    (freq: number, dur: number, type: OscillatorType = "square", vol = 0.05) => {
      const ctx = actx.current;
      if (!soundOn.current || !ctx) return;
      try {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = type;
        o.frequency.value = freq;
        g.gain.value = vol;
        o.connect(g);
        g.connect(ctx.destination);
        o.start();
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
        o.stop(ctx.currentTime + dur);
      } catch {
        // 略過
      }
    },
    [],
  );

  const sBlip = useCallback(() => tone(740, 0.06, "square", 0.035), [tone]);
  const sPower = useCallback(() => tone(300, 0.25, "triangle", 0.06), [tone]);
  const sHonk = useCallback(() => tone(180, 0.18, "sawtooth", 0.06), [tone]);
  const sCrash = useCallback(() => tone(110, 0.35, "sawtooth", 0.07), [tone]);
  const sWin = useCallback(() => {
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone(f, 0.18, "triangle", 0.06), i * 140),
    );
  }, [tone]);

  // ── 追逐車 AI ──────────────────────────────────────
  const moveGhost = useCallback(
    (gh: Ghost, scared: boolean, p: Player, mode: Difficulty) => {
      let choices = ALL_DIRS.filter(
        (d) => canMove(gh.r, gh.c, d) && d !== OPP[gh.dir],
      );
      if (choices.length === 0) {
        choices = ALL_DIRS.filter((d) => canMove(gh.r, gh.c, d));
      }
      if (choices.length === 0) return;
      let best: Dir;
      // 簡單模式較常亂走；普通模式較積極追逐（原邏輯約 60% 追逐）
      const randomChance = mode === "easy" ? 0.68 : 0.4;
      if (Math.random() < randomChance) {
        best = choices[Math.floor(Math.random() * choices.length)];
      } else {
        const scored = choices.map((d) => {
          const dd = DIRS[d];
          const dist =
            Math.abs(gh.r + dd.dr - p.r) + Math.abs(gh.c + dd.dc - p.c);
          return { d, dist };
        });
        scored.sort((a, b) => (scared ? b.dist - a.dist : a.dist - b.dist));
        best = scored[0].d;
      }
      gh.dir = best;
      const d = DIRS[best];
      gh.r += d.dr;
      gh.c += d.dc;
    },
    [],
  );

  const resetPositions = useCallback((g: GameState) => {
    g.player = { ...playerStart, dir: null, desired: null };
    g.ghosts = [
      { r: ghostStart.r, c: ghostStart.c, dir: "up", role: "police" },
      { r: ghostStart.r, c: ghostStart.c, dir: "down", role: "red" },
    ];
    g.scaredUntil = 0;
  }, []);

  // ── 主迴圈 ─────────────────────────────────────────
  const step = useCallback(() => {
    const g = game.current;
    if (g.status !== "playing") return;
    g.tick++;
    const p = g.player;

    if (p.desired && canMove(p.r, p.c, p.desired)) p.dir = p.desired;
    if (p.dir && canMove(p.r, p.c, p.dir)) {
      const d = DIRS[p.dir];
      p.r += d.dr;
      p.c += d.dc;
    }

    const key = `${p.r},${p.c}`;
    if (g.stars.has(key)) {
      g.stars.delete(key);
      g.score += 10;
      sBlip();
    }
    if (g.powers.has(key)) {
      g.powers.delete(key);
      g.score += 50;
      g.scaredUntil = Date.now() + 6000;
      sPower();
      addPopup(p.r, p.c, "+50", "#ffd23f");
    }

    const scared = Date.now() < g.scaredUntil;
    const mode = difficultyRef.current;
    const ghostEvery = GHOST_MOVE_EVERY[mode];
    if (g.tick % ghostEvery === 0) {
      g.ghosts.forEach((gh) => moveGhost(gh, scared, p, mode));
    }

    let lostLife = false;
    for (const gh of g.ghosts) {
      if (gh.r === p.r && gh.c === p.c) {
        if (scared) {
          addPopup(gh.r, gh.c, "+200", "#7CFFB2");
          gh.r = ghostStart.r;
          gh.c = ghostStart.c;
          g.score += 200;
          sHonk();
        } else {
          lostLife = true;
        }
      }
    }
    if (lostLife) {
      g.lives -= 1;
      sCrash();
      addPopup(p.r, p.c, "💥", "#fff");
      if (g.lives <= 0) {
        g.status = "lost";
        setStatus("lost");
        saveBest(g.score);
      } else {
        resetPositions(g);
      }
    }

    if (g.stars.size === 0 && g.powers.size === 0 && g.status === "playing") {
      g.status = "won";
      setStatus("won");
      saveBest(g.score);
      sWin();
    }
    rerender();
  }, [rerender, addPopup, moveGhost, resetPositions, saveBest, sBlip, sPower, sHonk, sCrash, sWin]);

  const startLoop = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(step, TICK);
  }, [step]);

  // 卸載時清除迴圈
  useEffect(
    () => () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    },
    [],
  );

  // 分頁切走時暫停，切回且仍在遊戲中時重啟迴圈
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else if (game.current.status === "playing") {
        startLoop();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [startLoop]);

  // ── 鍵盤 ───────────────────────────────────────────
  useEffect(() => {
    const map: Record<string, Dir> = {
      ArrowUp: "up",
      ArrowDown: "down",
      ArrowLeft: "left",
      ArrowRight: "right",
      w: "up",
      s: "down",
      a: "left",
      d: "right",
    };
    const onKey = (e: KeyboardEvent) => {
      const dir = map[e.key];
      if (!dir) return;
      e.preventDefault();
      game.current.player.desired = dir;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const setDir = useCallback((dir: Dir) => {
    game.current.player.desired = dir;
  }, []);

  const beginGame = useCallback(() => {
    ensureAudio();
    difficultyRef.current = difficulty;
    game.current = freshState();
    setPopups([]);
    setStatus("playing");
    startLoop();
    rerender();
  }, [ensureAudio, startLoop, rerender, difficulty]);

  const toggleSound = useCallback(() => {
    soundOn.current = !soundOn.current;
    setSoundUi(soundOn.current);
  }, []);

  const g = game.current;
  const now = Date.now();
  const scared = now < g.scaredUntil;
  const flashing = scared && g.scaredUntil - now < 1500;
  const showPlayHint =
    status === "playing" && g.score === 0 && g.stars.size > 0;
  const boardClass = scared
    ? reduced
      ? styles.boardScaredReduced
      : styles.boardScared
    : styles.boardNormal;

  return (
    <div className={styles.shell}>
      <RoughFrame color={CAR_STAR_CAST.player.color} rough={1} width={3} />

      <header className={styles.header}>
        <div className={styles.titleBlock}>
          <h1 className={styles.title}>
            {CAR_STAR_CAST.player.emoji} 車車吃星星
          </h1>
          <p className={styles.subtitle}>和故事裡的車車朋友一起玩迷宮</p>
        </div>
        <div className={styles.hud}>
          <Pill>⭐ {g.score}</Pill>
          {best != null && <Pill>最佳 ⭐ {best}</Pill>}
          <Pill>{"❤️".repeat(Math.max(0, g.lives)) || "—"}</Pill>
          <button
            type="button"
            onClick={toggleSound}
            className={styles.soundBtn}
            aria-label={soundUi ? "關閉音效" : "開啟音效"}
            aria-pressed={soundUi}
          >
            {soundUi ? "🔊" : "🔇"}
          </button>
        </div>
      </header>

      <CastBar />

      {showPlayHint && (
        <div
          className={`${styles.playHint} ${reduced ? styles.playHintStatic : ""}`}
          role="status"
        >
          <span aria-hidden="true">👉</span>
          先開車去吃路上的金色星星！
        </div>
      )}

      <div ref={wrapRef} className={styles.boardWrap}>
        <div
          className={styles.boardScaler}
          style={{ width: BOARD_W * scale, height: BOARD_H * scale }}
        >
          <div
            className={`${styles.board} ${boardClass}`}
            style={{
              width: BOARD_W,
              height: BOARD_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              transition: reduced ? "none" : "box-shadow .3s",
            }}
          >
            {grid.map((row, r) =>
              row.map((ch, c) =>
                ch !== "#" ? (
                  <div
                    key={`rd${r}-${c}`}
                    className={styles.roadCell}
                    style={{ left: c * CELL, top: r * CELL, width: CELL, height: CELL }}
                  >
                    <span className={styles.roadMark} aria-hidden="true" />
                  </div>
                ) : null,
              ),
            )}

            {[...g.stars].map((k) => {
              const [r, c] = k.split(",").map(Number);
              return (
                <span
                  key={`s${k}`}
                  className={`${styles.starCoin} ${reduced ? styles.starCoinReduced : ""}`}
                  style={{
                    left: c * CELL + CELL / 2,
                    top: r * CELL + CELL / 2,
                    animationDelay: reduced ? undefined : `${((r + c) % 5) * 0.12}s`,
                  }}
                  aria-hidden="true"
                >
                  ⭐
                </span>
              );
            })}

            {[...g.powers].map((k) => {
              const [r, c] = k.split(",").map(Number);
              return (
                <span
                  key={`p${k}`}
                  className={`${styles.powerStar} ${reduced ? styles.powerStarReduced : ""}`}
                  style={{ left: c * CELL + CELL / 2, top: r * CELL + CELL / 2 }}
                  aria-hidden="true"
                  title="加速星星"
                >
                  🌟
                </span>
              );
            })}

            {popups.map((pp) => (
              <div
                key={pp.id}
                className={`${styles.popup} ${reduced ? "" : styles.popupAnimated}`}
                style={{
                  left: pp.c * CELL,
                  top: pp.r * CELL,
                  width: CELL,
                  color: pp.color || "#fff",
                  opacity: reduced ? 1 : undefined,
                }}
              >
                {pp.text}
              </div>
            ))}

            <Sprite r={g.player.r} c={g.player.c} reduced={reduced}>
              <Car role="player" dir={g.player.dir} reduced={reduced} />
            </Sprite>

            {g.ghosts.map((gh, i) => (
              <Sprite key={`g${i}`} r={gh.r} c={gh.c} flashing={flashing} reduced={reduced}>
                <Car role={gh.role} scared={scared} dir={gh.dir} reduced={reduced} />
              </Sprite>
            ))}

            {status !== "playing" && (
              <div className={styles.overlay}>
                {status === "won" &&
                  !reduced &&
                  Array.from({ length: 26 }).map((_, i) => (
                    <span
                      key={i}
                      className={styles.confetti}
                      style={{
                        left: `${(i * 37) % 100}%`,
                        background: ["#ffd23f", "#ff6b6b", "#5bd0ff", "#7CFFB2", "#fff"][i % 5],
                        animationDuration: `${1.4 + (i % 5) * 0.25}s`,
                        animationDelay: `${(i % 7) * 0.12}s`,
                      }}
                    />
                  ))}
                <div
                  className={`${styles.overlayIcon} ${!reduced && status !== "lost" ? styles.overlayIconPop : ""}`}
                >
                  {status === "won" ? "🏆" : status === "lost" ? "💥" : `${CAR_STAR_CAST.player.emoji}💨`}
                </div>
                <p className={styles.overlayTitle}>
                  {status === "won"
                    ? "全部吃完啦！"
                    : status === "lost"
                      ? "被追到囉～"
                      : `幫${CAR_STAR_CAST.player.name}吃光星星！`}
                </p>
                {status === "start" && (
                  <div className={styles.tutorial}>
                    {CAR_STAR_TUTORIAL.map((step) => (
                      <div key={step.text} className={styles.tutorialStep}>
                        <span className={styles.tutorialIcon} aria-hidden="true">
                          {step.icon}
                        </span>
                        <span>{step.text}</span>
                      </div>
                    ))}
                  </div>
                )}
                {status !== "start" && (
                  <p className={styles.overlayScore}>得分 ⭐ {g.score}</p>
                )}
                {status === "start" && (
                  <div className={styles.difficultyPicker}>
                    <div className={styles.difficultyLabel}>選擇難度</div>
                    <div className={styles.difficultyRow}>
                      <button
                        type="button"
                        className={`${styles.difficultyBtn} ${
                          difficulty === "easy" ? styles.difficultyBtnEasyActive : ""
                        }`}
                        onClick={() => setDifficulty("easy")}
                      >
                        🌟 簡單模式（推薦）
                      </button>
                      <button
                        type="button"
                        className={`${styles.difficultyBtn} ${
                          difficulty === "normal" ? styles.difficultyBtnNormalActive : ""
                        }`}
                        onClick={() => setDifficulty("normal")}
                      >
                        普通模式
                      </button>
                    </div>
                    <p className={styles.difficultyHint}>
                      {difficulty === "easy"
                        ? "敵人比較慢，適合小朋友自己玩"
                        : "經典挑戰模式"}
                    </p>
                  </div>
                )}
                <button type="button" onClick={beginGame} className={styles.primaryBtn}>
                  {status === "start" ? "開始玩 ▶" : "再玩一次 🔁"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.dpadWrap}>
        <div className={styles.dpadGrid}>
          <span />
          <DPad label="向上開" dir="up" onDir={setDir}>
            ⬆️
          </DPad>
          <span />
          <DPad label="向左開" dir="left" onDir={setDir}>
            ⬅️
          </DPad>
          <span />
          <DPad label="向右開" dir="right" onDir={setDir}>
            ➡️
          </DPad>
          <span />
          <DPad label="向下開" dir="down" onDir={setDir}>
            ⬇️
          </DPad>
          <span />
        </div>
      </div>

      <ul className={styles.legend}>
        <li>
          <span aria-hidden="true">⭐</span> 小星星＝得分
        </li>
        <li>
          <span aria-hidden="true">🌟</span> 大星星＝可以撞追逐車
        </li>
        <li>
          <span aria-hidden="true">❤️</span> 愛心＝還有幾次機會
        </li>
      </ul>

      <p className={styles.footerTip}>
        方向鍵 / WASD 或方向盤開車 · 吃{" "}
        <strong>🌟</strong> 後可以把{CAR_STAR_CAST.police.shortName}和
        {CAR_STAR_CAST.red.shortName}撞回家！
      </p>
    </div>
  );
}

interface SpriteProps {
  r: number;
  c: number;
  flashing?: boolean;
  reduced?: boolean;
  children: ReactNode;
}

function Sprite({ r, c, flashing = false, reduced = false, children }: SpriteProps) {
  const style: CSSProperties = {
    width: CELL,
    height: CELL,
    left: 0,
    top: 0,
    transform: `translate(${c * CELL}px, ${r * CELL}px)`,
    transition: reduced ? "none" : `transform ${TICK}ms linear`,
  };
  return (
    <div
      className={`${styles.sprite} ${flashing && !reduced ? styles.spriteFlash : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface PillProps {
  children: ReactNode;
}

function Pill({ children }: PillProps) {
  return <span className={styles.pill}>{children}</span>;
}

function CastBar() {
  const entries = [
    { key: "player", tag: "你" },
    { key: "police", tag: "追" },
    { key: "red", tag: "追" },
  ] as const;

  return (
    <div className={styles.cast} aria-label="故事裡的車車朋友">
      {entries.map(({ key, tag }) => {
        const cast = CAR_STAR_CAST[key];
        return (
          <span
            key={key}
            className={`${styles.castChip} ${key === "player" ? styles.castChipPlayer : ""}`}
            style={{ "--chip-color": cast.color } as CSSProperties}
          >
            <span className={styles.castEmoji} aria-hidden="true">
              {cast.emoji}
            </span>
            <span className={styles.castLabel}>
              {tag === "你" ? `你：${cast.shortName}` : cast.shortName}
            </span>
          </span>
        );
      })}
    </div>
  );
}

interface DPadProps {
  dir: Dir;
  label: string;
  children: ReactNode;
  onDir: (dir: Dir) => void;
}

function DPad({ dir, label, children, onDir }: DPadProps) {
  const press = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    onDir(dir);
  };
  return (
    <button
      type="button"
      className={styles.dpadBtn}
      aria-label={label}
      onPointerDown={press}
    >
      {children}
    </button>
  );
}
