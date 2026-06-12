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
import { reportGameSession } from "@/lib/gamekit/session";
import type { BlockDropDifficulty } from "@/lib/gamekit/settings";
import GameChrome, { GameChromeToolbar } from "@/components/games/GameChrome";
import { GameResultActions } from "@/components/games/GameResultActions";
import { useGameKitSettings } from "@/hooks/useGameKitSettings";
import {
  IconBox,
  IconCandy,
  IconFlame,
  IconKid,
  IconNext,
  IconPauseGlyph,
  IconPlay,
  IconRainbow,
  IconReplay,
  IconSpaceKey,
  IconSparkle,
  IconSprout,
  IconStar,
  IconSwipeDown,
  IconSwipeLR,
  IconSwipeUp,
  IconTap,
  IconTrophy,
} from "@/components/games/ClayIcons";

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
type OverReason = "topout" | null;

const DIFFICULTY_CONFIG: Record<
  BlockDropDifficulty,
  {
    label: string;
    gravityScale: number;
    lockDelayMs: number;
    scoreMultiplier: number;
    rescueLimit: number;
  }
> = {
  relaxed: {
    label: "輕鬆",
    gravityScale: 1.35,
    lockDelayMs: 620,
    scoreMultiplier: 1,
    rescueLimit: 1,
  },
  standard: {
    label: "標準",
    gravityScale: 1,
    lockDelayMs: LOCK_DELAY,
    scoreMultiplier: 1,
    rescueLimit: 0,
  },
  challenge: {
    label: "挑戰",
    gravityScale: 0.82,
    lockDelayMs: 360,
    scoreMultiplier: 1.35,
    rescueLimit: 0,
  },
};
const DIFFICULTY_ICON: Record<BlockDropDifficulty, ReactNode> = {
  relaxed: <IconSprout size={14} />,
  standard: <IconStar size={14} />,
  challenge: <IconFlame size={14} />,
};
const DIFFICULTY_ORDER: BlockDropDifficulty[] = [
  "relaxed",
  "standard",
  "challenge",
];

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
  rescues: number;
  overReason: OverReason;
  lastTime: number | null;
  dirty: boolean;
  metaReported: boolean;
}

const TYPES: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];
const LINE_SCORE = [0, 100, 300, 500, 800];
const CLEAR_LABEL = ["", "好耶", "太棒了", "漂亮", "彩虹全消"];
const MACARON_THEME = {
  shell: "#fff7ed",
  shellDeep: "#ffe9d6",
  ink: "#5d4a67",
  inkSoft: "#8c7896",
  mint: "#b9f3db",
  peach: "#ffc4a8",
  lemon: "#ffe889",
  lavender: "#d8c7ff",
  sky: "#bde7ff",
  berry: "#ffb4cf",
  board: "#fffaf2",
  boardLine: "rgba(117,88,119,.08)",
};
const CLAY_BLOCK_COLORS: Record<PieceType, string> = {
  I: "#8ddff0",
  O: "#ffe16f",
  T: "#c9b4ff",
  S: "#9de7b8",
  Z: "#ff9fb7",
  J: "#9dbbff",
  L: "#ffc28a",
};
const COLORS: Record<PieceType, string> = {
  ...CLAY_BLOCK_COLORS,
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
    rescues: 0,
    overReason: null,
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
    minHeight: 56,
    background: `linear-gradient(180deg,${MACARON_THEME.lemon},#ffbd6f)`,
    color: "#614018",
    fontWeight: 900,
    fontSize: 19,
    padding: "13px 30px",
    borderRadius: 999,
    cursor: "pointer",
    boxShadow:
      "0 8px 0 rgba(203,128,52,.42), 0 16px 24px rgba(164,103,61,.18), inset 0 2px 0 rgba(255,255,255,.72)",
    fontFamily: font,
  };
}

function secondaryBtn(font: string): CSSProperties {
  return {
    border: "2px solid rgba(93,74,103,.12)",
    minHeight: 52,
    background: "rgba(255,255,255,.72)",
    color: MACARON_THEME.ink,
    fontWeight: 800,
    fontSize: 15,
    padding: "10px 20px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: font,
  };
}

const panelStyle: CSSProperties = {
  background:
    "linear-gradient(180deg,rgba(255,255,255,.9),rgba(255,246,238,.82))",
  border: "1px solid rgba(255,255,255,.9)",
  borderRadius: 18,
  padding: "8px 10px",
  textAlign: "center",
  boxShadow:
    "0 8px 18px rgba(158,118,122,.12), inset 0 1px 0 rgba(255,255,255,.85)",
};

const panelLabel: CSSProperties = {
  color: MACARON_THEME.inkSoft,
  fontSize: 11,
  fontWeight: 900,
};

const hintChip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "rgba(255,255,255,.82)",
  border: "1px solid rgba(255,255,255,.95)",
  borderRadius: 999,
  padding: "5px 12px",
  fontSize: 14,
  fontWeight: 900,
  color: MACARON_THEME.ink,
  boxShadow: "0 4px 10px rgba(126,96,112,.12)",
  whiteSpace: "nowrap",
};

type HintItem = { key: string; icon: ReactNode; label: string };

/** 操作提示：圖示膠囊列，取代整句文字說明。 */
function HintChips({ items, small }: { items: HintItem[]; small?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        justifyContent: "center",
        flexWrap: "wrap",
      }}
    >
      {items.map((item) => (
        <span
          key={item.key}
          style={
            small
              ? { ...hintChip, fontSize: 12, padding: "3px 10px", gap: 5 }
              : { ...hintChip, gap: 6 }
          }
        >
          {item.icon}
          {item.label}
        </span>
      ))}
    </div>
  );
}

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
                    borderRadius: Math.max(5, cell / 2.8),
                    boxShadow:
                      "inset 2px 2px 0 rgba(255,255,255,.62), inset -2px -2px 0 rgba(111,72,86,.16), 0 3px 6px rgba(117,88,119,.16)",
                  }
                : { background: "transparent" }
            }
          />
        );
      })}
    </div>
  );
}

const TOUCH_HINTS: HintItem[] = [
  { key: "tap", icon: <IconTap size={15} />, label: "轉" },
  { key: "drag", icon: <IconSwipeLR size={15} />, label: "移" },
  { key: "down", icon: <IconSwipeDown size={15} />, label: "落" },
];
const TOUCH_HOLD_HINT: HintItem = {
  key: "up",
  icon: <IconSwipeUp size={15} />,
  label: "存",
};
const KEY_HINTS: HintItem[] = [
  { key: "move", icon: null, label: "← → 移" },
  { key: "rotate", icon: null, label: "↑ 轉" },
  { key: "drop", icon: <IconSpaceKey size={16} />, label: "落" },
];
const KEY_HOLD_HINT: HintItem = { key: "hold", icon: null, label: "C 存" };

type Toast = { id: number; text: string; big: boolean };
type ClearFx = {
  id: number;
  text: string;
  kind: "spark" | "wave" | "confetti";
};

export default function BlockDropGame() {
  const G = useRef<GameState>(freshGame());
  const dasRef = useRef({ dir: 0, nextAt: 0 });
  const reduced = useReducedMotion();
  const { useKeyboardInput } = useTouchControls();
  const { best, saveBest } = useBestScore("block-drop");
  const isCoarse = useCoarsePointer();
  const {
    kidsMode,
    blockDropDifficulty,
    blockDropSpecialMode,
    setBlockDropDifficulty,
  } = useGameKitSettings();
  const difficultyRef = useRef(blockDropDifficulty);
  difficultyRef.current = blockDropDifficulty;
  const specialModeRef = useRef(blockDropSpecialMode);
  specialModeRef.current = blockDropSpecialMode;
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

  // ── 手機 / iPad / 桌機三段版面，同步玩法但微調資訊密度 ──
  const [layoutMode, setLayoutMode] = useState<"mobile" | "tablet" | "desktop">(
    "mobile",
  );
  useEffect(() => {
    const apply = () => {
      const w = window.innerWidth || 390;
      const h = window.innerHeight || 844;
      setLayoutMode(w >= 980 && h >= 620 ? "desktop" : w >= 700 ? "tablet" : "mobile");
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);
  const wide = layoutMode !== "mobile";
  const desktop = layoutMode === "desktop";

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
      const reserve = wide ? 42 : 34;
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
  const [clearFx, setClearFx] = useState<ClearFx | null>(null);
  const toastId = useRef(0);
  const toastTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearFxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const addToast = useCallback((text: string, big = false) => {
    const id = ++toastId.current;
    setToasts((list) => [...list.slice(-3), { id, text, big }]);
    toastTimers.current.push(
      setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, 1000),
    );
  }, []);
  const celebrateClear = useCallback((lines: number, combo: number) => {
    const id = performance.now();
    const kind: ClearFx["kind"] =
      lines >= 3 ? "confetti" : lines === 2 ? "wave" : "spark";
    const text = lines >= 3 ? "太棒了！" : lines === 2 ? "好厲害！" : "好耶！";
    setClearFx({ id, text, kind });
    if (clearFxTimer.current) clearTimeout(clearFxTimer.current);
    clearFxTimer.current = setTimeout(() => setClearFx(null), combo >= 2 ? 950 : 760);
  }, []);
  useEffect(
    () => () => {
      toastTimers.current.forEach(clearTimeout);
      if (clearFxTimer.current) clearTimeout(clearFxTimer.current);
    },
    [],
  );

  const newBestRef = useRef(false);

  // ── 落地擠壓（squash）：剛鎖定的格子做一拍 Q 彈動畫 ──
  const lockFxRef = useRef<{ cells: Set<number>; until: number }>({
    cells: new Set(),
    until: 0,
  });
  const lockFxTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (lockFxTimer.current) clearTimeout(lockFxTimer.current);
    },
    [],
  );
  const triggerLockSquash = (piece: Piece) => {
    if (reduced) return;
    const cells = new Set<number>();
    for (const [c, r] of SHAPES[piece.type][piece.rot]) {
      const x = piece.x + c;
      const y = piece.y + r;
      if (y >= 0) cells.add(y * COLS + x);
    }
    lockFxRef.current = { cells, until: performance.now() + 240 };
    if (lockFxTimer.current) clearTimeout(lockFxTimer.current);
    lockFxTimer.current = setTimeout(() => {
      lockFxRef.current = { cells: new Set(), until: 0 };
      repaint();
    }, 260);
  };

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

  const difficultyConfig = () => DIFFICULTY_CONFIG[difficultyRef.current];

  const scoreValue = (base: number) =>
    Math.round(base * difficultyConfig().scoreMultiplier);

  const shouldRescue = (g: GameState) => g.rescues < difficultyConfig().rescueLimit;

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
    g.rescues += 1;
    g.status = "playing";
    g.overReason = null;
    g.metaReported = false;
    playBgm();
    g.dirty = true;
    addToast("救援啟動，清出空間！", true);
    setAnnounce("方塊快到頂了，已幫你清出空間，繼續玩！");
  };

  const gameOver = (g: GameState, reason: OverReason = null) => {
    g.status = "over";
    g.overReason = reason;
    newBestRef.current = g.score > 0 && g.score > (best ?? 0);
    setAnnounce(
      reason === "topout"
        ? `方塊堆到頂了，得分 ${g.score}`
        : `遊戲結束，得分 ${g.score}`,
    );
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
      if (shouldRescue(g)) forgiveStack(g);
      else gameOver(g, "topout");
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
    const lineScore = scoreValue(LINE_SCORE[n] * g.level);
    g.score += lineScore;
    addToast(`${CLEAR_LABEL[n]} +${lineScore}`, n >= 4);
    g.combo += 1;
    celebrateClear(n, g.combo);
    if (g.combo >= 2) {
      const bonus = scoreValue(50 * (g.combo - 1) * g.level);
      g.score += bonus;
      addToast(`連擊 ×${g.combo} +${bonus}`);
    }
    const specialMode = specialModeRef.current;
    if (specialMode === "rainbow" && g.combo >= 2) {
      const rainbow = scoreValue(120 * g.combo * n);
      g.score += rainbow;
      addToast(`彩虹消除 +${rainbow}`, true);
      setClearFx({ id: performance.now(), text: "太棒了！", kind: "confetti" });
      if (!reduced) juice.shake.trigger(0.16, 4);
    }
    if (g.board.every((row) => row.every((c) => !c))) {
      const bonus = scoreValue(1000 * g.level);
      g.score += bonus;
      addToast(`全部清光 +${bonus}`, true);
      if (!reduced) juice.shake.trigger(0.2, 5);
    }
    const lv = Math.floor(g.lines / 10) + 1;
    if (lv > g.level) {
      g.level = lv;
      addToast(`升級 Lv ${lv}！`, true);
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
      if (shouldRescue(g)) {
        forgiveStack(g);
        return;
      }
      gameOver(g, "topout");
      return;
    }
    triggerLockSquash(g.active);
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
    g.score += scoreValue(n * 2);
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
        if (shouldRescue(g)) forgiveStack(g);
        else gameOver(g, "topout");
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
          const config = difficultyConfig();
          const interval = (g.softDrop ? 45 : gravityMs(g.level)) * config.gravityScale;
          g.dropAcc += dt;
          while (!g.clearing && g.dropAcc >= interval) {
            g.dropAcc -= interval;
            gravityStep(g);
          }
          if (g.grounded) {
            g.lockTimer += dt;
            if (g.lockTimer >= config.lockDelayMs) lockPiece(g);
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
    return {
      width: "100%",
      height: "100%",
      background: `radial-gradient(circle at 28% 22%, rgba(255,255,255,.72), transparent 28%), linear-gradient(145deg, ${color}, color-mix(in srgb, ${color} 72%, #8f6f86))`,
      borderRadius: 7,
      boxShadow: `inset 2px 2px 0 rgba(255,255,255,.56), inset -2px -3px 0 rgba(102,74,91,.18), 0 2px 5px rgba(121,83,99,.18)${glow ? `, 0 0 10px ${color}` : ""}`,
    };
  };

  const font = "var(--font-sans, 'PingFang TC','Microsoft JhengHei',system-ui,sans-serif)";
  const boardDisplayH = Math.round(BOARD_H * boardScale);
  const currentDifficulty = DIFFICULTY_CONFIG[blockDropDifficulty];
  const specialMode = blockDropSpecialMode;
  const topOut = g.status === "over" && g.overReason === "topout";

  const switchToRelaxedAndRestart = () => {
    difficultyRef.current = "relaxed";
    setBlockDropDifficulty("relaxed");
    begin();
  };

  const inRound = g.status === "playing" || g.status === "paused";
  const cycleDifficulty = () => {
    if (inRound) return;
    const i = DIFFICULTY_ORDER.indexOf(blockDropDifficulty);
    setBlockDropDifficulty(DIFFICULTY_ORDER[(i + 1) % DIFFICULTY_ORDER.length]);
  };

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
      <div aria-hidden style={{ ...panelLabel, marginBottom: 5 }}>
        <IconBox size={15} color={MACARON_THEME.inkSoft} />
      </div>
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
    <div style={panelStyle} role="img" aria-label="下一個方塊預覽">
      <div aria-hidden style={{ ...panelLabel, marginBottom: 5 }}>
        <IconNext size={15} color={MACARON_THEME.inkSoft} />
      </div>
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
      <div
        aria-label={`分數 ${g.score}`}
        style={{
          color: MACARON_THEME.ink,
          fontSize: desktop ? 32 : wide ? 29 : 27,
          fontWeight: 900,
          lineHeight: 1.1,
        }}
      >
        {g.score}
      </div>
      {g.combo >= 2 && g.status === "playing" ? (
        <div
          style={{
            color: "#d95f87",
            fontSize: 12,
            fontWeight: 900,
            display: "flex",
            alignItems: "center",
            gap: 3,
          }}
        >
          <IconFlame size={13} /> ×{g.combo}
        </div>
      ) : (
        <div style={{ color: MACARON_THEME.inkSoft, fontSize: 11, fontWeight: 800 }}>
          Lv {g.level}
        </div>
      )}
      <div
        aria-label={`最佳分數 ${Math.max(best ?? 0, g.score)}`}
        style={{
          color: "#a4869c",
          fontSize: 11,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          gap: 3,
        }}
      >
        <IconTrophy size={12} /> {Math.max(best ?? 0, g.score)}
      </div>
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
      data-layout={layoutMode}
      data-theme="macaron-clay"
      style={{
        fontFamily: font,
        background:
          "linear-gradient(160deg,#fff9ee 0%,#f3fbff 52%,#fff0f7 100%)",
        padding: wide ? "18px 20px 18px" : "14px 14px 14px",
        borderRadius: 28,
        maxWidth: wide
          ? WIDE_MAX_BOARD_W + (WIDE_SIDE_W + 14) * 2 + (desktop ? 56 : 32)
          : 440,
        margin: "0 auto",
        border: "2px solid rgba(255,255,255,.92)",
        boxShadow:
          "0 20px 42px rgba(144,116,128,.2), inset 0 2px 0 rgba(255,255,255,.95), inset 0 -8px 18px rgba(255,198,214,.18)",
        userSelect: "none",
      }}
    >
      <style>{`
        @keyframes lineFlash { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.42;transform:scale(1.08)} }
        @keyframes blockSquash {
          0% { transform: scale(1) }
          35% { transform: scale(1.16, .7) }
          70% { transform: scale(.94, 1.08) }
          100% { transform: scale(1) }
        }
        @keyframes popIn { 0%{transform:scale(.72);opacity:0} 100%{transform:scale(1);opacity:1} }
        @keyframes toastUp {
          0% { transform: translateY(10px) scale(.85); opacity: 0 }
          15% { transform: none; opacity: 1 }
          72% { transform: none; opacity: 1 }
          100% { transform: translateY(-16px); opacity: 0 }
        }
        @keyframes clearBurst {
          0% { transform: translate(-50%,-50%) scale(.72); opacity: 0 }
          18% { transform: translate(-50%,-50%) scale(1.08); opacity: 1 }
          72% { transform: translate(-50%,-55%) scale(1); opacity: 1 }
          100% { transform: translate(-50%,-72%) scale(.94); opacity: 0 }
        }
        @keyframes candyPop {
          0% { transform: translateY(10px) scale(.5); opacity: 0 }
          22% { opacity: 1 }
          100% { transform: translateY(-42px) scale(1.08); opacity: 0 }
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
        <div>
          <div
            style={{
              fontSize: wide ? 20 : 16,
              fontWeight: 800,
              color: MACARON_THEME.ink,
              whiteSpace: "nowrap",
            }}
          >
            繽紛方塊{" "}
            {kidsMode && <IconKid size={wide ? 19 : 16} style={{ verticalAlign: "-0.12em" }} />}
          </div>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginTop: 5,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              onClick={cycleDifficulty}
              aria-label={`難度 ${currentDifficulty.label}，點一下切換`}
              disabled={inRound}
              style={{
                color: MACARON_THEME.ink,
                background: "rgba(255,255,255,.68)",
                border: "1px solid rgba(255,255,255,.9)",
                borderRadius: 999,
                padding: "4px 11px",
                fontSize: 12,
                fontWeight: 900,
                boxShadow: "0 4px 10px rgba(126,96,112,.1)",
                cursor: inRound ? "default" : "pointer",
                opacity: inRound ? 0.55 : 1,
                fontFamily: font,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              {DIFFICULTY_ICON[blockDropDifficulty]} {currentDifficulty.label}
            </button>
            {specialMode === "rainbow" && (
              <span
                role="img"
                aria-label="彩虹消除模式"
                style={{
                  background: "linear-gradient(90deg,#ffe889,#b9f3db,#d8c7ff)",
                  borderRadius: 999,
                  padding: "4px 9px",
                  fontSize: 12,
                  fontWeight: 900,
                  boxShadow: "0 4px 10px rgba(126,96,112,.1)",
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                <IconRainbow size={16} />
              </span>
            )}
          </div>
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
          maxWidth: wide ? (desktop ? WIDE_MAX_BOARD_W : 420) : MAX_BOARD_W,
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
            background:
              "linear-gradient(180deg,rgba(255,255,255,.96),rgba(255,250,242,.92))",
            borderRadius: 16,
            boxShadow:
              "inset 0 0 0 3px rgba(255,255,255,.95), inset 0 -10px 20px rgba(255,204,217,.18), 0 16px 28px rgba(146,106,121,.2)",
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
              const squashing =
                lockFxRef.current.cells.has(idx) &&
                performance.now() < lockFxRef.current.until;
              cell = (
                <div
                  style={
                    squashing
                      ? {
                          ...blockStyle(view[y][x] as PieceType),
                          animation: "blockSquash .24s ease-out",
                          transformOrigin: "50% 100%",
                        }
                      : blockStyle(view[y][x] as PieceType)
                  }
                />
              );
            } else if (ghostSet.has(idx) && g.active) {
              const ghostColor = COLORS[g.active.type];
              cell = (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: 6,
                    border: `2px dashed color-mix(in srgb, ${ghostColor} 70%, #8f6f86)`,
                    background: `color-mix(in srgb, ${ghostColor} 22%, transparent)`,
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
                  background:
                    (x + y) % 2 === 0
                      ? "rgba(255,221,230,.18)"
                      : "rgba(191,237,255,.14)",
                  boxShadow: `inset 0 0 0 0.5px ${MACARON_THEME.boardLine}`,
                  animation:
                    isClearing && !reduced ? "lineFlash .26s linear" : "none",
                }}
              >
                {isClearing ? (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      background: "linear-gradient(135deg,#fff,#ffe889,#b9f3db)",
                      borderRadius: 8,
                      boxShadow: "0 0 10px rgba(255,210,111,.45)",
                    }}
                  />
                ) : (
                  cell
                )}
              </div>
            );
             })}
         </div>

        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: Math.max(0, Math.round(CELL * 4 * boardScale) - 2),
            zIndex: 2,
            height: 2,
            background:
              "linear-gradient(90deg,transparent,rgba(255,159,183,.85),transparent)",
            boxShadow: "0 0 10px rgba(255,159,183,.34)",
            pointerEvents: "none",
          }}
        />
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
          {clearFx && (
            <div
              key={clearFx.id}
              aria-hidden
              style={{
                position: "absolute",
                left: "50%",
                top: "42%",
                transform: "translate(-50%,-50%)",
                minWidth: 150,
                padding: "12px 22px",
                borderRadius: 999,
                color: MACARON_THEME.ink,
                background:
                  clearFx.kind === "confetti"
                    ? "linear-gradient(90deg,#ffe889,#b9f3db,#d8c7ff,#ffb4cf)"
                    : "rgba(255,255,255,.88)",
                border: "2px solid rgba(255,255,255,.95)",
                boxShadow:
                  "0 12px 26px rgba(146,106,121,.2), inset 0 2px 0 rgba(255,255,255,.78)",
                fontSize: 24,
                fontWeight: 900,
                textAlign: "center",
                animation: reduced ? "none" : "clearBurst .82s ease-out forwards",
              }}
            >
              {clearFx.text}
              {Array.from({ length: clearFx.kind === "confetti" ? 14 : 8 }).map((_, i) => (
                <span
                  key={i}
                  style={{
                    position: "absolute",
                    left: `${8 + ((i * 23) % 84)}%`,
                    top: `${clearFx.kind === "wave" ? 68 : 38 + ((i * 17) % 24)}%`,
                    width: clearFx.kind === "wave" ? 18 : 9,
                    height: clearFx.kind === "wave" ? 5 : 9,
                    borderRadius: clearFx.kind === "spark" ? 2 : 4,
                    background:
                      [
                        MACARON_THEME.lemon,
                        MACARON_THEME.mint,
                        MACARON_THEME.sky,
                        MACARON_THEME.berry,
                        MACARON_THEME.lavender,
                      ][i % 5],
                    transform: `rotate(${i * 31}deg)`,
                    animation: reduced ? "none" : `candyPop .72s ease-out ${i * 0.025}s forwards`,
                  }}
                />
              ))}
            </div>
          )}
          {toasts.map((t) => (
            <div
              key={t.id}
              style={{
                background: "rgba(255,255,255,.88)",
                color: t.big ? "#d95f87" : MACARON_THEME.ink,
                fontSize: t.big ? 18 : 14,
                fontWeight: 900,
                padding: "7px 16px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,.95)",
                boxShadow: "0 8px 18px rgba(146,106,121,.16)",
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
               background:
                 g.status === "paused"
                   ? "rgba(255,250,242,.76)"
                   : "rgba(255,250,242,.9)",
               backdropFilter: "blur(3px)",
               borderRadius: 16,
               display: "flex",
               flexDirection: "column",
               alignItems: "center",
               justifyContent: "center",
               gap: g.status === "paused" ? 10 : 12,
               color: MACARON_THEME.ink,
               textAlign: "center",
               padding: 16,
             }}
          >
            <div
              style={{
                lineHeight: 0,
                animation: reduced ? "none" : "popIn .35s ease-out",
              }}
            >
              {g.status === "over" ? (
                <IconSparkle size={48} />
              ) : g.status === "paused" ? (
                <IconPauseGlyph size={44} color={MACARON_THEME.inkSoft} />
              ) : (
                <IconCandy size={48} />
              )}
            </div>
            <div style={{ fontSize: 22, fontWeight: 900 }}>
              {g.status === "over"
                ? topOut
                  ? "方塊堆到頂了"
                  : "遊戲結束"
                : g.status === "paused"
                  ? "暫停中"
                  : "繽紛方塊"}
            </div>
            {g.status === "over" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 22,
                  fontWeight: 900,
                  color: MACARON_THEME.ink,
                }}
              >
                <IconStar size={22} /> {g.score}
                {newBestRef.current && (
                  <span
                    style={{
                      color: "#d95f87",
                      fontSize: 15,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <IconTrophy size={16} /> 新紀錄！
                  </span>
                )}
              </div>
            )}
            {g.status === "ready" && (
              <HintChips items={isCoarse ? TOUCH_HINTS : KEY_HINTS} />
            )}
            {g.status !== "paused" ? (
              <GameResultActions
                onReplay={begin}
                replayLabel={
                  g.status === "over" ? (
                    <>
                      <IconReplay size={19} /> 再玩
                    </>
                  ) : (
                    <>
                      <IconPlay size={19} /> 開始
                    </>
                  )
                }
                replayStyle={{
                  ...primaryBtn(font),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                extraActions={
                  topOut && blockDropDifficulty !== "relaxed" ? (
                    <button
                      type="button"
                      onClick={switchToRelaxedAndRestart}
                      style={{
                        ...secondaryBtn(font),
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <IconSprout size={16} /> 換輕鬆
                    </button>
                  ) : null
                }
              />
            ) : (
              <button
                type="button"
                onClick={togglePause}
                style={{
                  ...primaryBtn(font),
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconPlay size={19} /> 繼續
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

      <div style={{ marginTop: 9 }}>
        <HintChips
          small
          items={
            isCoarse
              ? [...TOUCH_HINTS, TOUCH_HOLD_HINT]
              : wide
                ? [...KEY_HINTS, KEY_HOLD_HINT]
                : KEY_HINTS
          }
        />
      </div>
    </div>
    </GameChrome>
  );
}
