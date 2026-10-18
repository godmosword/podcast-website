/**
 * 《多多壽司屋》托盤與點餐。決定性：同一個 seed 產生同一盤料與同一串訂單（視覺測試用 window.__dinoSushiSeed）。
 */

import { TIER_SIZES, type OrderTier } from "./difficulty";
import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { customerById, type CustomerId } from "./customers";
import { roundVariety } from "./variety";
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
export const ORDER_SIZES: readonly number[] = TIER_SIZES.normal;
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

function sortTray(ids: readonly ToppingId[]): ToppingId[] {
  return [...ids].sort((a, b) => TOPPING_ORDER.get(a)! - TOPPING_ORDER.get(b)!);
}

/** 主題日之前的托盤。飯型亂數仍吃這盤，seed 7 的手捲才不會被主題日改掉。 */
function classicTray(seed: number): ToppingId[] {
  const rng = seededRng(seed);
  const savory = shuffled(SAVORY_TOPPINGS, rng).slice(0, TRAY_SAVORY);
  const sweet = SWEET_TOPPINGS[pickIndex(SWEET_TOPPINGS.length, rng)]!;
  return sortTray([...savory.map((t) => t.id), sweet.id, "wasabi"]);
}

/**
 * 主題日把該色的家常料換上托盤（不夠 6 格再用其他家常料補）。
 * 甜點與芥末仍各留 1 格，但不進訂單。
 */
function withTheme(tray: readonly ToppingId[], theme: readonly ToppingId[]): ToppingId[] {
  const savory = tray.filter((id) => toppingById(id).kind === "savory");
  const must = theme.filter((id) => toppingById(id).kind === "savory");
  const have = savory.filter((id) => must.includes(id));
  const missing = must.filter((id) => !have.includes(id));
  const fillers = savory.filter((id) => !must.includes(id));
  const nextSavory = [...have, ...missing, ...fillers].slice(0, TRAY_SAVORY);
  const sweet = tray.find((id) => toppingById(id).kind === "sweet") ?? SWEET_TOPPINGS[0]!.id;
  return sortTray([...nextSavory, sweet, "wasabi"]);
}

/** 不套主題日的 8 格托盤。第 1 天用這個，才不會被隨機主題日換料。 */
export function buildTrayWithTheme(seed: number, themeToppings: readonly ToppingId[]): ToppingId[] {
  return withTheme(classicTray(seed), themeToppings);
}

/** 每輪托盤 8 格：6 種家常料＋1 種甜點＋芥末，依食材表順序排（甜點、芥末固定在最後）。 */
export function buildTray(seed: number): ToppingId[] {
  return buildTrayWithTheme(seed, roundVariety(seed).theme.toppings);
}

/**
 * 先放主題料（托盤上有的），兩樣以上再放客人的最愛，不夠用別的家常料補。
 * 沒有主題時維持「最愛優先」。甜點與芥末不在池裡。
 */
export function chooseToppings(
  favorites: readonly ToppingId[],
  pool: readonly ToppingId[],
  size: number,
  rng: () => number,
  theme: readonly ToppingId[] = [],
): ToppingId[] {
  const themeOn = theme.filter((id) => pool.includes(id) && toppingById(id).kind === "savory");
  const favOn = favorites.filter((id) => pool.includes(id) && toppingById(id).kind === "savory");
  const picked: ToppingId[] = [];
  const takeFrom = (cands: readonly ToppingId[]) => {
    const left = cands.filter((id) => pool.includes(id) && !picked.includes(id));
    if (left.length === 0 || picked.length >= size) return;
    picked.push(shuffled(left, rng)[0]!);
  };
  const both = favOn.filter((id) => themeOn.includes(id));
  if (both.length > 0) takeFrom(both);
  else if (themeOn.length > 0) takeFrom(themeOn);
  else takeFrom(favOn);
  if (picked.length < size) takeFrom(favOn);
  let guard = 0;
  while (picked.length < size && guard < MAX_REPICK) {
    const rest = pool.filter((id) => !picked.includes(id));
    if (rest.length === 0) break;
    const prefer = rest.filter((id) => themeOn.includes(id));
    takeFrom(prefer.length > 0 ? prefer : rest);
    guard += 1;
  }
  return shuffled(picked, rng);
}

/**
 * 相鄰兩單不能一樣時，仍留下至少一種主題料。
 * 黃色日、綠色日只有兩樣主題料，兩張「飯＋2 料」若都拿滿主題就會變成同一盤，
 * 所以每樣主題都再配一種別的家常料來試。
 */
function ensureTheme(
  toppings: readonly ToppingId[],
  theme: readonly ToppingId[],
  pool: readonly ToppingId[],
  prev: { base: BaseId; toppings: readonly ToppingId[] } | undefined,
  base: BaseId,
  rng: () => number,
): ToppingId[] {
  const size = toppings.length;
  const themeOn = theme.filter((id) => pool.includes(id) && toppingById(id).kind === "savory");
  if (themeOn.length === 0 || size === 0) return [...toppings];

  const acceptable = (next: readonly ToppingId[]) =>
    next.length === size &&
    new Set(next).size === size &&
    next.every((id) => pool.includes(id)) &&
    next.some((id) => themeOn.includes(id)) &&
    !sameFood(prev, base, next);

  if (acceptable(toppings)) return [...toppings];

  const fillers = pool.filter((id) => !themeOn.includes(id));
  const candidates: ToppingId[][] = [];
  for (const id of shuffled(themeOn, rng)) {
    if (size === 1) {
      candidates.push([id]);
      continue;
    }
    const extras = shuffled([...fillers, ...themeOn.filter((item) => item !== id)], rng);
    for (const extra of extras) {
      const rest = extras.filter((item) => item !== extra);
      candidates.push([id, extra, ...rest].slice(0, size));
    }
  }

  return candidates.find((next) => acceptable(next)) ?? candidates[0] ?? [...toppings];
}

/** 腳本訂單若重試後仍跟前一單一樣，換掉最後一樣料。主題日仍留下至少一種主題料。 */
function differFromPrev(
  toppings: readonly ToppingId[],
  theme: readonly ToppingId[],
  pool: readonly ToppingId[],
  prev: { base: BaseId; toppings: readonly ToppingId[] } | undefined,
  base: BaseId,
): ToppingId[] {
  if (!sameFood(prev, base, toppings) || toppings.length === 0) return [...toppings];
  const themeOn = theme.filter((id) => pool.includes(id) && toppingById(id).kind === "savory");
  for (const id of pool) {
    if (toppings.includes(id)) continue;
    const next = [...toppings.slice(0, -1), id];
    if (new Set(next).size !== next.length) continue;
    if (themeOn.length > 0 && !next.some((item) => themeOn.includes(item))) continue;
    if (!sameFood(prev, base, next)) return next;
  }
  return [...toppings];
}

function sameFood(
  prev: { base: BaseId; toppings: readonly ToppingId[] } | undefined,
  base: BaseId,
  toppings: readonly ToppingId[],
): boolean {
  return (
    prev !== undefined &&
    prev.base === base &&
    prev.toppings.length === toppings.length &&
    prev.toppings.every((id) => toppings.includes(id))
  );
}

/** 飯型沿用主題日之前的托盤亂數，視覺測試的 seed 7 才仍有手捲。 */
function draftBases(seed: number, sizes: readonly number[]): BaseId[] {
  const pool = classicTray(seed).filter((id) => toppingById(id).kind === "savory");
  const rng = seededRng((seed ^ ORDER_SEED_SALT) >>> 0);
  const drafted: { base: BaseId; toppings: ToppingId[] }[] = [];
  for (const size of sizes) {
    let next: { base: BaseId; toppings: ToppingId[] };
    let tries = 0;
    do {
      next = {
        base: BASES[pickIndex(BASES.length, rng)]!.id,
        toppings: shuffled(pool, rng).slice(0, size),
      };
      tries += 1;
    } while (sameFood(drafted.at(-1), next.base, next.toppings) && tries < MAX_REPICK);
    drafted.push(next);
  }
  return drafted.map((item) => item.base);
}

/**
 * 一輪 5 單，只點托盤上的家常料；同一單料不重複，相鄰兩單不一樣。
 * 飯型沿用原本的亂數（難度與 seed 7 的手捲不變）。
 * 料先跟主題日，兩樣以上再放那位客人的最愛。沒有第 6 單，甜點不進訂單。
 */
/**
 * 給第 1–3 天用的訂單：料數、飯型、位子、主題都由外面指定。
 * 不走 buildOrders 的亂數，所以第 4 天的 seed 指紋不會被帶動。
 */
export function buildScriptedOrders(
  seed: number,
  tray: readonly ToppingId[],
  script: {
    sizes: readonly number[];
    bases: readonly BaseId[];
    seats: readonly CustomerId[];
    theme: readonly ToppingId[];
    salt: number;
  },
): Order[] {
  const pool = tray.filter((id) => toppingById(id).kind === "savory");
  const rng = seededRng((seed ^ script.salt) >>> 0);
  const orders: Order[] = [];
  for (let index = 0; index < script.sizes.length; index++) {
    const size = script.sizes[index]!;
    const customerId = script.seats[index]!;
    const favorites = customerById(customerId).favorites;
    let base = script.bases[pickIndex(script.bases.length, rng)]!;
    let toppings = chooseToppings(favorites, pool, size, rng, script.theme);
    let tries = 0;
    while (sameFood(orders.at(-1), base, toppings) && tries < MAX_REPICK) {
      base = script.bases[pickIndex(script.bases.length, rng)]!;
      toppings = chooseToppings(favorites, pool, size, rng, script.theme);
      tries += 1;
    }
    toppings = ensureTheme(toppings, script.theme, pool, orders.at(-1), base, rng);
    toppings = differFromPrev(toppings, script.theme, pool, orders.at(-1), base);
    orders.push({ base, toppings, customerId });
  }
  return orders;
}

/** tier：難度檔位，只改每單幾樣料。一般檔（預設）的亂數消耗跟原本一樣，同一個 seed 訂單不變。 */
export function buildOrders(seed: number, tray: readonly ToppingId[], tier: OrderTier = "normal"): Order[] {
  const sizes = TIER_SIZES[tier];
  const pool = tray.filter((id) => toppingById(id).kind === "savory");
  const variety = roundVariety(seed);
  const bases = draftBases(seed, sizes);
  const prefRng = seededRng((seed ^ PREFERENCE_SALT) >>> 0);
  const orders: Order[] = [];
  for (let index = 0; index < sizes.length; index++) {
    const size = sizes[index]!;
    const base = bases[index]!;
    const customerId = variety.seats[index]!;
    const favorites = customerById(customerId).favorites;
    let toppings = chooseToppings(favorites, pool, size, prefRng, variety.theme.toppings);
    let tries = 0;
    while (sameFood(orders.at(-1), base, toppings) && tries < MAX_REPICK) {
      toppings = chooseToppings(favorites, pool, size, prefRng, variety.theme.toppings);
      tries += 1;
    }
    toppings = ensureTheme(toppings, variety.theme.toppings, pool, orders.at(-1), base, prefRng);
    orders.push({ base, toppings, customerId });
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
export function orderSpeechLine(order: Order, lead = ""): string {
  const toppings = order.toppings.map((id) => toppingById(id).label);
  const base = baseById(order.base).label;
  const food = joinSpoken(toppings);
  const ask = food ? `我想要${food}${base}` : `我想要${base}`;
  return `${lead}${customerById(order.customerId).greeting}${ask}。`;
}

/** 這單做對時朋友說的一句。跟多多的字卡接在同一句裡念，避免排隊被蓋掉。 */
export function orderThanksLine(order: Order): string {
  return customerById(order.customerId).thanks;
}
