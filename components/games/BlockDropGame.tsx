"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCoarsePointer } from "@/hooks/useCoarsePointer";
import { useDomJuice } from "@/hooks/useDomJuice";
import {
  useBestScore,
  useGameAudio,
  useGameLoop,
  useTouchControls,
  useVisibilityPause,
} from "@/lib/game-kit";
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
const MAX_BOARD_W = 396;
const WIDE_MAX_BOARD_W = 460;
const WIDE_SIDE_W = 150;
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
  combo: number;
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
const CLEAR_LABEL = ["", "好耶 ✨", "雙倍消除 ✨", "三倍消除 🎉", "繽紛全消 🌈"];
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
    combo: 0,
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

const panelStyle: CSSProperties = {
  background: "rgba(255,255,255,.07)",
  borderRadius: 12,
  padding: "6px 8px",
  textAlign: "center",
};

const panelLabel: CSSProperties = {
  color: "#9fb0d0",
  fontSize: 11,
  fontWeight: 800,
};

/** 4×2 迷你方塊預覽（HOLD / NEXT 用，純色塊即可辨識形狀）。 */
function PiecePreview({ type, cell }: { type: PieceType | null; cell: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(4, ${cell}px)`,
        gridTemplateRows: `repeat(2, ${cell}px)`,
        gap: 2,
        justifyContent: "center",
      }}
    >
      {Array.from({ length: 8 }).map((_, i) => {
        const c = i % 4;
        const r = Math.floor(i / 4);
        const on = type && SHAPES[type][0].some(([cc, rr]) => cc === c && rr === r);
        return (
          <div
            key={i}
            style={
              on
                ? {
                    width: "100%",
                    height: "100%",
                    background: COLORS[type as PieceType],
                    borderRadius: Math.max(2, cell / 3),
                    boxShadow:
                      "inset 1px 1px 0 rgba(255,255,255,.4), inset -1px -1px 0 rgba(0,0,0,.28)",
                  }
                : { background: "transparent" }
            }
          />
        );
      })}
    </div>
  );
}

type Toast = { id: number; text: string; big: boolean };

export default function BlockDropGame() {
  const G = useRef<GameState>(freshGame());
  const dasRef = useRef({ dir: 0, nextAt: 0 });
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

  // ── 寬螢幕（iPad／桌機）：三欄一頁式排版，免捲動、免虛擬按鍵 ──
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 700px) and (min-height: 500px)");
    const apply = () => setWide(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  // ── 手機優先：棋盤填滿卡片寬度，連續縮放（DOM 方塊非像素畫，免整數倍）──
  const boardWrapRef = useRef<HTMLDivElement | null>(null);
  const [boardScale, setBoardScale] = useState(1.6);
  const boardScaleRef = useRef(boardScale);
  boardScaleRef.current = boardScale;

  useEffect(() => {
    const el = boardWrapRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      if (w <= 0) return;
      // 用棋盤頂端的實際位置動態計算可用高度（下方保留提示行＋卡片內距），
      // 整頁呈現、玩到底不用捲動
      const top = el.getBoundingClientRect().top + window.scrollY;
      const reserve = wide ? 50 : 44;
      const maxH = Math.max(300, (window.innerHeight || 800) - top - reserve);
      setBoardScale(Math.min(w / BOARD_W, maxH / BOARD_H));
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [wide]);

  // ── 浮動回饋文字（消行／連擊／升級）──
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastId = useRef(0);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const addToast = useCallback((text: string, big = false) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-3), { id, text, big }]);
    toastTimers.current.push(
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, 1000),
    );
  }, []);
  useEffect(
    () => () => {
      toastTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const newBestRef = useRef(false);

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
    addToast("🧒 方塊太多了，幫你清掉一些！", true);
    setAnnounce("方塊太多了，幫你清掉一些，繼續玩！");
  };

  const gameOver = (g: GameState) => {
    g.status = "over";
    newBestRef.current = g.score > 0 && g.score > (best ?? 0);
    setAnnounce(`遊戲結束，得分 ${g.score}`);
    sOver();
    stopBgm();
    g.dirty = true;
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
      else gameOver(g);
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
    addToast(`${CLEAR_LABEL[n]} +${LINE_SCORE[n] * g.level}`, n >= 4);
    g.combo += 1;
    if (g.combo >= 2) {
      const bonus = 50 * (g.combo - 1) * g.level;
      g.score += bonus;
      addToast(`🔥 連擊 ×${g.combo} +${bonus}`);
    }
    if (g.board.every((row) => row.every((c) => !c))) {
      const bonus = 1000 * g.level;
      g.score += bonus;
      addToast(`🌈 全部清光 +${bonus}`, true);
      if (!reduced) juice.shake.trigger(0.2, 5);
    }
    const lv = Math.floor(g.lines / 10) + 1;
    if (lv > g.level) {
      g.level = lv;
      addToast(`⭐ 升級！Lv ${lv}`, true);
      sLevel();
    }
    g.clearing = false;
    g.clearRows = [];
    spawnNext(g);
    g.dirty = true;
  };

  const lockPiece = (g: GameState) => {
    if (!g.active) return;
    dragRef.current = null;
    if (SHAPES[g.active.type][g.active.rot].some(([, r]) => g.active!.y + r < 0)) {
      if (kidsModeRef.current) {
        forgiveStack(g);
        return;
      }
      gameOver(g);
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
      g.combo = 0;
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

  const move = (dx: number): boolean => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return false;
    const np = { ...g.active, x: g.active.x + dx };
    if (!valid(np, g.board)) return false;
    g.active = np;
    updateGrounded(g);
    resetLock(g);
    sMove();
    g.dirty = true;
    repaint();
    return true;
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
    if (n > 0 && !reduced) juice.shake.trigger(0.07, 1.5);
    lockPiece(g);
    repaint();
  };

  const holdPiece = () => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active || !g.canHold) return;
    dragRef.current = null;
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
        else gameOver(g);
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
    newBestRef.current = false;
    refill(g);
    spawnNext(g);
    g.lastTime = null;
    G.current = g;
    setToasts([]);
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
        g.softDrop = input.isHeld("move-down");
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
      if (k === "z" || k === "Z") rotate(-1);
      else if (k === "x" || k === "X") rotate(1);
      else if (k === "c" || k === "C" || k === "Shift") holdPiece();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [begin, togglePause]);

  useVisibilityPause({
    onHidden: () => {
      if (G.current.status === "playing") togglePause();
    },
    onVisible: () => {},
  });

  // ── 棋盤手勢：左右拖曳移動、點一下旋轉、快速下滑硬降、上滑暫存 ──
  const dragRef = useRef<{
    pid: number;
    x0: number;
    y0: number;
    t0: number;
    startCol: number;
    dropped: number;
    moved: boolean;
  } | null>(null);

  const dragSoftStep = (): boolean => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return false;
    const np = { ...g.active, y: g.active.y + 1 };
    if (!valid(np, g.board)) return false;
    g.active = np;
    g.score += 1;
    g.dropAcc = 0;
    updateGrounded(g);
    g.dirty = true;
    repaint();
    return true;
  };

  const onBoardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = G.current;
    if (g.status !== "playing" || !g.active) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 部分環境（合成事件）不支援 capture，手勢仍可運作
    }
    dragRef.current = {
      pid: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      t0: performance.now(),
      startCol: g.active.x,
      dropped: 0,
      moved: false,
    };
  };

  const onBoardPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return;
    const px = CELL * boardScaleRef.current;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    const targetCol = d.startCol + Math.round(dx / px);
    let guard = COLS * 2;
    while (g.active && g.active.x !== targetCol && guard-- > 0) {
      if (!move(g.active.x < targetCol ? 1 : -1)) break;
    }
    const wantDrop = Math.floor(dy / px);
    while (d.dropped < wantDrop) {
      d.dropped++;
      if (!dragSoftStep()) break;
    }
    if (Math.hypot(dx, dy) > 10) d.moved = true;
  };

  const onBoardPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (!d || d.pid !== e.pointerId) return;
    dragRef.current = null;
    const g = G.current;
    if (g.status !== "playing") return;
    const dt = Math.max(1, performance.now() - d.t0);
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    const px = CELL * boardScaleRef.current;
    if (!d.moved && dt < 350) {
      rotate(1);
      return;
    }
    if (dy < -px && Math.abs(dy) > Math.abs(dx)) {
      holdPiece();
      return;
    }
    if (dy > px * 2 && dy / dt > 0.45 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      hardDrop();
    }
  };

  const onBoardPointerCancel = () => {
    dragRef.current = null;
  };

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
  const boardDisplayH = Math.round(BOARD_H * boardScale);

  const holdButton = (cell: number) => (
    <button
      type="button"
      onClick={holdPiece}
      aria-label="暫存方塊"
      style={{
        ...panelStyle,
        border: "none",
        cursor: "pointer",
        fontFamily: font,
        opacity: g.status === "playing" && !g.canHold ? 0.45 : 1,
      }}
    >
      <div style={{ ...panelLabel, marginBottom: 5 }}>暫存 📦</div>
      <PiecePreview type={g.hold} cell={cell} />
    </button>
  );

  // 固定三格高度（空位用透明占位）：待機／遊玩中版面高度一致，棋盤不會被擠到破版
  const nextQueue: (PieceType | null)[] = [
    g.bag[0] ?? null,
    g.bag[1] ?? null,
    g.bag[2] ?? null,
  ];
  const nextPanel = (firstCell: number, restCell: number) => (
    <div style={panelStyle}>
      <div style={{ ...panelLabel, marginBottom: 5 }}>下一個</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
        {nextQueue.map((t, i) => (
          <PiecePreview key={i} type={t} cell={i === 0 ? firstCell : restCell} />
        ))}
      </div>
    </div>
  );

  const scorePanel = (
    <div
      style={{
        ...panelStyle,
        flex: wide ? undefined : 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        padding: wide ? "10px 8px" : panelStyle.padding,
      }}
    >
      <div style={panelLabel}>分數</div>
      <div style={{ color: "#fff", fontSize: wide ? 30 : 26, fontWeight: 800, lineHeight: 1.1 }}>
        {g.score}
      </div>
      {g.combo >= 2 && g.status === "playing" ? (
        <div style={{ color: "#ffd23f", fontSize: 12, fontWeight: 800 }}>
          🔥 連擊 ×{g.combo}
        </div>
      ) : (
        <div style={{ color: "#8b9bbd", fontSize: 11, fontWeight: 700 }}>
          Lv {g.level} · {g.lines} 行 · 最佳 {Math.max(best ?? 0, g.score)}
        </div>
      )}
    </div>
  );

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
        padding: wide ? "16px 18px 18px" : "12px 14px 12px",
        borderRadius: 24,
        maxWidth: wide ? WIDE_MAX_BOARD_W + (WIDE_SIDE_W + 14) * 2 + 36 : 440,
        margin: "0 auto",
        boxShadow: "0 22px 46px rgba(0,0,0,.4)",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes lineFlash { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes popIn { 0%{transform:scale(.7);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes toastUp {
          0% { transform: translateY(10px) scale(.85); opacity: 0 }
          15% { transform: none; opacity: 1 }
          72% { transform: none; opacity: 1 }
          100% { transform: translateY(-16px); opacity: 0 }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div
          style={{
            fontSize: wide ? 20 : 16,
            fontWeight: 800,
            color: "#eaf0ff",
            whiteSpace: "nowrap",
          }}
        >
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

      {/* 手機：HOLD／分數／NEXT 集中在棋盤上方一列，棋盤可吃滿寬度 */}
      {!wide && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 10,
            alignItems: "stretch",
          }}
        >
          {holdButton(13)}
          {scorePanel}
          {nextPanel(11, 8)}
        </div>
      )}

      {/* 寬螢幕（iPad）：左欄資訊、中間棋盤、右欄預覽，一頁呈現 */}
      <div
        style={
          wide
            ? {
                display: "flex",
                gap: 14,
                alignItems: "flex-start",
                justifyContent: "center",
              }
            : undefined
        }
      >
        {wide && (
          <div
            style={{
              width: WIDE_SIDE_W,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {scorePanel}
            {holdButton(18)}
          </div>
        )}

      <div
        ref={boardWrapRef}
        style={{
          width: "100%",
          maxWidth: wide ? WIDE_MAX_BOARD_W : MAX_BOARD_W,
          flex: wide ? 1 : undefined,
          minWidth: 0,
          height: boardDisplayH,
          margin: "0 auto",
        }}
      >
       {/* 內層與縮放後的棋盤同寬：遮罩、手勢層、提示都貼齊棋盤本體 */}
       <div
        style={{
          position: "relative",
          width: Math.round(BOARD_W * boardScale),
          maxWidth: "100%",
          height: "100%",
          margin: "0 auto",
        }}
       >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            marginLeft: -(BOARD_W * boardScale) / 2,
            width: BOARD_W,
            height: BOARD_H,
            transform: `${boardTransform ?? ""} scale(${boardScale})`.trim(),
            transformOrigin: "top left",
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
        </div>

        {g.status === "playing" && (
          <div
            aria-hidden
            data-testid="board-gesture"
            onPointerDown={onBoardPointerDown}
            onPointerMove={onBoardPointerMove}
            onPointerUp={onBoardPointerUp}
            onPointerCancel={onBoardPointerCancel}
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 3,
              touchAction: "none",
              WebkitTapHighlightColor: "transparent",
            }}
          />
        )}

        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            right: 0,
            zIndex: 4,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: "rgba(8,11,20,.82)",
                color: t.big ? "#ffd23f" : "#eaf0ff",
                fontSize: t.big ? 18 : 14,
                fontWeight: 800,
                padding: "6px 16px",
                borderRadius: 999,
                whiteSpace: "nowrap",
                animation: reduced ? "none" : "toastUp 1s ease-out forwards",
              }}
            >
              {t.text}
            </div>
          ))}
        </div>

        {g.status !== "playing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 5,
              background: "rgba(8,11,20,.82)",
              backdropFilter: "blur(2px)",
              borderRadius: 4,
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
            <div style={{ fontSize: 22, fontWeight: 800 }}>
              {g.status === "over"
                ? "遊戲結束"
                : g.status === "paused"
                  ? "暫停中"
                  : "繽紛方塊"}
            </div>
            {g.status === "over" && (
              <div style={{ fontSize: 15, color: "#cdd7ee" }}>
                分數 {g.score}
                {newBestRef.current && (
                  <span
                    style={{
                      marginLeft: 8,
                      color: "#ffd23f",
                      fontWeight: 800,
                    }}
                  >
                    🏆 新紀錄！
                  </span>
                )}
              </div>
            )}
            {g.status === "ready" && (
              <div
                style={{
                  fontSize: 14,
                  color: "#cdd7ee",
                  lineHeight: 1.8,
                  textAlign: "left",
                }}
              >
                {isCoarse ? (
                  <>
                    👆 點一下棋盤＝旋轉
                    <br />
                    ↔️ 左右拖曳＝移動
                    <br />
                    ⬇️ 快速下滑＝直接落下
                    <br />
                    ⬆️ 上滑＝暫存方塊
                  </>
                ) : (
                  <>
                    ← → 移動 · ↑ 旋轉
                    <br />
                    ↓ 軟降 · 空白鍵直接落下
                  </>
                )}
              </div>
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
      </div>

        {wide && (
          <div
            style={{
              width: WIDE_SIDE_W,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {nextPanel(16, 12)}
          </div>
        )}
      </div>

      <p
        style={{
          textAlign: "center",
          color: "#7e8db0",
          fontSize: 12,
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        {isCoarse
          ? "👆 點旋轉 · ↔️ 拖移動 · ⬇️ 滑落下 · ⬆️ 滑暫存"
          : wide
            ? "← → 移動 · ↑/X 旋轉 · Z 反轉 · ↓ 軟降 · 空白鍵落下 · C 暫存 · P 暫停"
            : "← → 移動 · ↑ 旋轉 · ↓ 軟降 · 空白鍵落下 · C 暫存"}
      </p>
    </div>
    </GameChrome>
  );
}
