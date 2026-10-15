/**
 * 《多多壽司屋》托盤與點餐。決定性：同一個 seed 產生同一盤料與同一串訂單（視覺測試用 window.__dinoSushiSeed）。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { customerById, customersForRound, type CustomerId } from "./customers";
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
  /** 這單是誰點的。客人只點餐，吃的仍是多多。 */
  readonly customerId: CustomerId;
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
/** 客人最愛用另一條亂數，才不會改掉飯型（視覺測試的 seed 7 仍要有手捲）。 */
const PREFERENCE_SALT = 0xc2b2ae35;
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

/** 先放客人愛的家常料（要在這輪托盤上），不夠再補別的。甜點與芥末不在池裡。 */
export function chooseToppings(
  favorites: readonly ToppingId[],
  pool: readonly ToppingId[],
  size: number,
  rng: () => number,
): ToppingId[] {
  const fav = favorites.filter((id) => pool.includes(id));
  const rest = pool.filter((id) => !fav.includes(id));
  return shuffled([...shuffled(fav, rng), ...shuffled(rest, rng)].slice(0, size), rng);
}

function sameFood(prev: Order | undefined, base: BaseId, toppings: readonly ToppingId[]): boolean {
  return (
    prev !== undefined &&
    prev.base === base &&
    prev.toppings.length === toppings.length &&
    prev.toppings.every((id) => toppings.includes(id))
  );
}

/**
 * 一輪 5 單，只點托盤上的家常料；同一單料不重複，相鄰兩單不一樣。
 * 飯型沿用原本的亂數（難度與 seed 7 的手捲不變），料改成那位客人的最愛。
 */
export function buildOrders(seed: number, tray: readonly ToppingId[]): Order[] {
  const rng = seededRng((seed ^ ORDER_SEED_SALT) >>> 0);
  const pool = tray.filter((id) => toppingById(id).kind === "savory");
  const seats = customersForRound(seed);
  const drafted: Order[] = [];
  for (let index = 0; index < ORDER_SIZES.length; index++) {
    const size = ORDER_SIZES[index]!;
    const customerId = seats[index]!;
    let next: Order;
    let tries = 0;
    do {
      next = {
        base: BASES[pickIndex(BASES.length, rng)]!.id,
        toppings: shuffled(pool, rng).slice(0, size),
        customerId,
      };
      tries += 1;
    } while (sameOrder(drafted.at(-1), next) && tries < MAX_REPICK);
    drafted.push(next);
  }

  const prefRng = seededRng((seed ^ PREFERENCE_SALT) >>> 0);
  const orders: Order[] = [];
  for (const draft of drafted) {
    const favorites = customerById(draft.customerId).favorites;
    let toppings = chooseToppings(favorites, pool, draft.toppings.length, prefRng);
    let tries = 0;
    while (sameFood(orders.at(-1), draft.base, toppings) && tries < MAX_REPICK) {
      toppings = chooseToppings(favorites, pool, draft.toppings.length, prefRng);
      tries += 1;
    }
    if (sameFood(orders.at(-1), draft.base, toppings)) {
      let guard = 0;
      do {
        toppings = shuffled(pool, prefRng).slice(0, draft.toppings.length);
        guard += 1;
      } while (sameFood(orders.at(-1), draft.base, toppings) && guard < MAX_REPICK);
    }
    orders.push({ base: draft.base, toppings, customerId: draft.customerId });
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

/** 讀屏宣告：「小紅想吃：手捲、玉子、小黃瓜」。吃的仍是多多，這句只說誰點了什麼。 */
export function orderAnnouncement(order: Order): string {
  const parts = [baseById(order.base).label, ...order.toppings.map((t) => toppingById(t).label)];
  return `${customerById(order.customerId).name}想吃：${parts.join("、")}`;
}

/** 兩樣用「和」，三樣以上用頓號、最後一個前面才用「和」。 */
function joinSpoken(labels: readonly string[]): string {
  if (labels.length <= 1) return labels[0] ?? "";
  if (labels.length === 2) return `${labels[0]}和${labels[1]}`;
  return `${labels.slice(0, -1).join("、")}和${labels.at(-1)}`;
}

/**
 * 朗讀新訂單。先報名字，飯型接在料後面，孩子才對得上那一盤：
 * 「嗨，我是小紅。我想要鮭魚和玉子握壽司。」
 */
export function orderSpeechLine(order: Order): string {
  const toppings = order.toppings.map((id) => toppingById(id).label);
  const base = baseById(order.base).label;
  const food = joinSpoken(toppings);
  const ask = food ? `我想要${food}${base}` : `我想要${base}`;
  return `${customerById(order.customerId).greeting}${ask}。`;
}

/** 這單做對時朋友說的一句。跟多多的字卡接在同一句裡念，避免排隊被蓋掉。 */
export function orderThanksLine(order: Order): string {
  return customerById(order.customerId).thanks;
}
