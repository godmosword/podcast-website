"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { GameAudioBus } from "@/lib/gamekit/adapter";
import { orderAnnouncement } from "@/lib/games/dino-sushi/orders";
import type { Reaction } from "@/lib/games/dino-sushi/reactions";
import {
  createRound,
  currentOrder,
  roundReducer,
  type Mode,
  type RoundAction,
  type RoundState,
} from "@/lib/games/dino-sushi/round";
import { MAX_TOPPINGS } from "@/lib/games/dino-sushi/sushi";
import type { BaseId, ToppingId } from "@/lib/games/dino-sushi/toppings";

/** 送出後的動畫段：盤子滑過去 → 張嘴 → 咀嚼 → 表情＋字卡。 */
export type ServePhase = "idle" | "slide" | "open" | "chew" | "react";

export type HintTarget =
  | { kind: "base"; id: BaseId }
  | { kind: "topping"; id: ToppingId }
  /** 料位滿了還缺料：先拿掉這一格（不在單上或重複的那層）。 */
  | { kind: "remove"; slot: number }
  | { kind: "serve" };

type Timeline = { slide: number; open: number; chew: number; react: number; done: number };

/**
 * 送出到反應 ≤1.6 秒（react），減少動態時 ≤0.6 秒；反應後再讓字卡留約 1 秒才出下一單，期間鎖輸入。
 * 點餐模式下一單泡泡出現時就收掉字卡，免得上一句像在評論新的一單。
 */
const EAT_TIMELINE: Timeline = { slide: 0, open: 450, chew: 700, react: 1150, done: 2150 };
const EAT_TIMELINE_REDUCED: Timeline = { slide: 0, open: 0, chew: 150, react: 300, done: 1100 };
const LOOK_DONE_MS = 1200;
const LOOK_DONE_MS_REDUCED = 600;
/** 字卡在反應結束後再留一下，孩子才看得到。 */
const CAPTION_LINGER_MS = 1800;
const BRUSH_MS = 1400;
/** 閒置這麼久才亮下一個要點的東西。 */
export const IDLE_HINT_MS = 8000;

type Note = readonly [freq: number, dur: number, type?: OscillatorType, vol?: number];

const SFX: Record<string, readonly Note[]> = {
  add: [[660, 0.06, "triangle", 0.05]],
  base: [[523, 0.07, "triangle", 0.05]],
  remove: [[440, 0.06, "triangle", 0.04]],
  serve: [[523, 0.07, "triangle", 0.05], [659, 0.07, "triangle", 0.05]],
  yum: [[523, 0.1, "triangle", 0.06], [659, 0.1, "triangle", 0.06], [784, 0.14, "triangle", 0.06]],
  love: [[523, 0.09, "triangle", 0.06], [659, 0.09, "triangle", 0.06], [784, 0.09, "triangle", 0.06], [1047, 0.2, "triangle", 0.06]],
  sweet: [[784, 0.08, "sine", 0.06], [880, 0.08, "sine", 0.06], [784, 0.12, "sine", 0.06]],
  puff: [[180, 0.12, "square", 0.03], [330, 0.1, "triangle", 0.05], [392, 0.12, "triangle", 0.05]],
  look: [[659, 0.1, "sine", 0.05], [587, 0.14, "sine", 0.05]],
  brush: [[880, 0.05, "triangle", 0.04], [988, 0.05, "triangle", 0.04], [880, 0.05, "triangle", 0.04], [1175, 0.12, "triangle", 0.05]],
};
const NOTE_GAP_MS = 90;

type PlayAction = { type: "init"; mode: Mode; seed: number } | { type: "clear" } | RoundAction;

/** 排程中的一步；暫停時 due 改存「剩幾毫秒」。 */
type Scheduled = { due: number; fn: () => void };

function playReducer(state: RoundState | null, action: PlayAction): RoundState | null {
  if (action.type === "init") return createRound(action.mode, action.seed);
  if (action.type === "clear") return null;
  return state ? roundReducer(state, action) : state;
}

function nextSeed(): number {
  const fixed = typeof window !== "undefined" ? (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed : undefined;
  return typeof fixed === "number" && Number.isFinite(fixed) ? fixed : Math.floor(Math.random() * 0x7fffffff);
}

/** 點餐模式下一個該點的東西：飯型 → 缺的料（料位滿了先拿掉多的那層）→ 送出。 */
export function hintTarget(round: RoundState): HintTarget | null {
  const order = currentOrder(round);
  if (!order || round.pending) return null;
  if (round.sushi.base !== order.base) return { kind: "base", id: order.base };
  const placed = round.sushi.toppings;
  const missing = order.toppings.find((t) => !placed.includes(t));
  if (!missing) return { kind: "serve" };
  if (placed.length < MAX_TOPPINGS) return { kind: "topping", id: missing };
  const extra = placed.findIndex((t, i) => !order.toppings.includes(t) || placed.indexOf(t) !== i);
  return { kind: "remove", slot: Math.max(0, extra) };
}

type Options = {
  audio?: GameAudioBus;
  reducedMotion: boolean;
  inputPaused: boolean;
  onServed: (round: RoundState) => void;
  onDone: (round: RoundState) => void;
};

export function useDinoSushiPlay({ audio, reducedMotion, inputPaused, onServed, onDone }: Options) {
  const [round, dispatch] = useReducer(playReducer, null);
  const [phase, setPhase] = useState<ServePhase>("idle");
  const [caption, setCaption] = useState<Reaction | null>(null);
  const [choosingBase, setChoosingBase] = useState(false);
  const [shake, setShake] = useState(0);
  const [brushing, setBrushing] = useState(false);
  const [idle, setIdle] = useState(false);
  const [taught, setTaught] = useState(false);
  const [message, setMessage] = useState("");
  /** 可暫停的排程：暫停時記下剩餘時間、停掉計時器，繼續時再補排（暫停中不會結算或回報）。 */
  const timers = useRef<Map<number, Scheduled>>(new Map());
  const parked = useRef<Scheduled[]>([]);
  const idleTimer = useRef<number | null>(null);

  const schedule = useCallback((ms: number, fn: () => void) => {
    const entry: Scheduled = { due: Date.now() + ms, fn };
    const id = window.setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.set(id, entry);
  }, []);

  const later = schedule;

  const clearTimers = useCallback(() => {
    for (const id of timers.current.keys()) window.clearTimeout(id);
    timers.current.clear();
    parked.current = [];
  }, []);

  useEffect(() => {
    if (inputPaused) {
      const now = Date.now();
      for (const [id, entry] of timers.current) {
        window.clearTimeout(id);
        parked.current.push({ due: entry.due - now, fn: entry.fn });
      }
      timers.current.clear();
      if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
      return;
    }
    const resume = parked.current;
    parked.current = [];
    for (const entry of resume) schedule(Math.max(0, entry.due), entry.fn);
  }, [inputPaused, schedule]);

  useEffect(() => () => {
    clearTimers();
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
  }, [clearTimers]);

  const sfx = useCallback(
    (key: string) => {
      const notes = SFX[key];
      if (!audio || !notes) return;
      notes.forEach(([freq, dur, type, vol], i) => {
        if (i === 0) audio.tone(freq, dur, type, vol);
        else schedule(i * NOTE_GAP_MS, () => audio.tone(freq, dur, type, vol));
      });
    },
    [audio, schedule],
  );

  /** 任何操作都重算閒置提示。 */
  const touch = useCallback(() => {
    setIdle(false);
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => setIdle(true), IDLE_HINT_MS);
  }, []);

  const start = useCallback(
    (mode: Mode) => {
      clearTimers();
      setPhase("idle");
      setCaption(null);
      setChoosingBase(false);
      setBrushing(false);
      dispatch({ type: "init", mode, seed: nextSeed() });
      touch();
    },
    [clearTimers, touch],
  );

  const leave = useCallback(() => {
    clearTimers();
    setPhase("idle");
    setCaption(null);
    dispatch({ type: "clear" });
  }, [clearTimers]);

  const locked = inputPaused || !round || round.pending !== null || round.done;

  const pickBase = useCallback(
    (base: BaseId) => {
      if (locked) return;
      audio?.ensureAudio();
      dispatch({ type: "pick-base", base });
      setChoosingBase(false);
      sfx("base");
      touch();
    },
    [audio, locked, sfx, touch],
  );

  const add = useCallback(
    (id: ToppingId) => {
      if (locked || !round) return;
      const next = roundReducer(round, { type: "add", id });
      // 第 4 料：料位輕晃，不出錯音
      if (next === round) setShake((n) => n + 1);
      else sfx("add");
      dispatch({ type: "add", id });
      touch();
    },
    [locked, round, sfx, touch],
  );

  const remove = useCallback(
    (slot: number) => {
      if (locked) return;
      dispatch({ type: "remove", slot });
      sfx("remove");
      touch();
    },
    [locked, sfx, touch],
  );

  const serve = useCallback(() => {
    if (locked || !round) return;
    const next = roundReducer(round, { type: "serve" });
    if (next === round || !next.pending) {
      setShake((n) => n + 1);
      return;
    }
    const reaction = next.pending;
    dispatch({ type: "serve" });
    setChoosingBase(false);
    setCaption(null);
    setBrushing(false);
    clearTimers();
    touch();
    if (!reaction.eats) {
      setPhase("react");
      setCaption(reaction);
      setMessage(reaction.line);
      sfx("look");
      later(reducedMotion ? LOOK_DONE_MS_REDUCED : LOOK_DONE_MS, () => {
        setPhase("idle");
        dispatch({ type: "reaction-done" });
        // 看完泡泡：馬上亮缺的那一格，不用等閒置 8 秒
        setIdle(true);
      });
      return;
    }
    const t = reducedMotion ? EAT_TIMELINE_REDUCED : EAT_TIMELINE;
    sfx("serve");
    setPhase("slide");
    later(t.open, () => setPhase("open"));
    later(t.chew, () => setPhase("chew"));
    later(t.react, () => {
      setPhase("react");
      setCaption(reaction);
      setMessage(reaction.line);
      sfx(reaction.sfx);
    });
    later(t.done, () => {
      setPhase("idle");
      dispatch({ type: "reaction-done" });
      // 點餐：下一單泡泡出現就收字卡；自由做沒有泡泡，字卡多留一下
      if (round.mode === "order") setCaption((c) => (c === reaction ? null : c));
    });
    later(t.done + CAPTION_LINGER_MS, () => setCaption((c) => (c === reaction ? null : c)));
  }, [clearTimers, later, locked, reducedMotion, round, sfx, touch]);

  const brush = useCallback(() => {
    if (inputPaused || !round || round.brushUsed) return;
    dispatch({ type: "brush" });
    setBrushing(true);
    sfx("brush");
    setMessage("刷刷牙，牙齒亮晶晶！");
    later(reducedMotion ? BRUSH_MS / 2 : BRUSH_MS, () => setBrushing(false));
  }, [inputPaused, later, reducedMotion, round, sfx]);

  const finish = useCallback(() => {
    if (locked) return;
    dispatch({ type: "finish" });
  }, [locked]);

  const reopenBase = useCallback(() => {
    if (locked) return;
    setChoosingBase(true);
    touch();
  }, [locked, touch]);

  // 狀態轉換的副作用：新訂單宣告、盤子落下回報、整輪結束
  const prev = useRef<RoundState | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = round;
    if (!round) return;
    const isNewRound = !before || before.seed !== round.seed || before.mode !== round.mode;
    if (round.plates.length > (isNewRound ? 0 : before.plates.length)) {
      onServed(round);
      if (round.mode === "order" && round.firstTries.length > 0) setTaught(true);
    }
    if (round.done && !(before?.done && !isNewRound)) {
      onDone(round);
      return;
    }
    const order = currentOrder(round);
    if (order && (isNewRound || before.index !== round.index)) {
      setMessage(orderAnnouncement(order));
    } else if (isNewRound && round.mode === "free") {
      setMessage("自由做：想放什麼料都可以");
    }
  }, [onDone, onServed, round]);

  const hint = round && !round.done && (!taught || idle) ? hintTarget(round) : null;

  return {
    round,
    phase,
    caption,
    choosingBase: choosingBase || (round !== null && round.sushi.base === null),
    shake,
    brushing,
    message,
    hint,
    /** 首單手指示範（做對第一單才收起）；之後只在閒置時亮。 */
    teaching: !taught,
    locked,
    actions: { start, leave, pickBase, add, remove, serve, brush, finish, reopenBase },
  };
}

export type DinoSushiPlay = ReturnType<typeof useDinoSushiPlay>;
