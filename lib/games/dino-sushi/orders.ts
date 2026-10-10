/**
 * 《多多壽司屋》托盤與點餐。決定性：同一個 seed 產生同一盤料與同一串訂單（視覺測試用 window.__dinoSushiSeed）。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import type { Sushi } from "./sushi";
import {
  BASES,
  baseById,
  SAVORY_TOPPINGS,
  SWEET_TOPPINGS,
  TOPPINGS,
  toppingById,
  type BaseId,
  type ToppingId,
} from "./toppings";

export type Order = {
  readonly base: BaseId;
  readonly toppings: readonly ToppingId[];
};

export type OrderMatch = {
  /** baseOk 且沒有缺料；多放的料不算錯。 */
  ok: boolean;
  baseOk: boolean;
  missing: ToppingId[];
  extra: ToppingId[];
};

export type OrderChecks = {
  base: boolean;
  toppings: { id: ToppingId; done: boolean }[];
};

export const TRAY_SIZE = 8;
const TRAY_SAVORY = 6;
export const ORDERS_PER_ROUND = 5;
/** 每單要幾種料：由飯＋1 料漸增到飯＋3 料。 */
export const ORDER_SIZES: readonly number[] = [1, 1, 2, 2, 3];
/** 訂單 rng 與托盤 rng 錯開，避免兩者取到相同序列。 */
const ORDER_SEED_SALT = 0x9e3779b9;
const MAX_REPICK = 12;

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

const TOPPING_ORDER = new Map(TOPPINGS.map((t, i) => [t.id, i]));

/** 每輪托盤 8 格：6 種家常料＋1 種甜點＋芥末，依食材表順序排（甜點、芥末固定在最後）。 */
export function buildTray(seed: number): ToppingId[] {
  const rng = seededRng(seed);
  const savory = shuffled(SAVORY_TOPPINGS, rng).slice(0, TRAY_SAVORY);
  const sweet = SWEET_TOPPINGS[pickIndex(SWEET_TOPPINGS.length, rng)]!;
  return [...savory.map((t) => t.id), sweet.id, "wasabi" as const].sort(
    (a, b) => TOPPING_ORDER.get(a)! - TOPPING_ORDER.get(b)!,
  );
}

function sameOrder(a: Order | undefined, b: Order): boolean {
  return (
    a !== undefined &&
    a.base === b.base &&
    a.toppings.length === b.toppings.length &&
    a.toppings.every((t) => b.toppings.includes(t))
  );
}

/** 一輪 5 單，只點托盤上的家常料；同一單料不重複，相鄰兩單不一樣。 */
export function buildOrders(seed: number, tray: readonly ToppingId[]): Order[] {
  const rng = seededRng((seed ^ ORDER_SEED_SALT) >>> 0);
  const pool = tray.filter((id) => toppingById(id).kind === "savory");
  const orders: Order[] = [];
  for (const size of ORDER_SIZES) {
    let next: Order;
    let tries = 0;
    do {
      next = {
        base: BASES[pickIndex(BASES.length, rng)]!.id,
        toppings: shuffled(pool, rng).slice(0, size),
      };
      tries += 1;
    } while (sameOrder(orders.at(-1), next) && tries < MAX_REPICK);
    orders.push(next);
  }
  return orders;
}

/** 集合比對、順序無關；重複放同一種料不算多放。 */
export function matchOrder(sushi: Sushi, order: Order): OrderMatch {
  const placed = [...new Set(sushi.toppings)];
  const baseOk = sushi.base === order.base;
  const missing = order.toppings.filter((t) => !placed.includes(t));
  const extra = placed.filter((t) => !order.toppings.includes(t));
  return { ok: baseOk && missing.length === 0, baseOk, missing, extra };
}

/** 泡泡逐項打勾用。 */
export function orderChecks(sushi: Sushi, order: Order): OrderChecks {
  return {
    base: sushi.base === order.base,
    toppings: order.toppings.map((id) => ({ id, done: sushi.toppings.includes(id) })),
  };
}

/** 讀屏宣告：「多多想吃：手捲、玉子、小黃瓜」。 */
export function orderAnnouncement(order: Order): string {
  const parts = [baseById(order.base).label, ...order.toppings.map((t) => toppingById(t).label)];
  return `多多想吃：${parts.join("、")}`;
}
