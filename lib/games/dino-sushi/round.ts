/**
 * 《多多壽司屋》一輪的狀態機（useReducer 用）。純函數；無效動作回傳同一個 state，
 * View 以 `next === prev` 判斷要不要給「輕晃」回饋。反應播放中（pending）鎖輸入。
 */

import { buildOrders, buildTray, type Order } from "./orders";
import { favoriteFor, reactionFor, type Mood, type Reaction } from "./reactions";
import { addTopping, changeBase, EMPTY_SUSHI, isServable, removeTopping, type Sushi } from "./sushi";
import type { BaseId, ToppingId } from "./toppings";

export type Mode = "order" | "free";

export type Plate = { sushi: Sushi; gold: boolean; mood: Mood };

export type RoundState = {
  mode: Mode;
  seed: number;
  tray: readonly ToppingId[];
  orders: readonly Order[];
  /** 目前第幾單（點餐模式）。 */
  index: number;
  sushi: Sushi;
  /** 這一單已送出幾次（缺料被退回也算）。 */
  attempts: number;
  plates: readonly Plate[];
  firstTries: readonly boolean[];
  favorite: ToppingId;
  pending: Reaction | null;
  /** 正在播的這一盤是不是一次做對。 */
  pendingFirstTry: boolean;
  /** 吃到甜點後可以刷牙：反應播完仍保留，直到刷過或下一盤送出。 */
  brushReady: boolean;
  brushUsed: boolean;
  done: boolean;
};

export type RoundAction =
  | { type: "pick-base"; base: BaseId }
  | { type: "add"; id: ToppingId }
  | { type: "remove"; slot: number }
  | { type: "serve" }
  | { type: "reaction-done" }
  | { type: "brush" }
  | { type: "finish" };

export function createRound(mode: Mode, seed: number): RoundState {
  const tray = buildTray(seed);
  return {
    mode,
    seed,
    tray,
    orders: mode === "order" ? buildOrders(seed, tray) : [],
    index: 0,
    sushi: EMPTY_SUSHI,
    attempts: 0,
    plates: [],
    firstTries: [],
    favorite: favoriteFor(seed),
    pending: null,
    pendingFirstTry: false,
    brushReady: false,
    brushUsed: false,
    done: false,
  };
}

export function currentOrder(state: RoundState): Order | null {
  return state.mode === "order" ? (state.orders[state.index] ?? null) : null;
}

function withSushi(state: RoundState, sushi: Sushi): RoundState {
  return sushi === state.sushi ? state : { ...state, sushi };
}

function serve(state: RoundState): RoundState {
  if (!isServable(state.sushi)) return state;
  const order = currentOrder(state);
  const firstTry = state.attempts === 0;
  const reaction = order
    ? reactionFor(state.sushi, { order, firstTry })
    : reactionFor(state.sushi, { favorite: state.favorite });
  return {
    ...state,
    attempts: state.attempts + 1,
    pending: { ...reaction, brush: reaction.brush && !state.brushUsed },
    brushReady: false,
    pendingFirstTry: firstTry,
  };
}

function reactionDone(state: RoundState): RoundState {
  const { pending } = state;
  if (!pending) return state;
  if (!pending.eats) return { ...state, pending: null, brushReady: false };
  const isOrder = state.mode === "order";
  const gold = isOrder && state.pendingFirstTry;
  const index = isOrder ? state.index + 1 : state.index;
  return {
    ...state,
    pending: null,
    brushReady: pending.brush,
    sushi: EMPTY_SUSHI,
    attempts: 0,
    plates: [...state.plates, { sushi: state.sushi, gold, mood: pending.mood }],
    firstTries: isOrder ? [...state.firstTries, state.pendingFirstTry] : state.firstTries,
    index,
    done: isOrder && index >= state.orders.length,
  };
}

export function roundReducer(state: RoundState, action: RoundAction): RoundState {
  if (state.done) return state;
  switch (action.type) {
    case "reaction-done":
      return reactionDone(state);
    case "brush":
      if (state.brushUsed || !(state.pending?.brush || state.brushReady)) return state;
      return {
        ...state,
        brushUsed: true,
        brushReady: false,
        pending: state.pending ? { ...state.pending, brush: false } : null,
      };
    default:
      break;
  }
  if (state.pending) return state;
  switch (action.type) {
    case "pick-base":
      return withSushi(state, changeBase(state.sushi, action.base));
    case "add":
      if (!state.tray.includes(action.id)) return state;
      return withSushi(state, addTopping(state.sushi, action.id));
    case "remove":
      return withSushi(state, removeTopping(state.sushi, action.slot));
    case "serve":
      return serve(state);
    case "finish":
      return state.mode === "free" ? { ...state, done: true } : state;
    default:
      return state;
  }
}
