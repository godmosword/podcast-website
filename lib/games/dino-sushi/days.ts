/**
 * 《多多壽司屋》八天開店。這一階段只做第 1–4 天的訂單。每一單都是真實配方（recipes.ts，2026-11-08 PR-C）：
 * - 第 1 天：握壽司、每單一樣料。
 * - 第 2 天：握壽司＋軍艦，最後一單是兩樣料的軍艦。
 * - 第 3 天：手捲登場（第 2、4 單一定是手捲），最多兩樣料。
 * - 第 4 天：三種飯都有，料數 1、1、2、2、3，手捲可以三樣。
 * 主題只是偏好（有主題料的配方優先），不是硬篩。第 5–8 天只有臉上的名字，玩法還在後面。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { CUSTOMERS, type CustomerId } from "./customers";
import { buildOrders, buildRecipeRound, ORDERS_PER_ROUND, type Order, type OrderSlot } from "./orders";
import { BASES, type BaseId, type ToppingId } from "./toppings";
import { roundVariety, THEME_DAYS, type RoundVariety, type ThemeDay } from "./variety";

export type DayCard = {
  day: number;
  /** 按鈕上的短名。 */
  name: string;
  /** 客人臉。多多那天改用表情貼紙。 */
  customerId?: CustomerId;
  duoduo?: "laugh" | "love";
  /** 貼紙車頭朝左。放在往前走的結算主鈕上要翻面，才是朝著箭頭走。 */
  faceLeft?: boolean;
};

export const DAY_CARDS: readonly DayCard[] = [
  { day: 1, name: "小紅", customerId: "xiaohong" },
  { day: 2, name: "安安", customerId: "anan", faceLeft: true },
  { day: 3, name: "鈴鈴", customerId: "lingling", faceLeft: true },
  { day: 4, name: "多多", duoduo: "laugh" },
  { day: 5, name: "香香", customerId: "xiangxiang" },
  { day: 6, name: "東東", customerId: "dongdong" },
  { day: 7, name: "阿樂", customerId: "ale" },
  { day: 8, name: "大家", duoduo: "love" },
];

export type DayRound = {
  day: number;
  tray: ToppingId[];
  orders: Order[];
  variety: RoundVariety;
  allowedBases: readonly BaseId[];
};

const ALL_BASES: readonly BaseId[] = BASES.map((base) => base.id);
const NIGIRI: readonly BaseId[] = ["nigiri"];
const NIGIRI_GUNKAN: readonly BaseId[] = ["nigiri", "gunkan"];
const GUNKAN: readonly BaseId[] = ["gunkan"];
const TEMAKI: readonly BaseId[] = ["temaki"];

const slot = (size: number, bases: readonly BaseId[]): OrderSlot => ({ size, bases });

/** 第 1–3 天每一單的料數與飯型（第 4 天見 buildOrders）。recipes.test.ts 守每一格至少 3 道配方可挑。 */
export const DAY_SCRIPTS: Readonly<Record<1 | 2 | 3 | 4, readonly OrderSlot[]>> = {
  1: [slot(1, NIGIRI), slot(1, NIGIRI), slot(1, NIGIRI), slot(1, NIGIRI), slot(1, NIGIRI)],
  2: [slot(1, NIGIRI_GUNKAN), slot(1, NIGIRI_GUNKAN), slot(1, NIGIRI_GUNKAN), slot(1, NIGIRI_GUNKAN), slot(2, GUNKAN)],
  3: [slot(1, ALL_BASES), slot(1, TEMAKI), slot(2, ALL_BASES), slot(2, TEMAKI), slot(2, ALL_BASES)],
  4: [slot(1, ALL_BASES), slot(1, ALL_BASES), slot(2, ALL_BASES), slot(2, ALL_BASES), slot(3, ALL_BASES)],
};

/** 跟訂單、托盤的亂數錯開，換位子不會改掉第 4 天的指紋。 */
const DAY1_ORDER_SALT = 0x0d1a0001;
const DAY1_SEAT_SALT = 0x0d1a0002;
const DAY2_ORDER_SALT = 0x0d2a0001;
const DAY2_SEAT_SALT = 0x0d2a0002;
const DAY3_ORDER_SALT = 0x0d3a0001;
const DAY3_SEAT_SALT = 0x0d3a0002;

const QUIET_THEME: ThemeDay = { id: "yellow", label: "", name: "", toppings: [] };

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    const swap = out[i]!;
    out[i] = out[j]!;
    out[j] = swap;
  }
  return out;
}

function themeById(id: ThemeDay["id"]): ThemeDay {
  const theme = THEME_DAYS.find((item) => item.id === id);
  if (!theme) throw new Error(`unknown theme: ${id}`);
  return theme;
}

function pickIds(seed: number, salt: number, pool: readonly CustomerId[], count: number): CustomerId[] {
  const rng = seededRng((seed ^ salt) >>> 0);
  return shuffled(pool, rng).slice(0, count);
}

/** 指定位子先坐；剩下的位子在其他客人裡輪流，盡量不跟前一位同一人。 */
function assignSeats(pins: readonly (CustomerId | undefined)[], visitors: readonly CustomerId[]): CustomerId[] {
  const pinned = new Set(pins.filter((id): id is CustomerId => id !== undefined));
  const cycle = visitors.filter((id) => !pinned.has(id));
  const pool = cycle.length > 0 ? cycle : [...visitors];
  const seats: CustomerId[] = [];
  let cursor = 0;
  for (let index = 0; index < ORDERS_PER_ROUND; index++) {
    const pin = pins[index];
    if (pin) {
      seats.push(pin);
      continue;
    }
    let pick = pool[cursor % pool.length]!;
    if (seats.at(-1) === pick && pool.length > 1) {
      cursor += 1;
      pick = pool[cursor % pool.length]!;
    }
    seats.push(pick);
    cursor += 1;
  }
  return seats;
}

function scripted(day: 1 | 2 | 3, seed: number, variety: RoundVariety, allowedBases: readonly BaseId[], salt: number): DayRound {
  const { orders, tray } = buildRecipeRound(seed, {
    slots: DAY_SCRIPTS[day],
    seats: variety.seats,
    theme: variety.theme.toppings,
    salt,
  });
  return { day, tray, orders, variety, allowedBases };
}

function day1(seed: number): DayRound {
  const others = pickIds(seed, DAY1_SEAT_SALT, ["anan", "ale", "lingling", "xiangxiang"], 2);
  const visitors: CustomerId[] = ["xiaohong", ...others];
  const variety: RoundVariety = {
    visitors,
    seats: assignSeats(["xiaohong"], visitors),
    theme: QUIET_THEME,
    sky: "sunny",
    lantern: "red",
    showTheme: false,
  };
  return scripted(1, seed, variety, NIGIRI, DAY1_ORDER_SALT);
}

function day2(seed: number): DayRound {
  const other = pickIds(seed, DAY2_SEAT_SALT, ["xiaohong", "ale", "xiangxiang"], 1)[0]!;
  const visitors: CustomerId[] = ["anan", "lingling", other];
  const variety: RoundVariety = {
    visitors,
    seats: assignSeats(["anan", "lingling"], visitors),
    theme: themeById("green"),
    sky: "sunny",
    lantern: "red",
    showTheme: true,
  };
  return scripted(2, seed, variety, NIGIRI_GUNKAN, DAY2_ORDER_SALT);
}

function day3(seed: number): DayRound {
  const extra = 2 + (Math.abs(seed) % 2);
  const pool = CUSTOMERS.map((customer) => customer.id).filter((id) => id !== "lingling");
  const visitors: CustomerId[] = ["lingling", ...pickIds(seed, DAY3_SEAT_SALT, pool, extra)];
  const variety: RoundVariety = {
    visitors,
    seats: assignSeats(["lingling"], visitors),
    theme: roundVariety(seed).theme,
    sky: "evening",
    lantern: "pink",
    showTheme: true,
  };
  return scripted(3, seed, variety, ALL_BASES, DAY3_ORDER_SALT);
}

/** 第 1–4 天的一輪。第 4 天的訂單跟 buildOrders(seed, "normal") 同一份。 */
export function buildDayRound(day: number, seed: number): DayRound {
  if (day === 1) return day1(seed);
  if (day === 2) return day2(seed);
  if (day === 3) return day3(seed);
  if (day === 4) {
    const { orders, tray } = buildOrders(seed, "normal");
    return { day: 4, tray, orders, variety: roundVariety(seed), allowedBases: ALL_BASES };
  }
  throw new Error(`day ${day} is not playable yet`);
}
