"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameAudioBus } from "@/lib/gamekit/adapter";
import type { CandyMatchInstance } from "@/lib/gamekit/games/candy-match/adapter";
import type { CandyMatchTipId } from "@/lib/gamekit/progress/candy-match-prefs";
import { createBoard, reshuffle } from "@/lib/games/candy-match/board-gen";
import {
  addWaveEvents,
  areAdjacent,
  CANDY_COMBO_MS,
  CANDY_FALL_MS,
  CANDY_POP_MS,
  CANDY_SWAP_MS,
  emptyEvents,
  findHintMove,
  findMatches,
  propAffectedCells,
  settleBoard,
  stepWave,
  swapIsLegal,
  swapped,
  swappedSpecials,
  type BoardState,
  type CandyComboKind,
  type CandyFallMotion,
  type CandySweepKind,
  type ResolveEvents,
  type Rng,
  type SettlePhase,
  type WaveOptions,
} from "@/lib/games/candy-match/engine";
import { efficiencyMet, type CandyMatchRound, type CandyProps } from "@/lib/games/candy-match/stages";
import { seededRng } from "@/lib/games/candy-match/rng";
import { findGoalHint, type CandyMove } from "@/lib/games/candy-match/strategy";
import {
  allGoalsDone,
  applyEvents,
  countSwap,
  freshCandyProgress,
  type CandyGoal,
  type CandyProgress,
} from "@/lib/games/candy-match/tasks";

export type CandyPropKind = keyof CandyProps;

export type CandyRoundOutcome =
  | { kind: "win"; stars: number; flawless: boolean; efficient: boolean }
  | { kind: "retry" };

export type CandyPlaySnapshot = {
  round: CandyMatchRound;
  board: BoardState;
  movesLeft: number;
  progress: CandyProgress;
  propsLeft: CandyProps;
  usedProp: boolean;
};

export type CandyMotion = {
  swap: CandyMove | null;
  falls: readonly CandyFallMotion[] | null;
  sweep: CandySweepKind | null;
};

type Options = {
  instance: CandyMatchInstance;
  ensureAudio: () => void;
  tone: GameAudioBus["tone"];
  reducedMotion: boolean;
  inputPaused: boolean;
  syncHost: () => void;
  tipsSeen: readonly CandyMatchTipId[];
  onTipSeen: (id: CandyMatchTipId) => void;
};

/** 輕鬆模式閒置：先文字提示，再亮出交換對；挑戰模式只在主動按提示時亮。 */
const HINT_SOFT_MS = 9_000;
const HINT_SHOW_MS = 18_000;
const TIP_AUTO_HIDE_MS = 3_800;
const CHEER_MS = 520;
const SETTLE_PAUSE_MS = 120;
/** 一次交換最多解算的波數；超過仍沒穩定（極罕見）就在收尾重排，不留三連在盤上。 */
const MAX_WAVES = 100;
const EMPTY_SET: ReadonlySet<number> = new Set();
const NO_MOTION: CandyMotion = { swap: null, falls: null, sweep: null };

const CHEER_SUCCESS = ["找到了！", "好棒喔！", "太厲害了！", "好多顏色！"];
const CHEER_INVALID = ["再找找看！", "要三個一樣喔", "換別的試試"];
const CHEER_WIN = ["任務完成！", "耶！做到了！"];
const CHEER_SOFT = "找找三個一樣的圖案！";
const CHEER_HINT = "看看發光的地方！";
const COMBO_LINE: Record<CandyComboKind, string> = {
  cross: "掃把碰掃把，十字掃乾淨！",
  "color-brooms": "彩虹碰到掃把，同色都變掃把！",
  "clear-board": "兩顆彩虹，整盤一起收！",
};

/**
 * 視覺回歸用：測試在載入前設 `window.__candyMatchSeed`，棋盤生成與補格改用固定 seed。
 * 一般玩家不會有這個值，仍用 Math.random。
 */
function roundRng(levelIndex: number): Rng {
  const seed = (globalThis as { __candyMatchSeed?: unknown }).__candyMatchSeed;
  return typeof seed === "number" && Number.isFinite(seed) ? seededRng(seed + levelIndex) : Math.random;
}

const pick = (list: readonly string[]) => list[Math.floor(Math.random() * list.length)] ?? list[0]!;
const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function introMessage(goals: readonly CandyGoal[]): string {
  const first = goals[0];
  if (!first) return "";
  if (goals.filter((goal) => goal.kind === "collect").length > 1) return "收集指定的車車！";
  switch (first.kind) {
    case "collect-any":
      return "找三個一樣的圖案！";
    case "collect":
      return "收集上面的車車！";
    case "clean-dirt":
      return "幫廣場打掃乾淨！";
    case "drop-item":
      return "把禮物送到最下面！";
    case "detonate":
      return "做出特殊糖吧！";
  }
}

function computeScore(progress: CandyProgress, movesLeft: number): number {
  return progress.collected.reduce((a, b) => a + b, 0) * 10 + movesLeft * 5;
}

export function useCandyMatchPlay(options: Options) {
  const optsRef = useRef(options);
  const { reducedMotion, inputPaused } = options;

  const [play, setPlay] = useState<CandyPlaySnapshot | null>(null);
  const playRef = useRef<CandyPlaySnapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<CandyMove | null>(null);
  const [teachMove, setTeachMove] = useState<CandyMove | null>(null);
  const [popping, setPopping] = useState<ReadonlySet<number>>(EMPTY_SET);
  const [shaking, setShaking] = useState<ReadonlySet<number>>(EMPTY_SET);
  const [propMode, setPropMode] = useState<CandyPropKind | null>(null);
  const [propTarget, setPropTarget] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<CandyRoundOutcome | null>(null);
  const outcomeRef = useRef<CandyRoundOutcome | null>(null);
  const [message, setMessage] = useState("");
  const [tip, setTip] = useState<CandyMatchTipId | null>(null);
  const tipRef = useRef<CandyMatchTipId | null>(null);
  const [motion, setMotion] = useState<CandyMotion>(NO_MOTION);
  const [cheer, setCheer] = useState(false);

  const tokenRef = useRef(0);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastBoardsRef = useRef<Record<number, BoardState | undefined>>({});
  const rngRef = useRef<Rng>(Math.random);
  const pausedRef = useRef(inputPaused);
  const reducedRef = useRef(reducedMotion);
  // commit 後才同步，不在 render 期間寫 ref（React 丟棄的 render 不會留下錯值）；
  // React 處理下一個點擊前會先跑完這個 effect。
  useEffect(() => {
    optsRef.current = options;
    pausedRef.current = inputPaused;
    reducedRef.current = reducedMotion;
  });

  const motionSleep = useCallback((ms: number) => sleep(reducedRef.current ? 0 : ms), []);

  const commit = useCallback((patch: Partial<CandyPlaySnapshot>) => {
    const prev = playRef.current;
    if (!prev) return;
    const next = { ...prev, ...patch };
    playRef.current = next;
    setPlay(next);
  }, []);

  const setBusyState = useCallback((value: boolean) => {
    busyRef.current = value;
    setBusy(value);
  }, []);

  const setOutcomeState = useCallback((value: CandyRoundOutcome | null) => {
    outcomeRef.current = value;
    setOutcome(value);
  }, []);

  const setTipState = useCallback((value: CandyMatchTipId | null) => {
    tipRef.current = value;
    setTip(value);
  }, []);

  const clearTimers = useCallback(() => {
    for (const t of timersRef.current) clearTimeout(t);
    timersRef.current = [];
  }, []);

  const showTip = useCallback(
    (id: CandyMatchTipId) => {
      if (optsRef.current.tipsSeen.includes(id) || tipRef.current === id) return;
      setTipState(id);
      if (id !== "swap") optsRef.current.onTipSeen(id);
    },
    [setTipState],
  );

  const dismissTip = useCallback(() => {
    const current = tipRef.current;
    if (!current) return;
    optsRef.current.onTipSeen(current);
    setTipState(null);
    if (current === "swap") setTeachMove(null);
  }, [setTipState]);

  const armIdle = useCallback(() => {
    clearTimers();
    setHint(null);
    const snap = playRef.current;
    if (!snap || snap.round.mode !== "easy") return;
    const blocked = () => busyRef.current || pausedRef.current || outcomeRef.current != null;
    timersRef.current = [
      setTimeout(() => {
        if (!blocked()) setMessage(CHEER_SOFT);
      }, HINT_SOFT_MS),
      setTimeout(() => {
        const current = playRef.current;
        if (!current || blocked()) return;
        const move = findGoalHint(current.board, current.round.stage.goals, current.progress);
        if (!move) return;
        setHint(move);
        setMessage(CHEER_HINT);
        optsRef.current.tone(1175, 0.12, "triangle", 0.05);
      }, HINT_SHOW_MS),
    ];
  }, [clearTimers]);

  useEffect(() => {
    if (!cheer) return;
    const t = setTimeout(() => setCheer(false), CHEER_MS);
    return () => clearTimeout(t);
  }, [cheer]);

  useEffect(() => {
    if (!tip || tip === "swap") return;
    const t = setTimeout(() => setTipState(null), TIP_AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [tip, setTipState]);

  useEffect(
    () => () => {
      tokenRef.current += 1;
      clearTimers();
    },
    [clearTimers],
  );

  /** 播一串重力段落；局已換掉時回傳 false 讓呼叫端停手。 */
  const animatePhases = useCallback(
    async (phases: readonly SettlePhase[], token: number): Promise<boolean> => {
      for (const phase of phases) {
        if (phase.dropped > 0) optsRef.current.tone(784, 0.16, "triangle", 0.06);
        if (!reducedRef.current && phase.falls.length > 0) {
          setMotion((m) => ({ ...m, falls: phase.falls }));
          commit({ board: phase.board });
          await sleep(CANDY_FALL_MS);
          // 醒來先確認還是同一局，再動任何 state，避免清掉新局的動畫
          if (token !== tokenRef.current) return false;
          setMotion((m) => ({ ...m, falls: null }));
        } else {
          commit({ board: phase.board });
          await motionSleep(SETTLE_PAUSE_MS);
          if (token !== tokenRef.current) return false;
        }
      }
      return true;
    },
    [commit, motionSleep],
  );

  const finishResolve = useCallback(
    async (state: BoardState, events: ResolveEvents, token: number) => {
      const snap = playRef.current;
      if (!snap) return;
      const { instance, syncHost, tone } = optsRef.current;
      const progress = applyEvents(snap.progress, events);
      commit({ progress, board: state });
      const score = computeScore(progress, snap.movesLeft);
      instance.notifyScore(score);
      syncHost();
      if (events.waves > 0) setMessage(pick(CHEER_SUCCESS));

      if (allGoalsDone(snap.round.stage.goals, progress)) {
        await sleep(350);
        if (token !== tokenRef.current) return;
        const flawless = !snap.usedProp;
        const efficient = efficiencyMet(snap.round, progress, snap.movesLeft);
        const stars = 1 + (flawless ? 1 : 0) + (efficient ? 1 : 0);
        setOutcomeState({ kind: "win", stars, flawless, efficient });
        setMessage(pick(CHEER_WIN));
        [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, "triangle", 0.07), i * 120));
        instance.notifyWon({ score, levelIndex: snap.round.index, cleared: true, flawless, collectedAll: efficient });
        syncHost();
        setBusyState(false);
        return;
      }
      if (snap.round.stage.moves > 0 && snap.movesLeft <= 0) {
        await sleep(350);
        if (token !== tokenRef.current) return;
        setOutcomeState({ kind: "retry" });
        setMessage("步數用完了，再試一次！");
        instance.notifyRetry();
        syncHost();
        setBusyState(false);
        return;
      }
      const unstable = findMatches(state.pieces, state.cols, state.rows).size > 0;
      if (unstable || !findHintMove(state.pieces, state.cols, state.rows, state.specials)) {
        await sleep(250);
        if (token !== tokenRef.current) return;
        commit({ board: reshuffle(state, rngRef.current, snap.round.stage.pieceKinds) });
        setMessage("圖案重新排隊囉！");
      }
      setBusyState(false);
      armIdle();
    },
    [armIdle, commit, setBusyState, setOutcomeState],
  );

  /** 逐波解算＋動畫：每一波都用引擎的 stepWave，與純解算同一套規則。 */
  const runResolve = useCallback(
    async (startBoard: BoardState, waveOptions: WaveOptions) => {
      const snap0 = playRef.current;
      if (!snap0) return;
      const token = tokenRef.current;
      const kinds = snap0.round.stage.pieceKinds;
      setBusyState(true);
      setHint(null);
      let events = emptyEvents(kinds);
      const pre = settleBoard(startBoard, kinds, rngRef.current);
      commit({ board: startBoard });
      if (!(await animatePhases(pre.phases, token))) return;
      events = { ...events, dropped: pre.dropped };
      let state = pre.state;
      let first = true;
      for (let guard = 0; guard < MAX_WAVES; guard++) {
        const wave = stepWave(state, kinds, rngRef.current, first ? waveOptions : {});
        first = false;
        if (!wave) break;
        if (wave.combo) {
          setMessage(COMBO_LINE[wave.combo.kind]);
          if (!reducedRef.current) {
            if (wave.combo.kind === "color-brooms" && wave.combo.becomeRow.length > 0) {
              const specials = state.specials.slice();
              for (const i of wave.combo.becomeRow) specials[i] = "row";
              commit({ board: { ...state, specials } });
            }
            await sleep(CANDY_COMBO_MS);
            if (token !== tokenRef.current) return;
          }
        }
        const n = events.waves + 1;
        const sweep: CandySweepKind | null = wave.combo
          ? wave.combo.kind === "cross"
            ? "cross"
            : wave.combo.kind === "clear-board"
              ? "board"
              : "row"
          : (wave.detonated[0] ?? null);
        setPopping(new Set(wave.cleared));
        setMotion((m) => ({ ...m, sweep: reducedRef.current ? null : sweep }));
        if (wave.detonated.length > 0 || n >= 2) setCheer(true);
        optsRef.current.tone(523 + n * 110, 0.12, "triangle", 0.06);
        await motionSleep(CANDY_POP_MS);
        if (token !== tokenRef.current) return;
        setPopping(EMPTY_SET);
        setMotion((m) => ({ ...m, sweep: null }));
        commit({ board: wave.afterClear });
        if (wave.cleaned > 0) optsRef.current.tone(1046, 0.14, "triangle", 0.05);
        if (!(await animatePhases(wave.phases, token))) return;
        events = addWaveEvents(events, wave);
        for (const spawn of wave.spawns) showTip(spawn.kind);
        state = wave.state;
      }
      await finishResolve(state, events, token);
    },
    [animatePhases, commit, finishResolve, motionSleep, setBusyState, showTip],
  );

  const blockedInput = useCallback(
    () => busyRef.current || pausedRef.current || outcomeRef.current != null,
    [],
  );

  const shake = useCallback((a: number, b: number) => {
    setShaking(new Set([a, b]));
    optsRef.current.tone(180, 0.1, "triangle", 0.05);
    setMessage(pick(CHEER_INVALID));
    setTimeout(() => setShaking(EMPTY_SET), 320);
  }, []);

  const commitSwap = useCallback(
    async (a: number, b: number) => {
      const token = tokenRef.current;
      setBusyState(true);
      const { tone } = optsRef.current;
      tone(660, 0.06, "square", 0.04);
      if (!reducedRef.current) {
        setMotion((m) => ({ ...m, swap: { a, b } }));
        await sleep(CANDY_SWAP_MS);
        if (token !== tokenRef.current) return;
        setMotion((m) => ({ ...m, swap: null }));
      }
      const snap = playRef.current;
      if (!snap) return;
      const specials = swappedSpecials(snap.board.specials, a, b);
      const board: BoardState = { ...snap.board, pieces: swapped(snap.board.pieces, a, b), specials };
      commit({
        board,
        movesLeft: snap.round.stage.moves > 0 ? snap.movesLeft - 1 : snap.movesLeft,
        progress: countSwap(snap.progress),
      });
      if (tipRef.current === "swap") dismissTip();
      else setTeachMove(null);
      const extra = new Set<number>();
      if (specials[a] !== "none") extra.add(a);
      if (specials[b] !== "none") extra.add(b);
      await runResolve(board, { extraCells: extra.size > 0 ? extra : undefined, preferSpawnAt: [a, b] });
    },
    [commit, dismissTip, runResolve, setBusyState],
  );

  const attemptSwap = useCallback(
    (a: number, b: number) => {
      const snap = playRef.current;
      if (!snap || blockedInput()) return;
      optsRef.current.ensureAudio();
      armIdle();
      setSelected(null);
      if (!areAdjacent(a, b, snap.board.cols)) return;
      const { board } = snap;
      if (!swapIsLegal(board.pieces, board.specials, a, b, board.cols, board.rows)) {
        shake(a, b);
        return;
      }
      void commitSwap(a, b);
    },
    [armIdle, blockedInput, commitSwap, shake],
  );

  const activateProp = useCallback(
    (kind: CandyPropKind, cells: number[]) => {
      const snap = playRef.current;
      if (!snap || blockedInput() || snap.propsLeft[kind] <= 0) return;
      commit({ propsLeft: { ...snap.propsLeft, [kind]: snap.propsLeft[kind] - 1 }, usedProp: true });
      setPropMode(null);
      setPropTarget(null);
      optsRef.current.tone(880, 0.12, "triangle", 0.06);
      void runResolve(snap.board, { extraCells: cells, extraOnly: true });
    },
    [blockedInput, commit, runResolve],
  );

  const tapCell = useCallback(
    (i: number) => {
      const snap = playRef.current;
      if (!snap || blockedInput()) return;
      optsRef.current.ensureAudio();
      armIdle();
      if (propMode) {
        const cells = propAffectedCells(propMode, snap.board, i);
        if (cells.length === 0) {
          setMessage("這一格不能用喔");
          return;
        }
        // 已有預覽時，點亮框裡任一格就確認（掃把同一排、彩虹同一款都算）；框外的格子改當新目標
        const previewed =
          propTarget != null && propAffectedCells(propMode, snap.board, propTarget).includes(i);
        if (previewed) activateProp(propMode, propAffectedCells(propMode, snap.board, propTarget));
        else setPropTarget(i);
        return;
      }
      if (selected == null || selected === i) {
        setSelected(selected === i ? null : i);
        if (selected !== i) optsRef.current.tone(520, 0.04, "square", 0.03);
        if (selected == null && tipRef.current === "swap") setMessage("再點旁邊的圖案交換！");
        return;
      }
      if (areAdjacent(selected, i, snap.board.cols)) {
        attemptSwap(selected, i);
        return;
      }
      setSelected(i);
      optsRef.current.tone(520, 0.04, "square", 0.03);
    },
    [activateProp, armIdle, attemptSwap, blockedInput, propMode, propTarget, selected],
  );

  const hoverCell = useCallback(
    (i: number | null) => {
      const snap = playRef.current;
      if (!propMode || !snap) return;
      if (i == null) {
        setPropTarget(null);
        return;
      }
      if (propAffectedCells(propMode, snap.board, i).length > 0) setPropTarget(i);
    },
    [propMode],
  );

  const selectProp = useCallback(
    (kind: CandyPropKind) => {
      const snap = playRef.current;
      if (!snap || blockedInput() || snap.propsLeft[kind] <= 0) return;
      setSelected(null);
      setPropTarget(null);
      setPropMode((m) => (m === kind ? null : kind));
      optsRef.current.tone(700, 0.05, "square", 0.04);
    },
    [blockedInput],
  );

  const cancel = useCallback(() => {
    setPropMode(null);
    setPropTarget(null);
    setSelected(null);
  }, []);

  const manualHint = useCallback(() => {
    const snap = playRef.current;
    if (!snap || blockedInput()) return;
    const move = findGoalHint(snap.board, snap.round.stage.goals, snap.progress);
    if (!move) return;
    setHint(move);
    setMessage(CHEER_HINT);
    optsRef.current.tone(1175, 0.12, "triangle", 0.05);
  }, [blockedInput]);

  /** 開新局：清空所有局內狀態並讓上一局的動畫失效。 */
  const start = useCallback(
    (round: CandyMatchRound) => {
      tokenRef.current += 1;
      clearTimers();
      rngRef.current = roundRng(round.index);
      const board = createBoard(round.cols, round.rows, round.stage.pieceKinds, rngRef.current, {
        dirtCells: round.stage.dirtCells,
        dropCount: round.stage.dropCount,
        requireSpecialMove: round.stage.requireSpecialMove,
        avoidBoard: lastBoardsRef.current[round.index],
      });
      lastBoardsRef.current[round.index] = board;
      const snap: CandyPlaySnapshot = {
        round,
        board,
        movesLeft: round.stage.moves,
        progress: freshCandyProgress(round.stage.pieceKinds),
        propsLeft: { ...round.props },
        usedProp: false,
      };
      playRef.current = snap;
      setPlay(snap);
      setBusyState(false);
      setSelected(null);
      setPopping(EMPTY_SET);
      setShaking(EMPTY_SET);
      setPropMode(null);
      setPropTarget(null);
      setOutcomeState(null);
      setMotion(NO_MOTION);
      setCheer(false);
      setMessage(introMessage(round.stage.goals));
      const showSwapTeach = !optsRef.current.tipsSeen.includes("swap");
      setTipState(showSwapTeach ? "swap" : null);
      setTeachMove(
        showSwapTeach
          ? findGoalHint(board, round.stage.goals, snap.progress) ??
            findHintMove(board.pieces, board.cols, board.rows, board.specials)
          : null,
      );
      armIdle();
    },
    [armIdle, clearTimers, setBusyState, setOutcomeState, setTipState],
  );

  /** 離開局內（回地圖／標題）：停掉進行中的動畫與提示計時。 */
  const leave = useCallback(() => {
    tokenRef.current += 1;
    clearTimers();
    setBusyState(false);
    setOutcomeState(null);
  }, [clearTimers, setBusyState, setOutcomeState]);

  const propPreview = useMemo<ReadonlySet<number>>(() => {
    if (!play || !propMode || propTarget == null) return EMPTY_SET;
    return new Set(propAffectedCells(propMode, play.board, propTarget));
  }, [play, propMode, propTarget]);

  const actions = useMemo(
    () => ({
      start,
      leave,
      tapCell,
      attemptSwap,
      hoverCell,
      selectProp,
      cancel,
      manualHint,
      dismissTip,
    }),
    [start, leave, tapCell, attemptSwap, hoverCell, selectProp, cancel, manualHint, dismissTip],
  );

  return {
    play,
    busy,
    selected,
    hint,
    teachMove,
    popping,
    shaking,
    propMode,
    propPreview,
    outcome,
    message,
    tip,
    motion,
    cheer,
    actions,
  };
}
