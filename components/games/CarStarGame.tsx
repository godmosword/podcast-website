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

// ── 型別 ────────────────────────────────────────────────
type Dir = "up" | "down" | "left" | "right";
type GhostRole = "police" | "red";
type CarRole = GhostRole | "player";
type Status = "start" | "playing" | "won" | "lost";

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
const ANGLE: Record<Dir, number> = { up: 0, right: 90, down: 180, left: 270 };
const ALL_DIRS: readonly Dir[] = ["up", "down", "left", "right"];

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

// ── 俯視角自繪汽車 ──────────────────────────────────────
interface CarProps {
  role: CarRole;
  dir: Dir | null;
  scared?: boolean;
  reduced?: boolean;
}

function Car({ role, scared = false, dir, reduced = false }: CarProps) {
  const angle = ANGLE[dir ?? "up"];
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
    <div
      style={{
        width: "100%",
        height: "100%",
        transform: `rotate(${angle}deg)`,
        transition: reduced ? "none" : "transform .15s ease",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        style={{
          width: "100%",
          height: "100%",
          display: "block",
          filter: "drop-shadow(0 2px 1.5px rgba(0,0,0,.4))",
        }}
      >
        {/* 車輪 */}
        <rect x="17" y="24" width="9" height="18" rx="4" fill="#23262f" />
        <rect x="74" y="24" width="9" height="18" rx="4" fill="#23262f" />
        <rect x="17" y="58" width="9" height="18" rx="4" fill="#23262f" />
        <rect x="74" y="58" width="9" height="18" rx="4" fill="#23262f" />
        {/* 車身 */}
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
        {/* 前車燈 */}
        <rect x="29" y="14" width="13" height="7" rx="3" fill="#fff3b0" />
        <rect x="58" y="14" width="13" height="7" rx="3" fill="#fff3b0" />
        {/* 前擋風玻璃 */}
        <rect x="32" y="23" width="36" height="19" rx="8" fill={glass} opacity="0.92" />
        {/* 車頂 */}
        <rect x="34" y="44" width="32" height="14" rx="6" fill={roof} opacity="0.55" />
        {/* 後窗 */}
        <rect x="34" y="60" width="32" height="15" rx="7" fill={glass} opacity="0.7" />
        {/* 計程車頂燈 */}
        {role === "player" && (
          <rect x="41" y="46" width="18" height="9" rx="2" fill="#fff" stroke="#c79a00" strokeWidth="1.5" />
        )}
        {/* 警車警示燈 */}
        {role === "police" && !scared && (
          <g>
            <rect x="37" y="46" width="13" height="9" rx="2" fill="#ff4d4d" />
            <rect x="50" y="46" width="13" height="9" rx="2" fill="#4d7dff" />
          </g>
        )}
      </svg>
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
  const moveGhost = useCallback((gh: Ghost, scared: boolean, p: Player) => {
    let choices = ALL_DIRS.filter(
      (d) => canMove(gh.r, gh.c, d) && d !== OPP[gh.dir],
    );
    if (choices.length === 0) choices = ALL_DIRS.filter((d) => canMove(gh.r, gh.c, d));
    if (choices.length === 0) return;
    let best: Dir;
    if (Math.random() < 0.4) {
      best = choices[Math.floor(Math.random() * choices.length)];
    } else {
      const scored = choices.map((d) => {
        const dd = DIRS[d];
        const dist = Math.abs(gh.r + dd.dr - p.r) + Math.abs(gh.c + dd.dc - p.c);
        return { d, dist };
      });
      scored.sort((a, b) => (scared ? b.dist - a.dist : a.dist - b.dist));
      best = scored[0].d;
    }
    gh.dir = best;
    const d = DIRS[best];
    gh.r += d.dr;
    gh.c += d.dc;
  }, []);

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
    g.ghosts.forEach((gh) => moveGhost(gh, scared, p));

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
    game.current = freshState();
    setPopups([]);
    setStatus("playing");
    startLoop();
    rerender();
  }, [ensureAudio, startLoop, rerender]);

  const toggleSound = useCallback(() => {
    soundOn.current = !soundOn.current;
    setSoundUi(soundOn.current);
  }, []);

  const g = game.current;
  const now = Date.now();
  const scared = now < g.scaredUntil;
  const flashing = scared && g.scaredUntil - now < 1500;
  const font =
    "'Baloo 2','PingFang TC','Microsoft JhengHei','Comic Sans MS',sans-serif";

  // reduced 模式下棋盤加速狀態：保留靜態金框、移除發光與過場
  const boardShadow = scared
    ? reduced
      ? "inset 0 0 0 4px #ffd23f"
      : "inset 0 0 0 4px #ffd23f, 0 0 24px rgba(255,210,63,.7)"
    : "inset 0 0 0 4px #3f8f49";

  return (
    <div
      style={{
        fontFamily: font,
        background:
          "radial-gradient(120% 120% at 50% 0%, #bfe9ff 0%, #e6f6ff 42%, #fff4dc 100%)",
        padding: "20px 16px 26px",
        borderRadius: 26,
        maxWidth: 560,
        margin: "0 auto",
        boxShadow: "0 20px 44px rgba(40,90,160,.20)",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes carstar-coinBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-2.5px)} }
        @keyframes carstar-powerPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.18)} }
        @keyframes carstar-popUp { 0%{transform:translateY(0);opacity:0} 20%{opacity:1} 100%{transform:translateY(-26px);opacity:0} }
        @keyframes carstar-flashCar { 50%{opacity:.3} }
        @keyframes carstar-trophyPop { 0%{transform:scale(0)} 60%{transform:scale(1.25)} 100%{transform:scale(1)} }
        @keyframes carstar-confettiFall { 0%{transform:translateY(-12px) rotate(0);opacity:1} 100%{transform:translateY(380px) rotate(560deg);opacity:0} }
      `}</style>

      {/* HUD */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontSize: 25, fontWeight: 800, color: "#15428f", letterSpacing: 0.5 }}>
          🚕 車車吃星星
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Pill>⭐ {g.score}</Pill>
          {best != null && <Pill>最佳 ⭐ {best}</Pill>}
          <Pill>{"❤️".repeat(Math.max(0, g.lives)) || "—"}</Pill>
          <button
            type="button"
            onClick={toggleSound}
            aria-label={soundUi ? "關閉音效" : "開啟音效"}
            aria-pressed={soundUi}
            style={{ border: "none", background: "#fff", borderRadius: 13, width: 40, height: 40, fontSize: 18, cursor: "pointer", boxShadow: "0 3px 0 rgba(0,0,0,.12)" }}
          >
            {soundUi ? "🔊" : "🔇"}
          </button>
        </div>
      </div>

      {/* 棋盤 */}
      <div ref={wrapRef} style={{ width: "100%", display: "flex", justifyContent: "center" }}>
        <div style={{ width: BOARD_W * scale, height: BOARD_H * scale }}>
          <div
            style={{
              width: BOARD_W,
              height: BOARD_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              position: "relative",
              borderRadius: 18,
              overflow: "hidden",
              background: "#62c06e",
              backgroundImage:
                "linear-gradient(45deg, rgba(0,0,0,.05) 25%, transparent 25%, transparent 75%, rgba(0,0,0,.05) 75%)",
              backgroundSize: `${CELL}px ${CELL}px`,
              boxShadow: boardShadow,
              transition: reduced ? "none" : "box-shadow .3s",
            }}
          >
            {/* 道路 */}
            {grid.map((row, r) =>
              row.map((ch, c) =>
                ch !== "#" ? (
                  <div
                    key={`rd${r}-${c}`}
                    style={{
                      position: "absolute",
                      left: c * CELL,
                      top: r * CELL,
                      width: CELL,
                      height: CELL,
                      background: "#41464f",
                      boxShadow: "inset 0 0 0 1px rgba(255,255,255,.03)",
                    }}
                  />
                ) : null,
              ),
            )}

            {/* 金幣 */}
            {[...g.stars].map((k) => {
              const [r, c] = k.split(",").map(Number);
              return (
                <div
                  key={`s${k}`}
                  style={{
                    position: "absolute",
                    left: c * CELL + CELL / 2 - 5.5,
                    top: r * CELL + CELL / 2 - 5.5,
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background:
                      "radial-gradient(circle at 35% 30%, #fff6c0, #ffc107 62%, #e08a00)",
                    boxShadow: "0 0 6px rgba(255,193,7,.75)",
                    animation: reduced
                      ? "none"
                      : "carstar-coinBob 1.6s ease-in-out infinite",
                    animationDelay: reduced ? undefined : `${((r + c) % 5) * 0.12}s`,
                  }}
                />
              );
            })}

            {/* 加速道具 */}
            {[...g.powers].map((k) => {
              const [r, c] = k.split(",").map(Number);
              return (
                <div
                  key={`p${k}`}
                  style={{
                    position: "absolute",
                    left: c * CELL + CELL / 2 - 11,
                    top: r * CELL + CELL / 2 - 11,
                    width: 22,
                    height: 22,
                    background: "linear-gradient(180deg,#fff3a0,#ffb300)",
                    clipPath:
                      "polygon(50% 0,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)",
                    filter: "drop-shadow(0 0 6px rgba(255,180,0,.95))",
                    animation: reduced
                      ? "none"
                      : "carstar-powerPulse 1s ease-in-out infinite",
                  }}
                />
              );
            })}

            {/* 分數浮字 */}
            {popups.map((pp) => (
              <div
                key={pp.id}
                style={{
                  position: "absolute",
                  left: pp.c * CELL,
                  top: pp.r * CELL,
                  width: CELL,
                  textAlign: "center",
                  fontWeight: 800,
                  fontSize: 15,
                  color: pp.color || "#fff",
                  textShadow: "0 1px 3px rgba(0,0,0,.7)",
                  pointerEvents: "none",
                  animation: reduced ? "none" : "carstar-popUp .8s ease-out forwards",
                  opacity: reduced ? 1 : undefined,
                }}
              >
                {pp.text}
              </div>
            ))}

            {/* 玩家 */}
            <Sprite r={g.player.r} c={g.player.c} reduced={reduced}>
              <Car role="player" dir={g.player.dir} reduced={reduced} />
            </Sprite>

            {/* 追逐車 */}
            {g.ghosts.map((gh, i) => (
              <Sprite key={`g${i}`} r={gh.r} c={gh.c} flashing={flashing} reduced={reduced}>
                <Car role={gh.role} scared={scared} dir={gh.dir} reduced={reduced} />
              </Sprite>
            ))}

            {/* 遮罩 */}
            {status !== "playing" && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(16,22,40,.8)",
                  backdropFilter: "blur(2px)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  textAlign: "center",
                  gap: 12,
                  padding: 20,
                  overflow: "hidden",
                }}
              >
                {status === "won" &&
                  !reduced &&
                  Array.from({ length: 26 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: `${(i * 37) % 100}%`,
                        width: 8,
                        height: 12,
                        background: ["#ffd23f", "#ff6b6b", "#5bd0ff", "#7CFFB2", "#fff"][i % 5],
                        borderRadius: 2,
                        animation: `carstar-confettiFall ${1.4 + (i % 5) * 0.25}s linear ${(i % 7) * 0.12}s infinite`,
                      }}
                    />
                  ))}
                <div style={{ fontSize: 46, animation: reduced ? "none" : "carstar-trophyPop .5s ease-out" }}>
                  {status === "won" ? "🏆" : status === "lost" ? "💥" : "🚕💨"}
                </div>
                <div style={{ fontSize: 23, fontWeight: 800 }}>
                  {status === "won" ? "全部吃完啦！" : status === "lost" ? "被追到囉～" : "幫小計程車吃光金幣！"}
                </div>
                {status !== "start" && <div style={{ fontSize: 17 }}>得分 ⭐ {g.score}</div>}
                <button
                  type="button"
                  onClick={beginGame}
                  style={{
                    marginTop: 4,
                    border: "none",
                    background: "linear-gradient(180deg,#ffd23f,#ffa600)",
                    color: "#5a3500",
                    fontWeight: 800,
                    fontSize: 20,
                    padding: "12px 30px",
                    borderRadius: 16,
                    cursor: "pointer",
                    boxShadow: "0 5px 0 #c97f00",
                    fontFamily: font,
                  }}
                >
                  {status === "start" ? "開始玩 ▶" : "再玩一次 🔁"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 方向盤 */}
      <div style={{ display: "flex", justifyContent: "center", marginTop: 18 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 62px)", gridTemplateRows: "repeat(3, 62px)", gap: 8 }}>
          <span />
          <DPad label="向上開" dir="up" onDir={setDir}>⬆️</DPad>
          <span />
          <DPad label="向左開" dir="left" onDir={setDir}>⬅️</DPad>
          <span />
          <DPad label="向右開" dir="right" onDir={setDir}>➡️</DPad>
          <span />
          <DPad label="向下開" dir="down" onDir={setDir}>⬇️</DPad>
          <span />
        </div>
      </div>

      <p style={{ textAlign: "center", color: "#2f5489", fontSize: 14, marginTop: 12 }}>
        方向鍵 / WASD 或方向盤開車 · 吃 <b>⭐</b> 道具後可以把警車撞回家！
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
    position: "absolute",
    width: CELL,
    height: CELL,
    left: 0,
    top: 0,
    padding: 3,
    boxSizing: "border-box",
    transform: `translate(${c * CELL}px, ${r * CELL}px)`,
    transition: reduced ? "none" : `transform ${TICK}ms linear`,
    animation: flashing && !reduced ? "carstar-flashCar .3s steps(2) infinite" : "none",
  };
  return <div style={style}>{children}</div>;
}

interface PillProps {
  children: ReactNode;
}

function Pill({ children }: PillProps) {
  return (
    <span
      style={{
        background: "#fff",
        borderRadius: 13,
        padding: "7px 12px",
        fontWeight: 800,
        fontSize: 16,
        color: "#a05a00",
        boxShadow: "0 3px 0 rgba(0,0,0,.1)",
        minWidth: 36,
        textAlign: "center",
      }}
    >
      {children}
    </span>
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
      aria-label={label}
      onPointerDown={press}
      style={{
        border: "none",
        background: "#fff",
        borderRadius: 16,
        fontSize: 26,
        cursor: "pointer",
        boxShadow: "0 4px 0 rgba(0,0,0,.15)",
        touchAction: "none",
      }}
    >
      {children}
    </button>
  );
}
