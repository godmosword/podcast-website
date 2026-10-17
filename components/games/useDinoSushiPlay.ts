"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import type { GameAudioBus } from "@/lib/gamekit/adapter";
import type { SynthVoice } from "@/lib/gamekit/runtime/audio";
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
import { BASE_IDLE_HINT_MS, idleHintMs, teachesFirstOrder, type OrderTier } from "@/lib/games/dino-sushi/difficulty";
import { addSfx, evictThenPop, MOOD_SFX, plateSfx, SUSHI_SFX, varied } from "@/lib/games/dino-sushi/sfx";
import { MAX_TOPPINGS } from "@/lib/games/dino-sushi/sushi";
import { toppingById, type BaseId, type ToppingId } from "@/lib/games/dino-sushi/toppings";
import { DOME_AFTER_PLATES, DOME_SPEECH, readRoundSeed, roundVariety } from "@/lib/games/dino-sushi/variety";

/** 送出後的動畫段：盤子滑過去 → 張嘴 → 咀嚼 → 表情＋字卡。 */
export type ServePhase = "idle" | "slide" | "open" | "chew" | "react";

export type HintTarget =
  | { kind: "base"; id: BaseId }
  | { kind: "topping"; id: ToppingId }
  /** 料位滿了還缺料、最舊那層又是單上要的：先拿掉這一格（不在單上或重複的那層），免得新料把要的擠掉。 */
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
/** 閒置這麼久才亮下一個要點的東西（約 4.5 秒；進階檔 7 秒，見 difficulty）。新訂單出現時重新起算，不是從按「給多多吃」那一刻算。 */
export const IDLE_HINT_MS = BASE_IDLE_HINT_MS;

type PlayAction = { type: "init"; mode: Mode; seed: number; tier: OrderTier } | { type: "clear" } | RoundAction;

/** 排程中的一步；暫停時 due 改存「剩幾毫秒」。 */
type Scheduled = { due: number; fn: () => void };

function playReducer(state: RoundState | null, action: PlayAction): RoundState | null {
  if (action.type === "init") return createRound(action.mode, action.seed, action.tier);
  if (action.type === "clear") return null;
  return state ? roundReducer(state, action) : state;
}

/** 播一組合成音；audio bus 沒有 voices（只有 tone）時退回只播第一個振盪器音。 */
export function playVoices(audio: GameAudioBus | undefined, voices: readonly SynthVoice[]): void {
  if (!audio) return;
  if (audio.voices) {
    audio.voices(voices);
    return;
  }
  const first = voices.find((v) => v.wave !== "noise");
  if (first && first.wave !== "noise") audio.tone(first.freq ?? 440, first.dur, first.wave, first.vol);
}

function nextSeed(): number {
  return readRoundSeed();
}

/**
 * 這一點是不是偏離了訂單的下一步。
 * 偏了也不算錯：料還是放得上去，只是立刻亮出正確的下一格，不另出「錯了」字卡。
 * 訂單裡還沒放的另一樣料仍算往前。芥末、甜點是彩蛋（多放也不算錯），放了不算偏；
 * 但料位滿了會擠掉最舊那層，擠掉的是單上要的（不管放的是什麼）就算退一步。
 */
export function isOffStep(
  round: RoundState,
  action: { type: "pick-base"; base: BaseId } | { type: "add"; id: ToppingId },
): boolean {
  const order = currentOrder(round);
  if (!order || round.pending || round.done) return false;
  if (action.type === "pick-base") return action.base !== order.base;
  if (evictsWanted(round.sushi.toppings, order.toppings)) return true;
  if (isTreat(action.id)) return false;
  if (round.sushi.base !== order.base) return true;
  const placed = round.sushi.toppings;
  return !order.toppings.includes(action.id) || placed.includes(action.id);
}

/** 芥末、甜點：多多的彩蛋反應，不在訂單裡。 */
function isTreat(id: ToppingId): boolean {
  return toppingById(id).kind !== "savory";
}

/** 料位滿了再放會擠掉最舊那層：那層是單上要的、而且後面沒有重複的，擠掉就變成缺料。 */
function evictsWanted(placed: readonly ToppingId[], wanted: readonly ToppingId[]): boolean {
  if (placed.length < MAX_TOPPINGS) return false;
  const oldest = placed[0]!;
  return wanted.includes(oldest) && placed.indexOf(oldest, 1) === -1;
}

/**
 * 點餐模式下一個該點的東西：飯型 → 缺的料 → 送出。
 * 料位滿了還缺料：最舊那層本來就是多的，直接點缺的料就會把它擠掉；不然先拿掉多的那層。
 */
export function hintTarget(round: RoundState): HintTarget | null {
  const order = currentOrder(round);
  if (!order || round.pending) return null;
  if (round.sushi.base !== order.base) return { kind: "base", id: order.base };
  const placed = round.sushi.toppings;
  const missing = order.toppings.find((t) => !placed.includes(t));
  if (!missing) return { kind: "serve" };
  if (!evictsWanted(placed, order.toppings)) return { kind: "topping", id: missing };
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
  /** 點偏了：不用等閒置，馬上亮下一步。 */
  const [guide, setGuide] = useState(false);
  const [taught, setTaught] = useState(false);
  const [message, setMessage] = useState("");
  /** 可暫停的排程：暫停時記下剩餘時間、停掉計時器，繼續時再補排（暫停中不會結算或回報）。 */
  const timers = useRef<Map<number, Scheduled>>(new Map());
  const parked = useRef<Scheduled[]>([]);
  const idleTimer = useRef<number | null>(null);
  /** 這一輪閒置多久才亮提示（跟著難度檔位）。 */
  const idleMs = useRef(IDLE_HINT_MS);
  /** 暫停時閒置計時正在跑：繼續時重新起算（不然暫停過的那一單再也不會亮提示）。 */
  const idleParked = useRef(false);

  const armIdle = useCallback(() => {
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      idleTimer.current = null;
      setIdle(true);
    }, idleMs.current);
  }, []);

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
      if (idleTimer.current !== null) {
        window.clearTimeout(idleTimer.current);
        idleTimer.current = null;
        idleParked.current = true;
      }
      return;
    }
    const resume = parked.current;
    parked.current = [];
    for (const entry of resume) schedule(Math.max(0, entry.due), entry.fn);
    if (idleParked.current) {
      idleParked.current = false;
      armIdle();
    }
  }, [armIdle, inputPaused, schedule]);

  useEffect(() => () => {
    clearTimers();
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
  }, [clearTimers]);

  const sfx = useCallback((voices: readonly SynthVoice[]) => playVoices(audio, voices), [audio]);

  /** 做對一步：先把提示收起來，閒置後再亮下一步。 */
  const touch = useCallback(() => {
    setIdle(false);
    setGuide(false);
    armIdle();
  }, [armIdle]);

  /** 點到不是訂單要的飯或料：立刻只亮正確的下一格。 */
  const showHint = useCallback(() => {
    setGuide(true);
    armIdle();
  }, [armIdle]);

  /** tier：難度檔位（只影響點餐的料數、提示等待與首單教學）；自由做傳什麼都一樣。 */
  const start = useCallback(
    (mode: Mode, seed?: number, tier: OrderTier = "normal") => {
      clearTimers();
      /* 難度只管點餐；自由做一律照一般檔 */
      const applied: OrderTier = mode === "order" ? tier : "normal";
      idleMs.current = idleHintMs(applied);
      if (!teachesFirstOrder(applied)) setTaught(true);
      setPhase("idle");
      setCaption(null);
      setChoosingBase(false);
      setBrushing(false);
      dispatch({ type: "init", mode, seed: seed ?? nextSeed(), tier: applied });
      touch();
    },
    [clearTimers, touch],
  );

  const leave = useCallback(() => {
    clearTimers();
    if (idleTimer.current !== null) window.clearTimeout(idleTimer.current);
    idleTimer.current = null;
    idleParked.current = false;
    setPhase("idle");
    setCaption(null);
    setGuide(false);
    setIdle(false);
    dispatch({ type: "clear" });
  }, [clearTimers]);

  const locked = inputPaused || !round || round.pending !== null || round.done;

  /** 等選飯時點了托盤：讀屏念一次「先選飯」（每次等選飯只念一次，選了飯才重來）。 */
  const remindedBase = useRef(false);
  const remindBase = useCallback((): boolean => {
    if (remindedBase.current) return false;
    remindedBase.current = true;
    setMessage("先選飯，再放料");
    return true;
  }, []);

  /** landInMs：飯飛到砧板要多久（選飯過場）；「咚」等落地才響，沒有過場就立刻響。 */
  const pickBase = useCallback(
    (base: BaseId, landInMs = 0) => {
      if (locked || !round) return;
      audio?.ensureAudio();
      const off = isOffStep(round, { type: "pick-base", base });
      dispatch({ type: "pick-base", base });
      setChoosingBase(false);
      remindedBase.current = false;
      if (landInMs > 0) later(landInMs, () => sfx(SUSHI_SFX.base));
      else sfx(SUSHI_SFX.base);
      if (off) showHint();
      else touch();
    },
    [audio, later, locked, round, sfx, showHint, touch],
  );

  const add = useCallback(
    (id: ToppingId) => {
      if (locked || !round) return;
      const next = roundReducer(round, { type: "add", id });
      // 放不上去（還沒選飯）：料位輕晃，不出錯音。料位滿了不算：會擠掉最舊那層
      if (next === round) {
        setShake((n) => n + 1);
        return;
      }
      const pop = varied(addSfx(next.sushi.toppings.length));
      sfx(round.sushi.toppings.length >= MAX_TOPPINGS ? evictThenPop(pop) : pop);
      dispatch({ type: "add", id });
      if (isOffStep(round, { type: "add", id })) showHint();
      else if (currentOrder(round) && isTreat(id)) {
        // 彩蛋：孩子在玩，閒置重新起算；點偏留下的光暈照留（該補的還沒補）
        setIdle(false);
        armIdle();
      } else touch();
    },
    [armIdle, locked, round, sfx, showHint, touch],
  );

  const remove = useCallback(
    (slot: number) => {
      if (locked) return;
      dispatch({ type: "remove", slot });
      sfx(SUSHI_SFX.remove);
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
      sfx(MOOD_SFX.look);
      later(reducedMotion ? LOOK_DONE_MS_REDUCED : LOOK_DONE_MS, () => {
        setPhase("idle");
        dispatch({ type: "reaction-done" });
        // 看完泡泡：馬上亮缺的那一格，不用等閒置
        setGuide(true);
        setIdle(true);
      });
      return;
    }
    const t = reducedMotion ? EAT_TIMELINE_REDUCED : EAT_TIMELINE;
    sfx(SUSHI_SFX.serve);
    setPhase("slide");
    later(t.open, () => setPhase("open"));
    later(t.chew, () => {
      setPhase("chew");
      // 減少動態時咀嚼只有 150ms，嚼嚼聲會跟反應音疊在一起，直接跳過
      if (!reducedMotion) sfx(varied(SUSHI_SFX.chomp));
    });
    later(t.react, () => {
      setPhase("react");
      setCaption(reaction);
      setMessage(reaction.line);
      sfx(MOOD_SFX[reaction.sfx]);
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
    sfx(SUSHI_SFX.brush);
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
    sfx(SUSHI_SFX.tap);
    touch();
  }, [locked, sfx, touch]);

  // 狀態轉換的副作用：新訂單宣告、盤子落下回報、整輪結束
  const prev = useRef<RoundState | null>(null);
  useEffect(() => {
    const before = prev.current;
    prev.current = round;
    if (!round) return;
    const isNewRound = !before || before.seed !== round.seed || before.mode !== round.mode;
    const finished = round.done && !(before?.done && !isNewRound);
    if (round.plates.length > (isNewRound ? 0 : before.plates.length)) {
      // 最後一盤疊上去時結算音接手，不疊兩個聲音
      if (!finished) sfx(varied(plateSfx(round.plates.at(-1)?.gold === true)));
      onServed(round);
      if (round.mode === "order" && round.firstTries.length > 0) setTaught(true);
    }
    if (finished) {
      sfx(SUSHI_SFX.fanfare);
      onDone(round);
      return;
    }
    const order = currentOrder(round);
    if (order && (isNewRound || before.index !== round.index)) {
      // 第一單跟「歡迎光臨」同時出現，不疊兩個聲音
      if (!isNewRound) sfx(SUSHI_SFX.order);
      const themeLead = round.index === 0 ? `${roundVariety(round.seed).theme.label}。` : "";
      const domeLead =
        round.mode === "order" &&
        round.plates.length >= DOME_AFTER_PLATES &&
        (before?.plates.length ?? 0) < DOME_AFTER_PLATES
          ? DOME_SPEECH
          : "";
      setMessage(`${domeLead}${themeLead}${orderAnnouncement(order)}`);
      // 閒置提示從新訂單出現才起算：孩子要先看泡泡、聽完訂單
      setIdle(false);
      armIdle();
    } else if (isNewRound && round.mode === "free") {
      setMessage("自由做：想放什麼料都可以");
    }
  }, [armIdle, onDone, onServed, round, sfx]);

  const hint = round && !round.done && (!taught || idle || guide) ? hintTarget(round) : null;

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
    actions: { start, leave, pickBase, add, remove, serve, brush, finish, reopenBase, remindBase },
  };
}

export type DinoSushiPlay = ReturnType<typeof useDinoSushiPlay>;
