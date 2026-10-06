"use client";

/**
 * 《繽紛樂園》局內流程 hook：GameState、引擎事件、鍵盤、遊戲迴圈、棋盤手勢、教學與回饋。
 * 規則在 lib/games/block-drop/engine；這裡只把輸入轉成引擎呼叫、把事件轉成音效與畫面回饋。
 * （T4a：原樣搬自 BlockDropView，行為不變。）
 */
import { useCallback, useEffect, useRef, useState, type MutableRefObject, type PointerEvent as ReactPointerEvent } from "react";
import { useDomJuice } from "@/hooks/useDomJuice";
import { useGameLoop } from "@/lib/gamekit/react/useGameLoop";
import { useTouchControls } from "@/lib/gamekit/react/useTouchControls";
import type { GameAudioBus } from "@/lib/gamekit/adapter";
import type { BlockDropInstance } from "@/lib/gamekit/games/block-drop/adapter";
import type { BlockDropDifficulty, BlockDropSpecialMode } from "@/lib/gamekit/progress/settings";
import {
  EMPTY_BLOCK_DROP_TUTORIAL,
  completeBlockDropTutorialStep,
  isBlockDropBoardNearLine,
  skipBlockDropTutorial,
  stepAfterBlockDropAction,
  type BlockDropTutorialProgress,
  type BlockDropTutorialStep,
} from "@/lib/games/block-drop/tutorial";
import { readBlockDropTestSeed, seededRng } from "@/lib/games/block-drop/rng";
import {
  beginGame,
  freeModeConfig,
  freshGame,
  hardDrop as engineHardDrop,
  holdPiece as engineHoldPiece,
  move as engineMove,
  rotate as engineRotate,
  softStep as engineSoftStep,
  tick as engineTick,
  type EngineContext,
  type GameState,
} from "@/lib/games/block-drop/engine";
import { SHAPES, type Cell, type Piece } from "@/lib/games/block-drop/pieces";
import { DAS_DELAY, DAS_REPEAT } from "@/lib/games/block-drop/scoring";
import { blockStars, stageBoard, stageEngineConfig, type BlockRound } from "@/lib/games/block-drop/stages";
import { solveStage } from "@/lib/games/block-drop/solver";
import { loadBlockDropPrefs, saveBlockDropTips } from "@/lib/gamekit/progress/block-drop-prefs";
import { CELL, COLS } from "./blockDropTheme";

const CLEAR_LABEL = ["", "好耶", "太棒了", "漂亮", "彩虹全消"];

function readBlockDropTutorialProgress(): BlockDropTutorialProgress {
  if (typeof window === "undefined") return { ...EMPTY_BLOCK_DROP_TUTORIAL };
  const tips = loadBlockDropPrefs().tips;
  return { move: tips.includes("move"), rotate: tips.includes("rotate"), line: tips.includes("line") };
}

function saveBlockDropTutorialProgress(progress: BlockDropTutorialProgress): void {
  saveBlockDropTips((["move", "rotate", "line"] as const).filter((id) => progress[id]));
}

export type Toast = { id: number; text: string; big: boolean };
export type ClearFx = {
  id: number;
  text: string;
  kind: "spark" | "wave" | "confetti";
};

/** 棋盤手勢層：釋放 pointer capture（可單元測試）。 */
export function releaseBoardPointerCapture(target: HTMLElement, pointerId: number): void {
  try {
    if (target.hasPointerCapture?.(pointerId)) {
      target.releasePointerCapture(pointerId);
    }
  } catch {
    // 部分環境不支援 capture
  }
}

/** 任務冒險的結果：過關、重來（塊數用完／到頂）、輕鬆模式收尾。 */
export type BlockOutcome =
  | { kind: "won"; stars: number; flawless: boolean; efficient: boolean; pieces: number }
  | { kind: "retry"; reason: "outOfPieces" | "topout"; lines: number }
  | { kind: "wrapUp"; lines: number };

/** ↓ 鍵：hard＝落到底並固定（挑戰、自由堆疊）；soft＝點一下往下一格、按住快落（輕鬆冒險）。 */
export type DropMode = "hard" | "soft";

/** 閒置多久讓 ↓ 鍵亮起（輕鬆冒險）。 */
const IDLE_HINT_MS = 5_000;
/** 挑戰模式開局最多試幾個 seed，挑解題器有解的出塊順序。 */
const SOLVABLE_SEED_TRIES = 5;

export type BlockDropController = {
  begin(): void;
  pause(): void;
  resume(): void;
};

type Options = {
  instance: BlockDropInstance;
  audio?: GameAudioBus;
  best: number | null | undefined;
  reducedMotion: boolean;
  onStart: () => void;
  syncHost: () => void;
  blockDropDifficulty: BlockDropDifficulty;
  blockDropSpecialMode: BlockDropSpecialMode;
  /** 棋盤縮放（View 依版面量測）；手勢換算格數用 */
  boardScaleRef: MutableRefObject<number>;
  /** Host 的開始／確認鍵：由 View 依畫面決定（標題面進地圖、局後重玩）；未給時重開目前玩法 */
  onHostBegin?: () => void;
};

export function useBlockDropGame({
  instance,
  audio,
  best,
  reducedMotion,
  onStart,
  syncHost,
  blockDropDifficulty,
  blockDropSpecialMode,
  boardScaleRef,
  onHostBegin,
}: Options) {
  const G = useRef<GameState>(freshGame());
  const dasRef = useRef({ dir: 0, nextAt: 0 });
  // 測試掛鉤：`window.__blockDropSeed` 有值時 7-bag 用固定 seed、凍結自動重力與鎖定計時（黃金回放／視覺回歸）
  const rngRef = useRef<() => number>(Math.random);
  const testFrozenRef = useRef(false);
  const roundRef = useRef<BlockRound | null>(null);
  const [outcome, setOutcome] = useState<BlockOutcome | null>(null);
  const softHeldRef = useRef(false);
  const lastInputRef = useRef(0);
  const [idleHint, setIdleHint] = useState(false);
  const reduced = reducedMotion;
  const { useKeyboardInput } = useTouchControls();
  const difficultyRef = useRef(blockDropDifficulty);
  difficultyRef.current = blockDropDifficulty;
  const specialModeRef = useRef(blockDropSpecialMode);
  specialModeRef.current = blockDropSpecialMode;
  const { juice, boardTransform } = useDomJuice(reduced);

  const [, force] = useState(0);
  const tone = audio?.tone ?? (() => undefined);

  const repaint = useCallback(() => force((n) => n + 1), []);

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

  const [tutorialProgress, setTutorialProgress] = useState<BlockDropTutorialProgress>(
    () => readBlockDropTutorialProgress(),
  );
  const tutorialProgressRef = useRef(tutorialProgress);
  tutorialProgressRef.current = tutorialProgress;
  const [tutorialStep, setTutorialStep] = useState<BlockDropTutorialStep | null>(null);
  const tutorialStepRef = useRef<BlockDropTutorialStep | null>(null);

  const setVisibleTutorialStep = (step: BlockDropTutorialStep | null) => {
    tutorialStepRef.current = step;
    setTutorialStep(step);
  };

  const recordTutorialStep = (step: BlockDropTutorialStep) => {
    const current = tutorialProgressRef.current;
    if (current[step]) return;
    const next = completeBlockDropTutorialStep(current, step);
    tutorialProgressRef.current = next;
    setTutorialProgress(next);
    saveBlockDropTutorialProgress(next);
    setVisibleTutorialStep(
      step === "move" ? stepAfterBlockDropAction(next, "move") : null,
    );
  };

  const showLineTutorialIfNeeded = (board: readonly (readonly Cell[])[]) => {
    const current = tutorialProgressRef.current;
    if (current.line || tutorialStepRef.current || !current.move || !current.rotate) return;
    if (isBlockDropBoardNearLine(board)) setVisibleTutorialStep("line");
  };

  const skipTutorial = () => {
    const next = skipBlockDropTutorial();
    tutorialProgressRef.current = next;
    setTutorialProgress(next);
    saveBlockDropTutorialProgress(next);
    setVisibleTutorialStep(null);
  };

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
  /** 任務冒險：過站上行音階；重來用中性的兩聲，不用下行失敗音。 */
  const sWin = () =>
    [523, 659, 784, 1046].forEach((f, i) =>
      setTimeout(() => tone(f, 0.18, "triangle", 0.07), i * 120),
    );
  const sRetry = () =>
    [392, 392].forEach((f, i) => setTimeout(() => tone(f, 0.14, "triangle", 0.05), i * 180));
  const sOver = () =>
    [440, 330, 220].forEach((f, i) =>
      setTimeout(() => tone(f, 0.22, "sawtooth", 0.06), i * 160),
    );

  // UX-P2-1：blockDropDifficulty 是持久化偏好（見 useGameKitSettings），預設值
  // 已與 kidsMode 預設開啟同步為 relaxed；使用者明確切換過的難度會持久化並
  // 沿用於之後每一局，此處只讀取現值，不因 kidsMode 覆寫使用者的明確選擇。
  // 規則在 lib/games/block-drop/engine：config 每次取用都讀最新難度與彩虹設定。
  const ctxRef = useRef<EngineContext | null>(null);
  if (!ctxRef.current) {
    ctxRef.current = {
      get config() {
        const round = roundRef.current;
        return round
          ? stageEngineConfig(round)
          : freeModeConfig(difficultyRef.current, specialModeRef.current === "rainbow");
      },
      rng: () => rngRef.current(),
      events: [],
    };
  }

  /** 依序處理引擎事件：音效、toast、震動、教學、adapter 回報。 */
  const flushEvents = () => {
    const ctx = ctxRef.current!;
    const events = ctx.events;
    ctx.events = [];
    const g = G.current;
    for (const e of events) {
      switch (e.type) {
        case "lockStart":
        case "held":
          dragRef.current = null;
          break;
        case "moved":
          sMove();
          recordTutorialStep("move");
          break;
        case "rotated":
          sRotate();
          recordTutorialStep("rotate");
          break;
        case "locked":
          triggerLockSquash(e.piece);
          showLineTutorialIfNeeded(g.board);
          sLock();
          break;
        case "clearStart":
          sLine(e.rows.length);
          if (!reduced) juice.shake.trigger(0.12, 2 + e.rows.length);
          break;
        case "cleared":
          if (roundRef.current) {
            // 任務冒險不顯示分數：只給短句與音階，清到石頭多一聲
            celebrateClear(e.n, e.combo);
            if (e.stoneRows > 0) tone(1046, 0.14, "triangle", 0.06);
            break;
          }
          if (e.n > 0) recordTutorialStep("line");
          addToast(`${CLEAR_LABEL[e.n]} +${e.lineScore}`, e.n >= 4);
          celebrateClear(e.n, e.combo);
          break;
        case "comboBonus":
          if (roundRef.current) break;
          addToast(`連擊 ×${e.combo} +${e.bonus}`);
          break;
        case "rainbowBonus":
          addToast(`彩虹消除 +${e.bonus}`, true);
          setClearFx({ id: performance.now(), text: "太棒了！", kind: "confetti" });
          if (!reduced) juice.shake.trigger(0.16, 4);
          break;
        case "perfectClear":
          if (roundRef.current) break;
          addToast(`全部清光 +${e.bonus}`, true);
          if (!reduced) juice.shake.trigger(0.2, 5);
          break;
        case "levelUp":
          addToast(`升級 Lv ${e.level}！`, true);
          sLevel();
          break;
        case "hardDropped":
          if (e.rows > 0 && !reduced) juice.shake.trigger(0.07, 1.5);
          break;
        case "rescued":
          addToast(roundRef.current ? "幫你清出空間了！" : "救援啟動，清出空間！", true);
          instance.notifyPlaying(e.score);
          syncHost();
          break;
        case "won": {
          const round = roundRef.current;
          if (!round) break;
          const result = blockStars(round.stage, g);
          setOutcome({ kind: "won", ...result, pieces: g.pieces });
          sWin();
          instance.notifyWon({
            levelIndex: round.station.index,
            cleared: true,
            flawless: result.flawless,
            collectedAll: result.efficient,
          });
          syncHost();
          break;
        }
        case "gameOver":
          if (roundRef.current) {
            setOutcome(
              e.reason === "wrapUp"
                ? { kind: "wrapUp", lines: g.lines }
                : { kind: "retry", reason: e.reason === "outOfPieces" ? "outOfPieces" : "topout", lines: g.lines },
            );
            sRetry();
            instance.notifyRoundEnded();
            syncHost();
            break;
          }
          newBestRef.current = g.score > 0 && g.score > (best ?? 0);
          sOver();
          if (e.report) instance.notifyOver(e.score);
          syncHost();
          break;
        default:
          break;
      }
    }
  };

  const move = (dx: number): boolean => {
    const ok = engineMove(G.current, ctxRef.current!, dx);
    flushEvents();
    if (ok) repaint();
    return ok;
  };

  const rotate = (dir: number) => {
    const ok = engineRotate(G.current, ctxRef.current!, dir);
    flushEvents();
    if (ok) repaint();
  };

  const hardDrop = () => {
    const g = G.current;
    if (g.status !== "playing" || g.clearing || !g.active) return;
    engineHardDrop(g, ctxRef.current!, performance.now());
    flushEvents();
    repaint();
  };

  const holdPiece = () => {
    const ok = engineHoldPiece(G.current, ctxRef.current!);
    flushEvents();
    if (ok) repaint();
  };

  // 遊戲迴圈的區域函式每 render 重建（彼此互相引用，無法逐一 useCallback 化）。
  // 以 ref 鏡射最新版：useCallback／effect 依賴保持穩定（鍵盤訂閱不必每 render
  // 重掛），呼叫到的仍是最新閉包，行為與直接呼叫一致。
  const liveFnsRef = useRef({ flushEvents, rotate, holdPiece });
  liveFnsRef.current = { flushEvents, rotate, holdPiece };

  /** 開新局。round＝null 是自由堆疊（行為與抽引擎前相同），否則是任務冒險某一站。 */
  const startGame = useCallback(
    (round: BlockRound | null) => {
      audio?.ensureAudio();
      roundRef.current = round;
      const testSeed = readBlockDropTestSeed();
      if (testSeed != null) {
        rngRef.current = seededRng(testSeed);
      } else if (round && round.mode === "challenge") {
        // 挑戰有塊數上限：挑解題器有解的出塊順序（計劃「可解」第 2 點）
        let seed = Math.floor(Math.random() * 1e9);
        for (let i = 0; i < SOLVABLE_SEED_TRIES; i++) {
          if (solveStage(round.stage, seed, { beam: 24 }).solved) break;
          seed = Math.floor(Math.random() * 1e9);
        }
        rngRef.current = seededRng(seed);
      } else {
        rngRef.current = Math.random;
      }
      testFrozenRef.current = testSeed != null;
      const g = round ? freshGame(round.stage.cols, round.stage.rows, stageBoard(round.stage)) : freshGame();
      if (round) {
        tutorialStepRef.current = null;
        setTutorialStep(null);
      } else {
        const savedTutorial = readBlockDropTutorialProgress();
        tutorialProgressRef.current = savedTutorial;
        setTutorialProgress(savedTutorial);
        const initialTutorialStep: BlockDropTutorialStep | null = savedTutorial.move
          ? savedTutorial.rotate
            ? null
            : "rotate"
          : "move";
        tutorialStepRef.current = initialTutorialStep;
        setTutorialStep(initialTutorialStep);
      }
      newBestRef.current = false;
      softHeldRef.current = false;
      lastInputRef.current = performance.now();
      setIdleHint(false);
      setOutcome(null);
      beginGame(g, ctxRef.current!);
      G.current = g;
      liveFnsRef.current.flushEvents();
      setToasts([]);
      instance.notifyPlaying(g.score, { newRound: true, adventure: round != null });
      syncHost();
      repaint();
    },
    [audio, instance, syncHost, repaint],
  );

  /** Host 的開始／再玩：重開目前的玩法（任務冒險重玩同一站，否則自由堆疊）。 */
  const begin = useCallback(() => startGame(roundRef.current), [startGame]);

  const applyPause = useCallback(() => {
    const g = G.current;
    if (g.status !== "playing") return;
    g.status = "paused";
    instance.notifyPaused();
    syncHost();
    repaint();
  }, [instance, syncHost, repaint]);

  const applyResume = useCallback(() => {
    const g = G.current;
    if (g.status !== "paused") return;
    g.status = "playing";
    g.lastTime = null;
    instance.notifyPlaying(g.score);
    syncHost();
    repaint();
  }, [instance, syncHost, repaint]);

  const togglePause = useCallback(() => {
    const g = G.current;
    if (g.status === "playing") applyPause();
    else if (g.status === "paused") applyResume();
  }, [applyPause, applyResume]);

  const hostBeginRef = useRef(onHostBegin);
  hostBeginRef.current = onHostBegin;
  useEffect(() => {
    instance.registerController({
      begin: () => (hostBeginRef.current ? hostBeginRef.current() : begin()),
      pause: applyPause,
      resume: applyResume,
    });
    return () => {
      instance.registerController({
        begin: () => undefined,
        pause: () => undefined,
        resume: () => undefined,
      });
    };
  }, [instance, begin, applyPause, applyResume]);

  useEffect(() => {
    if (readBlockDropTestSeed() == null) return;
    const w = window as unknown as { __blockDropSnapshot?: () => unknown };
    w.__blockDropSnapshot = () => {
      const g = G.current;
      return {
        board: g.board.map((row) => row.map((c) => c ?? ".").join("")),
        active: g.active ? { ...g.active } : null,
        hold: g.hold,
        canHold: g.canHold,
        next: g.bag.slice(0, 3),
        score: g.score,
        level: g.level,
        lines: g.lines,
        combo: g.combo,
        status: g.status,
        clearing: g.clearing,
        rescues: g.rescues,
        overReason: g.overReason,
        adapterStatus: instance.getStatus(),
        adapterScore: instance.getScore(),
      };
    };
    return () => {
      delete w.__blockDropSnapshot;
    };
  }, [instance]);

  const dropModeOf = (): DropMode =>
    roundRef.current?.mode === "easy" ? "soft" : "hard";

  /** 輕鬆冒險 ↓：往下一格。 */
  const softDropStep = () => {
    lastInputRef.current = performance.now();
    const ok = engineSoftStep(G.current);
    if (ok) repaint();
  };

  /** ↓ 鍵按下：hard 直接落到底；soft 先往下一格，按住期間快落。 */
  const dropPress = () => {
    lastInputRef.current = performance.now();
    if (dropModeOf() === "hard") {
      hardDrop();
      return;
    }
    softDropStep();
    softHeldRef.current = true;
    G.current.softDrop = true;
  };

  const dropRelease = () => {
    softHeldRef.current = false;
    G.current.softDrop = false;
  };

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
        const soft = dropModeOf() === "soft";
        if (input.wasPressed("action")) {
          if (soft) softDropStep();
          else hardDrop();
        }
        g.softDrop =
          input.isHeld("move-down") || softHeldRef.current || (soft && input.isHeld("action"));
        if (
          input.wasPressed("move-left") ||
          input.wasPressed("move-right") ||
          input.wasPressed("move-up") ||
          input.wasPressed("action") ||
          input.isHeld("move-down")
        ) {
          lastInputRef.current = now;
        }
      } else if (g.status === "paused" && input.wasPressed("pause")) {
        togglePause();
      }
    },
    playStatus === "playing" || playStatus === "paused",
  );

  useGameLoop({
    onFrame: (dt, now) => {
      const g = G.current;
      if (g.status !== "playing") return;
      engineTick(g, ctxRef.current!, dt, now, testFrozenRef.current);
      flushEvents();
      if (g.dirty) {
        g.dirty = false;
        repaint();
      }
    },
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const g = G.current;
      const k = e.key;
      // 局外（地圖、結算卡）焦點在按鈕／連結上時交給原生啟用，不搶空白鍵與 Enter
      const target = e.target as HTMLElement | null;
      if (g.status !== "playing" && target?.closest?.("button, a, input, select, textarea")) return;
      if (["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "].includes(k)) {
        e.preventDefault();
      }
      if (g.status === "ready" || g.status === "over") {
        if (k === " " || k === "Enter") onStart();
        return;
      }
      if (g.status !== "playing") return;
      const { rotate: doRotate, holdPiece: doHold } = liveFnsRef.current;
      if (k === "z" || k === "Z") doRotate(-1);
      else if (k === "x" || k === "X") doRotate(1);
      else if (k === "c" || k === "C" || k === "Shift") doHold();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [onStart]);

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
  const moveRepeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopMoveRepeat = useCallback(() => {
    if (moveRepeatRef.current) {
      clearInterval(moveRepeatRef.current);
      moveRepeatRef.current = null;
    }
  }, []);

  useEffect(() => () => stopMoveRepeat(), [stopMoveRepeat]);

  const dragSoftStep = (): boolean => {
    const ok = engineSoftStep(G.current);
    if (ok) repaint();
    return ok;
  };

  const onBoardPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    lastInputRef.current = performance.now();
    const g = G.current;
    if (g.status !== "playing" || !g.active || dragRef.current) return;
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
    let guard = (g.board[0]?.length ?? COLS) * 2;
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
    releaseBoardPointerCapture(e.currentTarget, e.pointerId);
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
    // 輕鬆冒險不判定甩動硬降（避免孩子手一甩就鎖定）
    if (dropModeOf() === "hard" && dy > px * 2 && dy / dt > 0.45 && Math.abs(dy) > Math.abs(dx) * 1.4) {
      hardDrop();
    }
  };

  const onBoardPointerCancel = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d && d.pid === e.pointerId) {
      releaseBoardPointerCapture(e.currentTarget, e.pointerId);
      dragRef.current = null;
    }
  };

  const onBoardLostPointerCapture = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    if (d && d.pid === e.pointerId) {
      dragRef.current = null;
    }
  };

  const startMoveRepeat = (dx: number) => {
    lastInputRef.current = performance.now();
    stopMoveRepeat();
    move(dx);
    moveRepeatRef.current = setInterval(() => move(dx), 90);
  };

  // 計時清理：局不在進行（暫停、結束）或視窗失焦時，停掉連移與快落，避免黏鍵
  useEffect(() => {
    if (playStatus === "playing") return;
    stopMoveRepeat();
    softHeldRef.current = false;
    G.current.softDrop = false;
  }, [playStatus, stopMoveRepeat]);
  useEffect(() => {
    const onBlur = () => {
      stopMoveRepeat();
      softHeldRef.current = false;
      G.current.softDrop = false;
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [stopMoveRepeat]);

  /** 離開這一局（回地圖／標題）：換回空的自由堆疊待機盤，adapter 回 ready。 */
  const leaveRound = useCallback(() => {
    stopMoveRepeat();
    softHeldRef.current = false;
    roundRef.current = null;
    tutorialStepRef.current = null;
    setTutorialStep(null);
    G.current = freshGame();
    setOutcome(null);
    setToasts([]);
    setIdleHint(false);
    instance.notifyReady();
    syncHost();
    repaint();
  }, [instance, repaint, stopMoveRepeat, syncHost]);

  // 輕鬆冒險閒置 5 秒：↓ 鍵亮起提示「按住快快落」
  const isEasyRound = roundRef.current?.mode === "easy";
  useEffect(() => {
    if (!isEasyRound || playStatus !== "playing") {
      setIdleHint(false);
      return;
    }
    const t = setInterval(() => {
      setIdleHint(performance.now() - lastInputRef.current > IDLE_HINT_MS);
    }, 500);
    return () => clearInterval(t);
  }, [isEasyRound, playStatus]);

  return {
    G,
    roundRef,
    outcome,
    idleHint,
    dropMode: dropModeOf(),
    startGame,
    leaveRound,
    dropPress,
    dropRelease,
    repaint,
    juice,
    boardTransform,
    difficultyRef,
    toasts,
    clearFx,
    tutorialStep,
    skipTutorial,
    lockFxRef,
    newBestRef,
    begin,
    move,
    rotate,
    hardDrop,
    holdPiece,
    startMoveRepeat,
    stopMoveRepeat,
    gestures: {
      onPointerDown: onBoardPointerDown,
      onPointerMove: onBoardPointerMove,
      onPointerUp: onBoardPointerUp,
      onPointerCancel: onBoardPointerCancel,
      onLostPointerCapture: onBoardLostPointerCapture,
    },
  };
}
