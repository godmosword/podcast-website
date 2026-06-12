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
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useDomJuice } from "@/hooks/useDomJuice";
import {
  GridTouchButton,
  touchControlStyles,
  useBestScore,
  useGameAudio,
  useGameLoop,
  useTouchControls,
  useVisibilityPause,
} from "@/lib/game-kit";
import GamePixelBoard from "@/components/games/GamePixelBoard";
import { blockDropKitColors } from "@/lib/gamekit/bridge";
import { BLOCK_INDEX, blockUrl } from "@/lib/gamekit/procedural-sheets";
import { reportGameSession } from "@/lib/gamekit/session";
import GameChrome, { GameChromeToolbar } from "@/components/games/GameChrome";
import { GameResultActions } from "@/components/games/GameResultActions";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";

const COLS = 10;
const ROWS = 20;
const CELL = 18;
const BOARD_W = COLS * CELL;
const BOARD_H = ROWS * CELL;
const SIDE_W = 96;
const LAYOUT_W = BOARD_W + 14 + SIDE_W;
const LOCK_DELAY = 450;
const DAS_DELAY = 170;
const DAS_REPEAT = 50;
type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";
type Cell = PieceType | null;
type Status = "ready" | "playing" | "paused" | "over";

interface Piece {
  type: PieceType;
  rot: number;
  x: number;
  y: number;
}

interface GameState {
  board: Cell[][];
  active: Piece | null;
  bag: PieceType[];
  hold: PieceType | null;
  canHold: boolean;
  score: number;
  level: number;
  lines: number;
  status: Status;
  grounded: boolean;
  lockTimer: number;
  resets: number;
  dropAcc: number;
  softDrop: boolean;
  clearing: boolean;
  clearRows: number[];
  clearUntil: number;
  lastTime: number | null;
  dirty: boolean;
  metaReported: boolean;
}

const TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];
const LINE_SCORE = [0, 100, 300, 500, 800];
const KIT_BLOCK = blockDropKitColors();
const COLORS: Record<PieceType, string> = {
  I: KIT_BLOCK.I,
  O: KIT_BLOCK.O,
  T: KIT_BLOCK.T,
  S: KIT_BLOCK.S,
  Z: KIT_BLOCK.Z,
  J: KIT_BLOCK.J,
  L: KIT_BLOCK.L,
};
const SHAPES: Record<PieceType, [number, number][][]> = {
  I: [
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [3, 1],
    ],
    [
      [2, 0],
      [2, 1],
      [2, 2],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 2],
      [2, 2],
      [3, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [1, 3],
    ],
  ],
  O: [
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [2, 1],
    ],
  ],
  T: [
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  S: [
    [
      [1, 0],
      [2, 0],
      [0, 1],
      [1, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 1],
      [2, 1],
      [0, 2],
      [1, 2],
    ],
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [1, 2],
    ],
  ],
  Z: [
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [2, 1],
    ],
    [
      [2, 0],
      [1, 1],
      [2, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ],
  ],
  J: [
    [
      [0, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [2, 0],
      [1, 1],
      [1, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [2, 2],
    ],
    [
      [1, 0],
      [1, 1],
      [0, 2],
      [1, 2],
    ],
  ],
  L: [
    [
      [2, 0],
      [0, 1],
      [1, 1],
      [2, 1],
    ],
    [
      [1, 0],
      [1, 1],
      [1, 2],
      [2, 2],
    ],
    [
      [0, 1],
      [1, 1],
      [2, 1],
      [0, 2],
    ],
    [
      [0, 0],
      [1, 0],
      [1, 1],
      [1, 2],
    ],
  ],
};
const KICKS: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [0, -1],
  [-1, -1],
  [1, -1],
  [-2, 0],
  [2, 0],
];

const emptyBoard = (): Cell[][] =>
  Array.from({ length: ROWS }, () => Array<Cell>(COLS).fill(null));

function freshGame(): GameState {
  return {
    board: emptyBoard(),
    active: null,
    bag: [],
    hold: null,
    canHold: true,
    score: 0,
    level: 1,
    lines: 0,
    status: "ready",
    grounded: false,
    lockTimer: 0,
    resets: 0,
    dropAcc: 0,
    softDrop: false,
    clearing: false,
    clearRows: [],
    clearUntil: 0,
    lastTime: null,
    dirty: true,
    metaReported: false,
  };
}

function valid(p: Piece, board: Cell[][]): boolean {
  for (const [c, r] of SHAPES[p.type][p.rot]) {
    const x = p.x + c;
    const y = p.y + r;
    if (x < 0 || x >= COLS || y >= ROWS) return false;
    if (y >= 0 && board[y][x]) return false;
  }
  return true;
}

function merge(p: Piece, board: Cell[][]): Cell[][] {
  const nb = board.map((row) => row.slice());
  for (const [c, r] of SHAPES[p.type][p.rot]) {
    const x = p.x + c;
    const y = p.y + r;
    if (y >= 0) nb[y][x] = p.type;
  }
  return nb;
}

const gravityMs = (level: number) => Math.max(70, 800 - (level - 1) * 70);

const iconBtn: CSSProperties = {
  border: "none",
  background: "rgba(255,255,255,.1)",
  color: "#fff",
  borderRadius: 11,
  width: 38,
  height: 38,
  fontSize: 16,
  cursor: "pointer",
};

function primaryBtn(font: string): CSSProperties {
  return {
    border: "none",
    background: "linear-gradient(180deg,#ffd23f,#ffa600)",
    color: "#4a2c00",
    fontWeight: 800,
    fontSize: 18,
    padding: "11px 26px",
    borderRadius: 14,
    cursor: "pointer",
    boxShadow: "0 5px 0 #b97600",
    fontFamily: font,
  };
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        flex: "1 1 70px",
        background: "rgba(255,255,255,.06)",
        borderRadius: 12,
        padding: "8px 6px",
        textAlign: "center",
      }}
    >
      <div style={{ color: "#8b9bbd", fontSize: 11, fontWeight: 700 }}>{label}</div>
      <div style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function MiniBox({ type, label }: { type: PieceType | null; label: string }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,.07)",
        borderRadius: 12,
        padding: 8,
        textAlign: "center",
      }}
    >
      <div
        style={{
          color: "#9fb0d0",
          fontSize: 12,
          fontWeight: 800,
          marginBottom: 5,
        }}
      >
        {label}
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 15px)",
          gridTemplateRows: "repeat(2, 15px)",
          gap: 2,
          justifyContent: "center",
        }}
      >
        {Array.from({ length: 8 }).map((_, i) => {
          const c = i % 4;
          const r = Math.floor(i / 4);
          const on =
            type && SHAPES[type][0].some(([cc, rr]) => cc === c && rr === r);
          return (
            <div
              key={i}
              style={
                on
                  ? {
                      width: "100%",
                      height: "100%",
                      background: COLORS[type as PieceType],
                      borderRadius: 5,
                      boxShadow:
                        "inset 2px 2px 0 rgba(255,255,255,.4), inset -2px -2px 0 rgba(0,0,0,.28)",
                    }
                  : { background: "transparent" }
              }
            />
          );
        })}
      </div>
    </div>
  );
}

export default function BlockDropGame() {
  const G = useRef<GameState>(freshGame());
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dasRef = useRef({ dir: 0, nextAt: 0 });
  const touchSoftDropRef = useRef(false);
  const reduced = useReducedMotion();
  const { useKeyboardInput } = useTouchControls();
  const { best, saveBest } = useBestScore("block-drop");
  const isCoarse = useCoarsePointer();
  const { kidsMode } = useGameKitSettings();
  const kidsModeRef = useRef(kidsMode);
  kidsModeRef.current = kidsMode;
  const { juice, boardTransform } = useDomJuice(reduced);

  const [, force] = useState(0);
  const [announce, setAnnounce] = useState("");
  const {
    ensureAudio,
    tone,
    soundUi,
    toggleSound,
    playBgm,
    stopBgm,
    pauseBgm,
    resumeBgm,
  } = useGameAudio("block-drop");

  const repaint = useCallback(() => force((n) => n + 1), []);

  const [blockTileUrls, setBlockTileUrls] = useState<Record<PieceType, string> | null>(
    null,
  );

  useEffect(() => {
    setBlockTileUrls(
      Object.fromEntries(
        TYPES.map((t) => [t, blockUrl(BLOCK_INDEX[t])]),
      ) as Record<PieceType, string>,
    );
  }, []);

  const sMove = () => tone(220, 0.03, "square", 0.025);
  const sRotate = () => tone(420, 0.04, "square", 0.03);
  const sLock = () => tone(160, 0.06, "triangle", 0.04);
  const sLine = (n: number) =>
    [523, 659, 784, 1046]
      .slice(0, Math.max(2, n))
      .forEach((f, i) => setTimeout(() => tone(f, 0.12, "triangle", 0.06), i * 70));
  const sLevel = () =>
    [523, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone(f, 0.14, "triangle", 0.06), i * 100),
    );
  const sOver = () =>
    [440, 330, 220].forEach((f, i) =>
      setTimeout(() => tone(f, 0.22, "sawtooth", 0.06), i * 160),
    );

  const refill = (g: GameState) => {
    if (g.bag.length <= 7) {
      const b = [...TYPES];
      for (let i = b.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [b[i], b[j]] = [b[j], b[i]];
      }
      g.bag.push(...b);
    }
  };

  const updateGrounded = (g: GameState) => {
    if (g.active) {
      g.grounded = !valid({ ...g.active, y: g.active.y + 1 }, g.board);
    }
  };

  const resetLock = (g: GameState) => {
    if (g.grounded && g.resets < 15) {
      g.lockTimer = 0;
      g.resets++;
    }
  };

  const forgiveStack = (g: GameState) => {
    for (let y = 0; y < 4; y++) g.board[y] = Array<Cell>(COLS).fill(null);
    if (g.active) {
      g.active.y = 0;
      g.active.x = 3;
    }
    g.status = "playing";
    g.metaReported = false;
    playBgm();
    g.dirty = true;
    setAnnounce("方塊太多了，幫你清掉一些，繼續玩！");
  };

  const spawnNext = (g: GameState) => {
    refill(g);
    const type = g.bag.shift()!;
    g.active = { type, rot: 0, x: 3, y: 0 };
    g.canHold = true;
    g.grounded = false;
    g.lockTimer = 0;
    g.resets = 0;
    if (!valid(g.active, g.board)) {
      if (kidsModeRef.current) forgiveStack(g);
      else {
        g.status = "over";
        setAnnounce(`遊戲結束，得分 ${g.score}`);
        sOver();
        stopBgm();
      }
    } else {
      updateGrounded(g);
    }
  };

  const finishClear = (g: GameState) => {
    const set = new Set(g.clearRows);
    const nb = g.board.filter((_, y) => !set.has(y));
    while (nb.length < ROWS) nb.unshift(Array<Cell>(COLS).fill(null));
    g.board = nb;
    const n = g.clearRows.length;
    g.lines += n;
    g.score += LINE_SCORE[n] * g.level;
    const lv = Math.floor(g.lines / 10) + 1;
    if (lv > g.level) {
      g.level = lv;
      sLevel();
    }
    g.clearing = false;
    g.clearRows = [];
    spawnNext(g);
    g.dirty = true;
  };

  const lockPiece = (g: GameState) => {
    if (!g.active) return;
    if (SHAPES[g.active.type][g.active.rot].some(([, r]) => g.active!.y + r < 0)) {
      if (kidsModeRef.current) {
        forgiveStack(g);
        return;
      }
      g.status = "over";
      setAnnounce(`遊戲結束，得分 ${g.score}`);
      sOver();
      stopBgm();
      g.dirty = true;
      return;
    }
    g.board = merge(g.active, g.board);
    sLock();
    const full: number[] = [];
    g.board.forEach((row, y) => {
      if (row.every((c) => c)) full.push(y);
    });
    if (full.length) {
      g.clearing = true;
      g.clearRows = full;
      g.clearUntil = performance.now() + 260;
      sLine(full.length);
      if (!reduced) juice.shake.trigger(0.12, 2 + full.length);
    } else {
      spawnNext(g);
    }
    g.dirty = true;
  };

  const gravityStep = (g: GameState) => {
    if (!g.active) return;
    const np = { ...g.active, y: g.active.y + 1 };
    if (valid(np, g.board)) {
      g.active = np;
      if (g.softDrop) g.score += 1;
      g.grounded = false;
      g.lockTimer = 0;
      g.dirty = true;
    } else {
      g.grounded = true;
    }
  };

  const move = (dx: number) => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return;
    const np = { ...g.active, x: g.active.x + dx };
    if (valid(np, g.board)) {
      g.active = np;
      updateGrounded(g);
      resetLock(g);
      sMove();
      g.dirty = true;
      repaint();
    }
  };

  const rotate = (dir: number) => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return;
    const nr = (g.active.rot + dir + 4) % 4;
    for (const [dx, dy] of KICKS) {
      const np: Piece = {
        type: g.active.type,
        rot: nr,
        x: g.active.x + dx,
        y: g.active.y + dy,
      };
      if (valid(np, g.board)) {
        g.active = np;
        updateGrounded(g);
        resetLock(g);
        sRotate();
        g.dirty = true;
        repaint();
        return;
      }
    }
  };

  const hardDrop = () => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return;
    let n = 0;
    while (valid({ ...g.active, y: g.active.y + 1 }, g.board)) {
      g.active = { ...g.active, y: g.active.y + 1 };
      n++;
    }
    g.score += n * 2;
    lockPiece(g);
    repaint();
  };

  const holdPiece = () => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active || !g.canHold) return;
    const cur = g.active.type;
    if (g.hold == null) {
      g.hold = cur;
      spawnNext(g);
    } else {
      const h = g.hold;
      g.hold = cur;
      g.active = { type: h, rot: 0, x: 3, y: 0 };
      if (!valid(g.active, g.board)) {
        if (kidsModeRef.current) forgiveStack(g);
        else {
          g.status = "over";
          sOver();
          stopBgm();
        }
      } else {
        updateGrounded(g);
      }
    }
    g.canHold = false;
    g.lockTimer = 0;
    g.dirty = true;
    repaint();
  };

  const begin = useCallback(() => {
    ensureAudio();
    playBgm();
    const g = freshGame();
    g.status = "playing";
    refill(g);
    spawnNext(g);
    g.lastTime = null;
    G.current = g;
    repaint();
  }, [ensureAudio, playBgm, repaint]);

  const togglePause = useCallback(() => {
    const g = G.current;
    if (g.status === "playing") {
      g.status = "paused";
      pauseBgm();
      setAnnounce("遊戲已暫停");
    } else if (g.status === "paused") {
      g.status = "playing";
      g.lastTime = null;
      resumeBgm();
      setAnnounce("繼續遊戲");
    }
    repaint();
  }, [pauseBgm, repaint, resumeBgm]);

  const playStatus = G.current.status;
  useKeyboardInput(
    (input) => {
      const g = G.current;
      if (g.status === "playing") {
        if (input.wasPressed("pause")) {
          togglePause();
          return;
        }
        const now = performance.now();
        const das = dasRef.current;
        if (input.wasPressed("move-left")) {
          move(-1);
          das.dir = -1;
          das.nextAt = now + DAS_DELAY;
        }
        if (input.wasPressed("move-right")) {
          move(1);
          das.dir = 1;
          das.nextAt = now + DAS_DELAY;
        }
        if (das.dir !== 0) {
          if (!input.isHeld(das.dir < 0 ? "move-left" : "move-right")) {
            das.dir = 0;
          } else {
            while (now >= das.nextAt) {
              move(das.dir);
              das.nextAt += DAS_REPEAT;
            }
          }
        }
        if (input.wasPressed("move-up")) rotate(1);
        if (input.wasPressed("action")) hardDrop();
        g.softDrop = input.isHeld("move-down") || touchSoftDropRef.current;
      } else if (g.status === "paused" && input.wasPressed("pause")) {
        togglePause();
      }
    },
    playStatus === "playing" || playStatus === "paused",
  );

  useGameLoop({
    onFrame: (dt, now) => {
      const g = G.current;
      if (g.status === "playing") {
        if (g.clearing) {
          if (now >= g.clearUntil) finishClear(g);
        } else if (g.active) {
          const slow = kidsModeRef.current ? 1.35 : 1;
          const interval = (g.softDrop ? 45 : gravityMs(g.level)) * slow;
          g.dropAcc += dt;
          while (!g.clearing && g.dropAcc >= interval) {
            g.dropAcc -= interval;
            gravityStep(g);
          }
          if (g.grounded) {
            g.lockTimer += dt;
            if (g.lockTimer >= LOCK_DELAY) lockPiece(g);
          }
        }
        if (g.dirty) {
          g.dirty = false;
          repaint();
        }
      }
      if (g.status === "over" && !g.metaReported) {
        g.metaReported = true;
        if (best == null || g.score > best) {
          void saveBest(g.score);
        }
        reportGameSession({ gameId: "block-drop", score: g.score });
      }
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      const k = e.key;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(k)) {
        e.preventDefault();
      }
      if (g.status === "ready" || g.status === "over") {
        if (k === " " || k === "Enter") begin();
        return;
      }
      if (g.status !== "playing") return;
      if (k === "x" || k === "X") rotate(1);
      else if (k === "z" || k === "Z") rotate(-1);
      else if (k === "c" || k === "C" || k === "Shift") holdPiece();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begin, togglePause]);

  const startRepeat = (fn: () => void) => {
    fn();
    if (repeatRef.current) clearInterval(repeatRef.current);
    repeatRef.current = setInterval(fn, 110);
  };

  const stopRepeat = () => {
    if (repeatRef.current) {
      clearInterval(repeatRef.current);
      repeatRef.current = null;
    }
  };

  useEffect(() => stopRepeat, []);

  useVisibilityPause({
    onHidden: () => {
      if (G.current.status === "playing") togglePause();
    },
    onVisible: () => {},
  });

  const g = G.current;
  const view = g.board.map((row) => row.slice());
  const activeSet = new Set<number>();
  const ghostSet = new Set<number>();
  if (g.active) {
    let gy = g.active.y;
    while (valid({ ...g.active, y: gy + 1 }, g.board)) gy++;
    for (const [c, r] of SHAPES[g.active.type][g.active.rot]) {
      const x = g.active.x + c;
      const y = gy + r;
      if (y >= 0) ghostSet.add(y * COLS + x);
    }
    for (const [c, r] of SHAPES[g.active.type][g.active.rot]) {
      const x = g.active.x + c;
      const y = g.active.y + r;
      if (y >= 0) activeSet.add(y * COLS + x);
    }
  }
  const clearSet = new Set(g.clearing ? g.clearRows : []);

  const blockStyle = (
    type: PieceType,
    glow?: boolean,
  ): CSSProperties => {
    const color = COLORS[type];
    const tile = blockTileUrls?.[type];
    return {
      width: "100%",
      height: "100%",
      background: tile ? undefined : color,
      backgroundImage: tile ? `url(${tile})` : undefined,
      backgroundSize: "cover",
      imageRendering: "pixelated",
      borderRadius: 2,
      boxShadow: `inset 1px 1px 0 rgba(255,255,255,.35), inset -1px -1px 0 rgba(0,0,0,.35)${glow ? `, 0 0 6px ${color}` : ""}`,
    };
  };

  const font = "var(--font-sans, 'PingFang TC','Microsoft JhengHei',system-ui,sans-serif)";

  return (
    <GameChrome
      canPause={g.status === "playing" || g.status === "paused"}
      paused={g.status === "paused"}
      onPause={togglePause}
      onResume={togglePause}
      onRestart={begin}
      announce={announce}
    >
    <div
      style={{
        fontFamily: font,
        background: "linear-gradient(160deg,#161a26,#0e1119)",
        padding: "18px 16px 22px",
        borderRadius: 24,
        maxWidth: 520,
        margin: "0 auto",
        boxShadow: "0 22px 46px rgba(0,0,0,.4)",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes lineFlash { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes popIn { 0%{transform:scale(.7);opacity:0} 100%{transform:scale(1);opacity:1} }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 24, fontWeight: 800, color: "#eaf0ff" }}>
          🧩 繽紛方塊 {kidsMode ? "🧒" : ""}
        </div>
        <GameChromeToolbar
          canPause={g.status === "playing" || g.status === "paused"}
          paused={g.status === "paused"}
          onPause={togglePause}
          onResume={togglePause}
          soundOn={soundUi}
          onToggleSound={toggleSound}
        />
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        <Stat label="分數" value={g.score} />
        <Stat label="等級" value={g.level} />
        <Stat label="行數" value={g.lines} />
        <Stat label="最佳" value={Math.max(best ?? 0, g.score)} />
      </div>

      <GamePixelBoard
        gameId="block-drop"
        nativeWidth={LAYOUT_W}
        nativeHeight={BOARD_H}
      >
          <div
            style={{
              width: LAYOUT_W,
              height: BOARD_H,
              display: "flex",
              gap: 14,
            }}
          >
            <div
              style={{
                position: "relative",
                width: BOARD_W,
                height: BOARD_H,
                transform: boardTransform,
                background: KIT_BLOCK.well,
                borderRadius: 4,
                boxShadow: `inset 0 0 0 2px ${KIT_BLOCK.wellBorder}`,
                display: "grid",
                gridTemplateColumns: `repeat(${COLS}, ${CELL}px)`,
                gridTemplateRows: `repeat(${ROWS}, ${CELL}px)`,
                overflow: "hidden",
              }}
            >
              {Array.from({ length: ROWS * COLS }).map((_, idx) => {
                const x = idx % COLS;
                const y = Math.floor(idx / COLS);
                const isClearing = clearSet.has(y);
                let cell: ReactNode = null;
                if (activeSet.has(idx) && g.active) {
                  cell = <div style={blockStyle(g.active.type, true)} />;
                } else if (view[y][x]) {
                  cell = <div style={blockStyle(view[y][x] as PieceType)} />;
                } else if (ghostSet.has(idx)) {
                  cell = (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        borderRadius: 5,
                        border: "2px solid rgba(255,255,255,.22)",
                        boxSizing: "border-box",
                      }}
                    />
                  );
                }
                return (
                  <div
                    key={idx}
                    style={{
                      width: CELL,
                      height: CELL,
                      padding: 1,
                      boxSizing: "border-box",
                      background: "rgba(255,255,255,.015)",
                      boxShadow: "inset 0 0 0 0.5px rgba(255,255,255,.03)",
                      animation:
                        isClearing && !reduced ? "lineFlash .26s linear" : "none",
                    }}
                  >
                    {isClearing ? (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          background: "#fff",
                          borderRadius: 5,
                        }}
                      />
                    ) : (
                      cell
                    )}
                  </div>
                );
              })}

              {g.status !== "playing" && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(8,11,20,.82)",
                    backdropFilter: "blur(2px)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    color: "#fff",
                    textAlign: "center",
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      fontSize: 40,
                      animation: reduced ? "none" : "popIn .35s ease-out",
                    }}
                  >
                    {g.status === "over" ? "💥" : g.status === "paused" ? "⏸" : "🧩"}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 800 }}>
                    {g.status === "over"
                      ? "遊戲結束"
                      : g.status === "paused"
                        ? "暫停中"
                        : "繽紛方塊"}
                  </div>
                  {g.status === "over" && (
                    <div style={{ fontSize: 15, color: "#cdd7ee" }}>分數 {g.score}</div>
                  )}
                  {g.status !== "paused" ? (
                    <GameResultActions
                      onReplay={begin}
                      replayLabel={g.status === "over" ? "再玩一次 🔁" : "開始 ▶"}
                      replayStyle={primaryBtn(font)}
                    />
                  ) : (
                    <button type="button" onClick={togglePause} style={primaryBtn(font)}>
                      繼續 ▶
                    </button>
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                width: SIDE_W,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <MiniBox type={g.hold} label="HOLD" />
              <div
                style={{
                  background: "rgba(255,255,255,.07)",
                  borderRadius: 12,
                  padding: 8,
                }}
              >
                <div
                  style={{
                    color: "#9fb0d0",
                    fontSize: 12,
                    fontWeight: 800,
                    marginBottom: 6,
                    textAlign: "center",
                  }}
                >
                  NEXT
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {g.bag.slice(0, 3).map((t, i) => (
                    <div
                      key={i}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(4, 14px)",
                        gridTemplateRows: "repeat(2, 14px)",
                        gap: 2,
                        justifyContent: "center",
                      }}
                    >
                      {Array.from({ length: 8 }).map((_, k) => {
                        const c = k % 4;
                        const r = Math.floor(k / 4);
                        const on = SHAPES[t][0].some(([cc, rr]) => cc === c && rr === r);
                        return (
                          <div
                            key={k}
                            style={
                              on ? blockStyle(t) : { background: "transparent" }
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
      </GamePixelBoard>

      <div className={touchControlStyles.controlGrid}>
        <GridTouchButton
          label="左"
          coarse={isCoarse}
          onDown={() => startRepeat(() => move(-1))}
          onUp={stopRepeat}
        >
          ⬅️
        </GridTouchButton>
        <GridTouchButton label="旋轉" coarse={isCoarse} onDown={() => rotate(1)}>
          🔄
        </GridTouchButton>
        <GridTouchButton
          label="右"
          coarse={isCoarse}
          onDown={() => startRepeat(() => move(1))}
          onUp={stopRepeat}
        >
          ➡️
        </GridTouchButton>
        <GridTouchButton
          label="軟降"
          coarse={isCoarse}
          onDown={() => {
            touchSoftDropRef.current = true;
            G.current.softDrop = true;
          }}
          onUp={() => {
            touchSoftDropRef.current = false;
            G.current.softDrop = false;
          }}
        >
          ⬇️
        </GridTouchButton>
        <GridTouchButton label="落下" coarse={isCoarse} wide onDown={hardDrop}>
          ⤓ 落下
        </GridTouchButton>
        <GridTouchButton label="暫存" coarse={isCoarse} onDown={holdPiece}>
          📦
        </GridTouchButton>
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#7e8db0",
          fontSize: 13,
          marginTop: 12,
        }}
      >
        {isCoarse
          ? "大按鈕操作 · 按住左右可連續移動"
          : "← → 移動 · ↑ 旋轉 · ↓ 軟降 · 空白鍵落下 · P 暫停 · 手把支援"}
      </p>
    </div>
    </GameChrome>
  );
}
