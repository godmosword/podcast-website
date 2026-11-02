import { sectionAt, sectionStart } from "@/lib/games/orange-express/journey";
import type {
  EventResult,
  RunState,
  ScenicEvent,
  ScenicEventKind,
  ScenicSection,
  SlowZone,
  Station,
} from "@/lib/games/orange-express/types";

/**
 * 沿途事件（大司機的風景段）：每段一件，一件只有一個動作。
 * - 小鴨過鐵軌：提示出現後動力拉到「快」以下（慢或鬆）或拉任何煞車（慢下來）。
 *   不管做到沒，看不到的降速區都讓小橘安靜地輕煞（不響叮叮，那是幫忙不是糾正），小鴨照樣過。
 * - 平交道：柵欄前按喇叭。
 * - 揮手的朋友：經過時按喇叭。
 * - 跟小動物賽跑：提示後推到「快」。
 * 沒做到不扣星，遇到的都算「遇到了」，做到的多一個黃章。這個檔不引 reducer。
 */

export const EVENT_KINDS: readonly ScenicEventKind[] = ["ducks", "crossing", "wave", "race"];

/**
 * 每種事件在一段裡的提示點與事件點（段長的幾分之幾；段長 1.4 時提示到事件約 0.66，巡航約 4.5 秒）。
 * 孩子聽完一句提示（約 2 秒）還有時間找桿子、喇叭；也容得下 0.45 秒作用延遲。
 * 賽跑在出站後的第一段、提示在出站那一刻（車還停著）：孩子從停著推到「快」才像起跑。
 * 提示時已經在「快」也算贏（車已經跑最快，判輸反而矛盾）。
 */
export const EVENT_SPOTS: Record<ScenicEventKind, { hint: number; at: number }> = {
  ducks: { hint: 0.15, at: 0.62 },
  crossing: { hint: 0.15, at: 0.62 },
  wave: { hint: 0.15, at: 0.62 },
  race: { hint: 0, at: 0.75 },
};

/**
 * 小鴨前看不到的降速區：事件點前這麼遠開始，到事件點後一點點，速度旗是 limit。
 * 從巡航自動輕煞到 0.2 約 85 公尺，小鴨開始過鐵軌（事件點前 45 公尺）時已經慢下來，看得到小鴨慢慢走。
 */
export const DUCK_ZONE = { before: 0.24, after: 0.04, limit: 0.2 } as const;

/** 揮手的朋友：經過事件點之後這一小段按喇叭也算（「經過時」）。 */
export const WAVE_AFTER = 0.08;

/** 事件點過後，前窗的回應（小鴨拍翅、朋友跳一下、小動物揮手）再留這麼遠。 */
export const EVENT_SHOW_AFTER = 0.12;

/**
 * 風景段的順序：〔遊樂園前一段、橘子坡前兩段、回家前兩段〕攤平成五格。
 * 賽跑只排在出站後的第一段（第 1、3 格，從停著起跑才像起跑）；不排第 0 格（開局任務卡還在說話）。
 */
const RACE_SLOTS = [1, 3] as const;
const SLOT_COUNT = 5;
const OTHERS: readonly ScenicEventKind[] = ["ducks", "crossing", "wave"];

/** 小小的固定亂數（mulberry32）：同一個種子永遠排出同一趟。 */
function random(seed: number): () => number {
  let a = Math.floor(seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: readonly T[], rand: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function hasRepeat(kinds: readonly ScenicEventKind[]): boolean {
  return kinds.some((kind, i) => i > 0 && kinds[i - 1] === kind);
}

/**
 * 一趟五段的事件排法：四種每種至少一次，賽跑一次、其他三種有一種出現兩次，相鄰兩段不重複。
 */
export function eventPlan(seed: number): ScenicEventKind[] {
  const rand = random(seed);
  const raceSlot = RACE_SLOTS[rand() < 0.5 ? 0 : 1];
  const extra = OTHERS[Math.floor(rand() * OTHERS.length)]!;
  const pool = [...OTHERS, extra];
  let plan: ScenicEventKind[] = [];
  for (let tries = 0; tries < 24; tries += 1) {
    const order = shuffled(pool, rand);
    plan = [];
    for (let slot = 0; slot < SLOT_COUNT; slot += 1) {
      plan.push(slot === raceSlot ? "race" : order.shift()!);
    }
    if (!hasRepeat(plan)) return plan;
  }
  return plan;
}

/** 這一段的事件：提示點與事件點照段長等比例放。 */
export function scenicEvent(kind: ScenicEventKind, length = 1): ScenicEvent {
  const spot = EVENT_SPOTS[kind];
  return { kind, hint: spot.hint * length, at: spot.at * length };
}

/** 小鴨事件前看不到的降速區（站的 progress，風景段是負的）。 */
export function duckZones(station: Pick<Station, "scenic">): SlowZone[] {
  const zones: SlowZone[] = [];
  station.scenic.forEach((section, k) => {
    if (section.event?.kind !== "ducks") return;
    const at = sectionStart(station, k) + section.event.at;
    zones.push({ from: at - DUCK_ZONE.before, to: at + DUCK_ZONE.after, limit: DUCK_ZONE.limit });
  });
  return zones;
}

export function eventKey(stationIndex: number, section: number): string {
  return `${stationIndex}:${section}`;
}

/** 這一段事件的位置換成站的 progress。 */
export type PlacedEvent = {
  key: string;
  kind: ScenicEventKind;
  stationIndex: number;
  section: number;
  hintAt: number;
  at: number;
  /** 做動作算數到這裡（揮手的朋友多一小段）。 */
  until: number;
};

function placed(station: Station, stationIndex: number, k: number, section: ScenicSection): PlacedEvent | null {
  const event = section.event;
  if (!event) return null;
  const start = sectionStart(station, k);
  const at = start + event.at;
  return {
    key: eventKey(stationIndex, k),
    kind: event.kind,
    stationIndex,
    section: k,
    hintAt: start + event.hint,
    at,
    until: event.kind === "wave" ? at + WAVE_AFTER : at,
  };
}

/** 現在這一段的事件（不管提示出現了沒）。站段與沒有事件的段是 null。 */
export function sectionEvent(state: Pick<RunState, "stations" | "stationIndex" | "progress">): PlacedEvent | null {
  const station = state.stations[state.stationIndex];
  if (!station) return null;
  const k = sectionAt(station, state.progress);
  const section = station.scenic[k];
  return section ? placed(station, state.stationIndex, k, section) : null;
}

/** 事件在前窗與提示裡「進行中」：提示出現到回應結束。倒車、停好、開門時不會在風景段，不必另外擋。 */
export function activeEvent(state: Pick<RunState, "stations" | "stationIndex" | "progress">): PlacedEvent | null {
  const event = sectionEvent(state);
  if (!event) return null;
  if (state.progress < event.hintAt || state.progress > event.at + EVENT_SHOW_AFTER) return null;
  return event;
}

/** 提示還掛著（提示點到可以做動作的最後一刻），還沒結算。 */
export function eventPending(state: RunState): PlacedEvent | null {
  const event = activeEvent(state);
  if (!event || state.events[event.key] || state.progress > event.until) return null;
  return event;
}

function withResult(state: RunState, key: string, result: EventResult): RunState["events"] {
  return { ...state.events, [key]: result };
}

/** 這一刻的桿位算不算做到（喇叭另外在 honkEvent 算）。 */
function leversDo(kind: ScenicEventKind, state: Pick<RunState, "power" | "brake" | "course">, powerMax: number): boolean {
  // 「慢下來」：桿子上寫著「慢」，拉到慢也算（不只鬆）。
  if (kind === "ducks") return state.power < powerMax || state.brake > 0;
  if (kind === "race") return state.power === powerMax && state.brake === 0;
  return false;
}

/**
 * 每一幀走完之後結算這一段的事件：提示出現後桿位做到了就記「做到」；開過可以做動作的最後一刻還沒做到就記「遇到」。
 * 回傳新的 events（沒變就回傳同一個物件）與這一幀是不是剛做到小鴨（提前慢下來的計數）。
 */
export function judgeEvents(state: RunState, powerMax: number): { events: RunState["events"]; duckDone: boolean } {
  const event = sectionEvent(state);
  if (!event || state.events[event.key]) return { events: state.events, duckDone: false };
  if (state.progress < event.hintAt) return { events: state.events, duckDone: false };
  if (state.progress <= event.until && leversDo(event.kind, state, powerMax)) {
    return { events: withResult(state, event.key, "done"), duckDone: event.kind === "ducks" };
  }
  if (state.progress > event.until) return { events: withResult(state, event.key, "met"), duckDone: false };
  return { events: state.events, duckDone: false };
}

/** 平交道、揮手的朋友：提示出現後到可以做動作的最後一刻按喇叭，記「做到」。其他時候回傳 null。 */
export function honkEvent(state: RunState): RunState | null {
  const event = eventPending(state);
  if (!event || (event.kind !== "crossing" && event.kind !== "wave")) return null;
  return { ...state, events: withResult(state, event.key, "done") };
}

/**
 * 小鴨那一段：降速區裡小橘輕輕煞車，不管做到沒都不響「叮叮」、不算自動輕煞（那是幫小鴨，不是糾正孩子）。
 * 做到的回饋另外是輕鈴＋小橘開心；沒做到只是安靜地慢下來。
 */
export function quietSlow(state: RunState): boolean {
  return sectionEvent(state)?.kind === "ducks";
}

/** 提示掛著時要強調駕駛台上的哪一個東西：喇叭、動力的「慢」格或「快」格。 */
export type EventCue = "horn" | "slow" | "fast";

export function eventCue(state: RunState): EventCue | null {
  const event = eventPending(state);
  if (!event) return null;
  if (event.kind === "crossing" || event.kind === "wave") return "horn";
  return event.kind === "ducks" ? "slow" : "fast";
}

/** 依路線順序列出這一趟所有的事件（結算的事件章列用）。 */
export function routeEvents(stations: readonly Station[]): PlacedEvent[] {
  return stations.flatMap((station, stationIndex) =>
    station.scenic.flatMap((section, k) => {
      const event = placed(station, stationIndex, k, section);
      return event ? [event] : [];
    }),
  );
}

/** 跳站／跳段時清掉目的地這一段（含）以後的結果；之前的留著。 */
export function eventsBefore(events: RunState["events"], stationIndex: number, section: number): RunState["events"] {
  const kept = Object.entries(events).filter(([key]) => {
    const [s, k] = key.split(":").map(Number);
    return s! < stationIndex || (s === stationIndex && k! < section);
  });
  return kept.length === Object.keys(events).length ? events : Object.fromEntries(kept);
}

/**
 * 這一次狀態轉換要不要響鈴、讓小橘開心：沿途事件多做到一件是 event（小鴨同時加 earlySlows 也只算 event），
 * 否則提前慢下來多一次是 early-slow。開新一趟、跳段讓數字變少都不算。
 * 畫面在每一次 apply 比較前後（不只每幀的 tick）：喇叭做到的平交道、揮手是在按下去那一刻寫入的。
 */
export function cheerFor(
  prev: Pick<RunState, "events" | "earlySlows">,
  next: Pick<RunState, "events" | "earlySlows">,
): "event" | "early-slow" | null {
  if (doneCount(next.events) > doneCount(prev.events)) return "event";
  if (next.earlySlows > prev.earlySlows) return "early-slow";
  return null;
}

/** 做到了幾件（畫面響鈴、小橘開心用）。 */
export function doneCount(events: RunState["events"]): number {
  return Object.values(events).filter((result) => result === "done").length;
}
