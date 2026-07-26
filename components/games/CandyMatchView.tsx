"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CandyMatchBoard } from "@/components/games/CandyMatchBoard";
import { DirtOverlay, PieceArt, PieceGift } from "@/components/games/CandyMatchPieceArt";
import { GameEndStation } from "@/components/games/GameEndStation";
import { IconReplay, IconSparkle, IconStar } from "@/components/games/ClayIcons";
import type { GameAudioBus, OverlayProps } from "@/lib/gamekit/adapter";
import { loadPlayerProfile } from "@/lib/gamekit/progress/save";
import { medalCount } from "@/lib/gamekit/progress/meta";
import { GAMEKIT_PROGRESS_EVENT } from "@/lib/gamekit/progress/session";
import {
  applyGravity,
  areAdjacent,
  clearCells,
  collectBottomDrops,
  createBoard,
  findHintMove,
  findMatches,
  reshuffle,
  swapCreatesMatch,
  swapped,
  type BoardState,
} from "@/lib/games/candy-match/engine";
import {
  CANDY_MATCH_LEVELS,
  CANDY_MATCH_PIECES,
  kidsModeLevel,
  type CandyMatchLevel,
  type CandyMatchTask,
} from "@/lib/games/candy-match/levels";
import type { CandyMatchInstance } from "@/lib/gamekit/games/candy-match/adapter";
import styles from "./CandyMatchGame.module.css";

const INK = "#5d4a67";
const INK_SOFT = "#7c6886";
const ACCENT_PINK = "#a5567a";
const HINT_IDLE_MS = 9_000;
const PROPS_PER_LEVEL = { bubble: 2, rainbow: 1, broom: 1 };

type Screen = "title" | "map" | "play";
type PropKind = keyof typeof PROPS_PER_LEVEL;

type Progress = {
  collected: number[];
  cleaned: number;
  dropped: number;
  waves: number;
};

export type CandyMatchController = {
  goToMap(): void;
  goToTitle(): void;
  startLevel(index: number): void;
  restartCurrentLevel(): void;
};

export type CandyMatchViewProps = OverlayProps & {
  audio?: GameAudioBus;
  instance: CandyMatchInstance;
};

const freshProgress = (): Progress => ({
  collected: Array(CANDY_MATCH_PIECES.length).fill(0),
  cleaned: 0,
  dropped: 0,
  waves: 0,
});

const CHEER_SUCCESS = ["哇！你找到了！", "好棒喔！", "太厲害了！", "你找到好多顏色！"];
const CHEER_INVALID = ["沒關係，再試一次！", "找找三個一樣的圖案！", "差一點點，再找找看！"];
const CHEER_HINT = ["需要幫忙嗎？看看發光的地方！"];
const CHEER_WIN = ["任務完成！你超棒的！", "耶！我們做到了！"];

const pick = (list: string[]) => list[Math.floor(Math.random() * list.length)];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function taskGoals(task: CandyMatchTask, p: Progress): { icon: ReactNode; got: number; need: number }[] {
  switch (task.kind) {
    case "clear-any":
      return [{ icon: <IconSparkle size={22} />, got: p.waves, need: task.count }];
    case "collect":
      return [
        {
          icon: <PieceArt piece={task.piece} size={26} />,
          got: p.collected[task.piece],
          need: task.count,
        },
      ];
    case "collect-multi":
      return task.targets.map((t) => ({
        icon: <PieceArt piece={t.piece} size={26} />,
        got: p.collected[t.piece],
        need: t.count,
      }));
    case "clean-dirt":
      return [{ icon: <DirtOverlay size={24} />, got: p.cleaned, need: task.count }];
    case "drop-item":
      return [{ icon: <PieceGift size={24} />, got: p.dropped, need: task.count }];
  }
}

const taskDone = (task: CandyMatchTask, p: Progress): boolean =>
  taskGoals(task, p).every((g) => g.got >= g.need);

function taskIntro(task: CandyMatchTask): string {
  switch (task.kind) {
    case "clear-any":
      return "找到三個一樣的圖案吧！";
    case "collect":
      return `收集 ${task.count} 個${CANDY_MATCH_PIECES[task.piece].name}！`;
    case "collect-multi":
      return "收集三種指定圖案！";
    case "clean-dirt":
      return "幫廣場打掃乾淨吧！";
    case "drop-item":
      return "把禮物送到最下面！";
  }
}

function computeScore(progress: Progress, movesLeft: number): number {
  return progress.collected.reduce((a, b) => a + b, 0) * 10 + movesLeft * 5;
}

export function CandyMatchView({
  kidsMode,
  status,
  syncHost,
  onOpenTutorial,
  audio,
  instance,
}: CandyMatchViewProps) {
  const ensureAudio = audio?.ensureAudio ?? (() => {});
  const tone = audio?.tone ?? (() => {});

  const [screen, setScreen] = useState<Screen>("title");
  const [levelIndex, setLevelIndex] = useState(0);
  const [level, setLevel] = useState<CandyMatchLevel>(CANDY_MATCH_LEVELS[0]);
  const [board, setBoard] = useState<BoardState | null>(null);
  const [movesLeft, setMovesLeft] = useState(0);
  const [progress, setProgress] = useState<Progress>(freshProgress());
  const [propsLeft, setPropsLeft] = useState({ ...PROPS_PER_LEVEL });
  const [propMode, setPropMode] = useState<PropKind | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<{ a: number; b: number } | null>(null);
  const [popping, setPopping] = useState<Set<number>>(new Set());
  const [shaking, setShaking] = useState<Set<number>>(new Set());
  const [overlay, setOverlay] = useState<"win" | "retry" | null>(null);
  const [winStars, setWinStars] = useState(0);
  const [message, setMessage] = useState("");
  const [medals, setMedals] = useState<number[]>([]);
  const [cellPx, setCellPx] = useState(56);

  const processingRef = useRef(false);
  const usedPropRef = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const boardRef = useRef<BoardState | null>(null);
  boardRef.current = board;
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const movesRef = useRef(movesLeft);
  movesRef.current = movesLeft;
  const levelRef = useRef(level);
  levelRef.current = level;
  const levelIndexRef = useRef(levelIndex);
  levelIndexRef.current = levelIndex;
  const screenRef = useRef(screen);
  screenRef.current = screen;

  const inputPaused = instance.isInputPaused() || status === "paused";

  const refreshMedals = useCallback(() => {
    setMedals(loadPlayerProfile().medals["candy-match"]?.slice() ?? []);
  }, []);
  useEffect(() => {
    refreshMedals();
    window.addEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
    return () => window.removeEventListener(GAMEKIT_PROGRESS_EVENT, refreshMedals);
  }, [refreshMedals]);
  const maxCleared = medals.reduce((m, f, i) => (medalCount(f) > 0 ? Math.max(m, i + 1) : m), 0);

  useEffect(() => {
    const apply = () => {
      const cols = levelRef.current.cols;
      const w = Math.min(window.innerWidth, 520) - 64;
      setCellPx(Math.max(40, Math.min(64, Math.floor((w - (cols - 1) * 6) / cols))));
    };
    apply();
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, [screen, level]);

  const armIdleHint = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setHint(null);
    idleTimer.current = setTimeout(() => {
      const b = boardRef.current;
      if (!b || processingRef.current || screenRef.current !== "play" || inputPaused) return;
      const move = findHintMove(b.pieces, b.cols, b.rows);
      if (move) {
        setHint(move);
        setMessage(pick(CHEER_HINT));
        tone(1175, 0.12, "triangle", 0.05);
      }
    }, HINT_IDLE_MS);
  }, [inputPaused, tone]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  const startLevel = useCallback(
    (index: number) => {
      ensureAudio();
      const base = CANDY_MATCH_LEVELS[index];
      const lv = kidsMode ? kidsModeLevel(base) : base;
      setLevelIndex(index);
      setLevel(lv);
      setBoard(
        createBoard(lv.cols, lv.rows, lv.pieceKinds, Math.random, {
          dirtCount: lv.dirtCount,
          dropCount: lv.dropCount,
        }),
      );
      setMovesLeft(lv.moves);
      setProgress(freshProgress());
      setPropsLeft({ ...PROPS_PER_LEVEL });
      setPropMode(null);
      setSelected(null);
      setOverlay(null);
      setPopping(new Set());
      usedPropRef.current = false;
      processingRef.current = false;
      setScreen("play");
      setMessage(taskIntro(lv.task));
      instance.notifyPlaying(index, 0);
      syncHost();
      armIdleHint();
    },
    [armIdleHint, ensureAudio, instance, kidsMode, syncHost],
  );

  const goToMap = useCallback(() => {
    setOverlay(null);
    setScreen("map");
    instance.notifyReady("map");
    syncHost();
  }, [instance, syncHost]);

  const goToTitle = useCallback(() => {
    setOverlay(null);
    setScreen("title");
    instance.notifyReady("title");
    syncHost();
  }, [instance, syncHost]);

  const restartCurrentLevel = useCallback(() => {
    startLevel(levelIndexRef.current);
  }, [startLevel]);

  useEffect(() => {
    instance.registerController({
      goToMap,
      goToTitle,
      startLevel,
      restartCurrentLevel,
    });
    instance.notifyReady("title");
    syncHost();
    return () => instance.registerController({
      goToMap: () => {},
      goToTitle: () => {},
      startLevel: () => {},
      restartCurrentLevel: () => {},
    });
  }, [goToMap, goToTitle, instance, restartCurrentLevel, startLevel, syncHost]);

  const runResolve = useCallback(
    async (startPieces: number[], startDirt: boolean[], preCleared?: Set<number>) => {
      const lv = levelRef.current;
      processingRef.current = true;
      setHint(null);
      let pieces = startPieces;
      let dirt = startDirt;
      const gained = freshProgress();
      let wave = 0;
      let guard = 24;
      while (guard-- > 0) {
        const matches = preCleared && wave === 0 && preCleared.size > 0
          ? preCleared
          : findMatches(pieces, lv.cols, lv.rows);
        if (matches.size === 0) break;
        wave += 1;
        setPopping(new Set(matches));
        tone(523 + wave * 110, 0.12, "triangle", 0.06);
        await sleep(280);
        const cleared = clearCells(pieces, dirt, matches, CANDY_MATCH_PIECES.length);
        pieces = cleared.pieces;
        dirt = cleared.dirt;
        cleared.collected.forEach((n, i) => {
          gained.collected[i] += n;
        });
        if (cleared.cleaned > 0) {
          gained.cleaned += cleared.cleaned;
          tone(1046, 0.14, "triangle", 0.05);
        }
        gained.waves += 1;
        setPopping(new Set());
        setBoard({ cols: lv.cols, rows: lv.rows, pieces, dirt });
        await sleep(120);
        pieces = applyGravity(pieces, lv.cols, lv.rows, lv.pieceKinds, Math.random);
        const drops = collectBottomDrops(pieces, lv.cols, lv.rows);
        pieces = drops.pieces;
        if (drops.dropped > 0) {
          gained.dropped += drops.dropped;
          tone(784, 0.16, "triangle", 0.06);
        }
        setBoard({ cols: lv.cols, rows: lv.rows, pieces, dirt });
        await sleep(180);
      }
      const finalDrops = collectBottomDrops(pieces, lv.cols, lv.rows);
      if (finalDrops.dropped > 0) {
        pieces = finalDrops.pieces;
        gained.dropped += finalDrops.dropped;
        tone(784, 0.16, "triangle", 0.06);
        setBoard({ cols: lv.cols, rows: lv.rows, pieces, dirt });
      }

      const next: Progress = {
        collected: progressRef.current.collected.map((n, i) => n + gained.collected[i]),
        cleaned: progressRef.current.cleaned + gained.cleaned,
        dropped: progressRef.current.dropped + gained.dropped,
        waves: progressRef.current.waves + gained.waves,
      };
      setProgress(next);
      instance.notifyScore(computeScore(next, movesRef.current));
      syncHost();
      if (gained.waves > 0) setMessage(pick(CHEER_SUCCESS));

      if (taskDone(lv.task, next)) {
        await sleep(350);
        const remainOk = lv.moves === 0 || movesRef.current >= Math.ceil(lv.moves / 3);
        const flawless = !usedPropRef.current;
        const stars = 1 + (flawless ? 1 : 0) + (remainOk ? 1 : 0);
        setWinStars(stars);
        setOverlay("win");
        setMessage(pick(CHEER_WIN));
        [523, 659, 784, 1046].forEach((f, i) =>
          setTimeout(() => tone(f, 0.18, "triangle", 0.07), i * 120),
        );
        const score = computeScore(next, movesRef.current);
        instance.notifyWon({
          score,
          levelIndex: levelRef.current.index,
          cleared: true,
          flawless,
          collectedAll: remainOk,
        });
        syncHost();
        processingRef.current = false;
        return;
      }
      if (lv.moves > 0 && movesRef.current <= 0) {
        await sleep(350);
        setOverlay("retry");
        setMessage("我們再試一次！");
        instance.notifyRetry();
        syncHost();
        processingRef.current = false;
        return;
      }
      if (!findHintMove(pieces, lv.cols, lv.rows)) {
        await sleep(250);
        const shuffled = reshuffle({ cols: lv.cols, rows: lv.rows, pieces, dirt }, Math.random);
        setBoard(shuffled);
        setMessage("圖案重新排隊囉！");
      }
      processingRef.current = false;
      armIdleHint();
    },
    [armIdleHint, instance, syncHost, tone],
  );

  const shakePair = useCallback((a: number, b: number) => {
    setShaking(new Set([a, b]));
    tone(180, 0.1, "triangle", 0.05);
    setMessage(pick(CHEER_INVALID));
    setTimeout(() => setShaking(new Set()), 320);
  }, [tone]);

  const attemptSwap = useCallback(
    (a: number, b: number) => {
      const b0 = boardRef.current;
      if (!b0 || processingRef.current || inputPaused) return;
      ensureAudio();
      armIdleHint();
      setSelected(null);
      if (!areAdjacent(a, b, b0.cols)) return;
      if (swapCreatesMatch(b0.pieces, a, b, b0.cols, b0.rows)) {
        const next = swapped(b0.pieces, a, b);
        setBoard({ ...b0, pieces: next });
        tone(660, 0.06, "square", 0.04);
        if (levelRef.current.moves > 0) setMovesLeft((m) => m - 1);
        void runResolve(next, b0.dirt);
      } else if (b0.pieces[a] === -2 || b0.pieces[b] === -2) {
        const giftIdx = b0.pieces[a] === -2 ? a : b;
        const otherIdx = giftIdx === a ? b : a;
        if (otherIdx === giftIdx + b0.cols) {
          const next = swapped(b0.pieces, a, b);
          setBoard({ ...b0, pieces: next });
          tone(660, 0.06, "square", 0.04);
          if (levelRef.current.moves > 0) setMovesLeft((m) => m - 1);
          void runResolve(next, b0.dirt);
          return;
        }
        shakePair(a, b);
      } else {
        shakePair(a, b);
      }
    },
    [armIdleHint, ensureAudio, inputPaused, runResolve, shakePair, tone],
  );

  const activateProp = useCallback(
    (kind: PropKind, target: number) => {
      const b0 = boardRef.current;
      if (!b0 || processingRef.current || inputPaused) return;
      const lv = levelRef.current;
      const cells = new Set<number>();
      if (kind === "bubble") {
        if (b0.pieces[target] < 0) return;
        cells.add(target);
      } else if (kind === "rainbow") {
        const v = b0.pieces[target];
        if (v < 0) return;
        b0.pieces.forEach((p, i) => {
          if (p === v) cells.add(i);
        });
      } else {
        const row = Math.floor(target / lv.cols);
        for (let c = 0; c < lv.cols; c++) {
          if (b0.pieces[row * lv.cols + c] >= 0) cells.add(row * lv.cols + c);
        }
      }
      if (cells.size === 0) return;
      usedPropRef.current = true;
      setPropsLeft((p) => ({ ...p, [kind]: p[kind] - 1 }));
      setPropMode(null);
      tone(880, 0.12, "triangle", 0.06);
      void runResolve(b0.pieces, b0.dirt, cells);
    },
    [inputPaused, runResolve, tone],
  );

  const onTapCell = useCallback(
    (i: number) => {
      if (inputPaused) return;
      ensureAudio();
      armIdleHint();
      if (propMode) {
        activateProp(propMode, i);
        return;
      }
      const b0 = boardRef.current;
      if (!b0 || processingRef.current) return;
      if (selected == null) {
        setSelected(i);
        tone(520, 0.04, "square", 0.03);
      } else if (selected === i) {
        setSelected(null);
      } else if (areAdjacent(selected, i, b0.cols)) {
        attemptSwap(selected, i);
      } else {
        setSelected(i);
        tone(520, 0.04, "square", 0.03);
      }
    },
    [activateProp, armIdleHint, attemptSwap, ensureAudio, inputPaused, propMode, selected, tone],
  );

  const manualHint = useCallback(() => {
    const b = boardRef.current;
    if (!b || processingRef.current || inputPaused) return;
    const move = findHintMove(b.pieces, b.cols, b.rows);
    if (move) {
      setHint(move);
      tone(1175, 0.12, "triangle", 0.05);
    }
  }, [inputPaused, tone]);

  const font =
    "var(--font-sans, 'PingFang TC','Microsoft JhengHei',system-ui,sans-serif)";
  const wrapStyle: CSSProperties = {
    fontFamily: font,
    background: `linear-gradient(160deg, ${level.themeA} 0%, ${level.themeB} 100%)`,
    borderRadius: 28,
    border: "2px solid rgba(255,255,255,.92)",
    boxShadow:
      "0 20px 42px rgba(144,116,128,.2), inset 0 2px 0 rgba(255,255,255,.95)",
    maxWidth: 560,
    margin: "0 auto",
    padding: 16,
    userSelect: "none",
    minHeight: 480,
    position: "relative",
  };

  const bigBtn: CSSProperties = {
    border: "none",
    minHeight: 58,
    background: "linear-gradient(180deg,#ffe889,#ffbd6f)",
    color: "#614018",
    fontWeight: 900,
    fontSize: 20,
    padding: "14px 34px",
    borderRadius: 999,
    cursor: "pointer",
    boxShadow:
      "0 8px 0 rgba(203,128,52,.42), 0 16px 24px rgba(164,103,61,.18), inset 0 2px 0 rgba(255,255,255,.72)",
    fontFamily: font,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
  };
  const softBtn: CSSProperties = {
    border: "2px solid rgba(93,74,103,.12)",
    minHeight: 48,
    background: "rgba(255,255,255,.8)",
    color: INK,
    fontWeight: 800,
    fontSize: 16,
    padding: "10px 22px",
    borderRadius: 999,
    cursor: "pointer",
    fontFamily: font,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };

  const currentGoals = taskGoals(level.task, progress);
  const goalProgress = currentGoals.length
    ? Math.min(
        1,
        currentGoals.reduce((sum, goal) => sum + Math.min(goal.got, goal.need), 0) /
          currentGoals.reduce((sum, goal) => sum + goal.need, 0),
      )
    : 0;

  return (
    <div
      style={wrapStyle}
      className={styles.surface}
      data-screen={screen}
      data-task={level.task.kind}
      aria-live="polite"
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        {/* 遊戲名由 GamePageShell 的 h1 唯一持有，這裡只顯示目前關卡地點。 */}
        <div className={styles.gameTitle} style={{ fontSize: 18, fontWeight: 900, color: INK, whiteSpace: "nowrap" }}>
          {screen === "play" ? level.place : null}
        </div>
      </div>

      {screen === "title" && (
        <div className={styles.titleScreen} style={{ textAlign: "center", paddingTop: 46, paddingBottom: 40 }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 18 }}>
            {[0, 1, 2, 3, 4].map((p) => (
              <span key={p} style={{ width: 52, height: 52, display: "inline-block" }}>
                <PieceArt piece={p} size="100%" />
              </span>
            ))}
          </div>
          {/* 頁面唯一 h1 屬 GamePageShell；此處為關卡畫面標題，降為 h2 避免重複 h1。 */}
          <h2 style={{ fontSize: 40, fontWeight: 900, color: ACCENT_PINK, margin: "0 0 8px" }}>
            準備找糖果！
          </h2>
          <p style={{ color: INK_SOFT, fontWeight: 700, margin: "0 0 26px", fontSize: 15 }}>
            找一找、排一排、消一消，完成小任務就有星星！
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <button type="button" style={bigBtn} onClick={goToMap}>
              ▶ 開始
            </button>
            <button type="button" style={softBtn} onClick={onOpenTutorial}>
              怎麼玩？
            </button>
          </div>
        </div>
      )}

      {screen === "map" && (
        <div className={styles.mapScreen} style={{ paddingBottom: 12 }}>
          <h2 style={{ textAlign: "center", color: INK, fontSize: 22, fontWeight: 900, margin: "6px 0 14px" }}>
            遊樂園地圖
          </h2>
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <button type="button" style={softBtn} onClick={onOpenTutorial}>
              怎麼玩？
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {CANDY_MATCH_LEVELS.map((lv, i) => {
              const locked = i > maxCleared;
              const stars = medalCount(medals[i] ?? 0);
              return (
                <button
                  key={lv.index}
                  type="button"
                  disabled={locked}
                  onClick={() => startLevel(i)}
                  style={{
                    ...softBtn,
                    flexDirection: "column",
                    gap: 2,
                    padding: "12px 8px",
                    opacity: locked ? 0.45 : 1,
                    cursor: locked ? "default" : "pointer",
                    background: locked ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.85)",
                  }}
                >
                  <span style={{ fontSize: 13, color: INK_SOFT, fontWeight: 800 }}>
                    {locked ? "🔒" : `第 ${i + 1} 關`}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 900 }}>{lv.place}</span>
                  <span aria-label={`${stars} 顆星`} style={{ display: "inline-flex", gap: 2 }}>
                    {[0, 1, 2].map((s) => (
                      <IconStar key={s} size={16} color={s < stars ? "#ffd34d" : "#e3dce6"} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ textAlign: "center", marginTop: 14 }}>
            <button type="button" style={softBtn} onClick={goToTitle}>
              回標題
            </button>
          </div>
        </div>
      )}

      {screen === "play" && board && (
        <>
          <div
            className={styles.taskBar}
            aria-label="本關任務進度"
            style={{
              display: "grid",
              gap: 7,
              background: "rgba(255,255,255,.82)",
              borderRadius: 18,
              padding: "8px 14px",
              marginBottom: 10,
              boxShadow: "0 6px 14px rgba(150,110,130,.12)",
            }}
          >
            <div className={styles.taskHeading}>
              <span className={styles.taskKicker}>第 {levelIndex + 1}/{CANDY_MATCH_LEVELS.length} 關 · {level.name}</span>
              <strong>{taskIntro(level.task)}</strong>
              {level.moves > 0 ? (
                <span className={movesLeft <= 5 ? styles.movesWarning : styles.movesLabel}>
                  還有 {movesLeft} 步
                </span>
              ) : (
                <span className={styles.movesLabel}>慢慢找，沒有時間限制</span>
              )}
            </div>
            <div className={styles.taskProgressTrack} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(goalProgress * 100)} aria-label="任務完成度">
              <span className={styles.taskProgressFill} style={{ width: `${Math.max(5, goalProgress * 100)}%` }} />
            </div>
            <div className={styles.taskGoals}>
              {currentGoals.map((g, i) => (
                <span key={i} className={styles.taskGoal}>
                  {g.icon} {Math.min(g.got, g.need)}/{g.need}
                </span>
              ))}
            </div>
          </div>

          <div className={styles.boardWrap} style={{ display: "flex", justifyContent: "center" }}>
            <CandyMatchBoard
              board={board}
              cellPx={cellPx}
              selected={selected}
              hint={hint}
              popping={popping}
              shaking={shaking}
              disabled={processingRef.current || overlay !== null || inputPaused}
              onTapCell={onTapCell}
              onSwipeCell={attemptSwap}
            />
          </div>

          <div
            className={styles.actionRow}
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 12,
              flexWrap: "wrap",
            }}
          >
            {(
              [
                ["bubble", "🫧", "泡泡"],
                ["rainbow", "🌈", "彩虹"],
                ["broom", "🧹", "掃把"],
              ] as const
            ).map(([kind, icon, label]) => (
              <button
                key={kind}
                type="button"
                disabled={propsLeft[kind] <= 0 || inputPaused}
                aria-pressed={propMode === kind}
                onClick={() => {
                  setPropMode((m) => (m === kind ? null : kind));
                  tone(700, 0.05, "square", 0.04);
                }}
                style={{
                  ...softBtn,
                  minHeight: 46,
                  opacity: propsLeft[kind] <= 0 ? 0.4 : 1,
                  boxShadow: propMode === kind ? "0 0 0 3px #ff9fb7" : "none",
                }}
              >
                <span aria-hidden>{icon}</span> {label} ×{propsLeft[kind]}
              </button>
            ))}
            <button type="button" style={softBtn} onClick={manualHint} disabled={inputPaused}>
              💡 提示
            </button>
          </div>
          {propMode && (
            <p style={{ textAlign: "center", color: ACCENT_PINK, fontWeight: 800, fontSize: 14, margin: "8px 0 0" }}>
              {propMode === "broom" ? "點一格，掃掉整排！" : propMode === "rainbow" ? "點一個圖案，同款全收！" : "點一個圖案，啵一聲消掉！"}
            </p>
          )}

          <div
            className={styles.encouragement}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              justifyContent: "center",
              marginTop: 12,
              minHeight: 40,
            }}
          >
            <span style={{ width: 38, height: 38, flexShrink: 0 }}>
              <PieceArt piece={3} size="100%" />
            </span>
            <span
              style={{
                background: "rgba(255,255,255,.9)",
                borderRadius: 999,
                padding: "8px 16px",
                fontWeight: 800,
                color: INK,
                fontSize: 15,
                boxShadow: "0 6px 14px rgba(150,110,130,.12)",
              }}
            >
              {message}
            </span>
          </div>

          {overlay && (
            <div
              className={styles.resultOverlay}
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 28,
                background: "rgba(255,250,242,.92)",
                backdropFilter: "blur(3px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                textAlign: "center",
                padding: 20,
                zIndex: 5,
              }}
            >
              {overlay === "win" ? (
                <GameEndStation
                  mood="win"
                  title={
                    levelIndex === CANDY_MATCH_LEVELS.length - 1
                      ? "全部完成！"
                      : "任務完成！"
                  }
                  stars={winStars}
                  gameSlug="candy-match"
                  onReplay={
                    levelIndex === CANDY_MATCH_LEVELS.length - 1
                      ? () => startLevel(0)
                      : restartCurrentLevel
                  }
                  replayLabel={
                    levelIndex === CANDY_MATCH_LEVELS.length - 1
                      ? "再玩一輪"
                      : "再玩這一關"
                  }
                  mainAction={
                    levelIndex < CANDY_MATCH_LEVELS.length - 1
                      ? {
                          label: "下一關 ▶",
                          onClick: () => startLevel(levelIndex + 1),
                        }
                      : undefined
                  }
                  hideHubLink
                />
              ) : (
                <GameEndStation
                  mood="retry"
                  title="我們再試一次！"
                  gameSlug="candy-match"
                  onReplay={restartCurrentLevel}
                  replayLabel="再來一次"
                  hideHubLink
                />
              )}
              <button type="button" style={softBtn} onClick={goToMap}>
                回地圖
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
