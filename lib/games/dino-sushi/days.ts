/**
 * 《多多壽司屋》八天開店。這一階段只做第 1–4 天的訂單。
 * 第 4 天就是現在的壽司屋：同一個 seed，托盤、訂單、客人、天空都跟以前一樣。
 * 第 5–8 天只有臉上的名字，玩法還在後面。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { CUSTOMERS, type CustomerId } from "./customers";
import { buildOrders, buildScriptedOrders, buildTray, buildTrayWithTheme, ORDERS_PER_ROUND, type Order } from "./orders";
import { BASES, type BaseId, type ToppingId } from "./toppings";
import { roundVariety, THEME_DAYS, type RoundVariety, type ThemeDay } from "./variety";

export type DayCard = {
  day: number;
  /** 按鈕上的短名。 */
  name: string;
  /** 客人臉。多多那天改用表情貼紙。 */
  customerId?: CustomerId;
  duoduo?: "laugh" | "love";
};

export const DAY_CARDS: readonly DayCard[] = [
  { day: 1, name: "小紅", customerId: "xiaohong" },
  { day: 2, name: "安安", customerId: "anan" },
  { day: 3, name: "鈴鈴", customerId: "lingling" },
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
const DAY1_SIZES = [1, 1, 1, 1, 2] as const;
const DAY2_SIZES = [1, 1, 1, 2, 2] as const;
const DAY3_SIZES = [1, 1, 2, 2, 2] as const;

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

function scripted(
  day: number,
  seed: number,
  tray: ToppingId[],
  variety: RoundVariety,
  allowedBases: readonly BaseId[],
  sizes: readonly number[],
  salt: number,
): DayRound {
  const orders = buildScriptedOrders(seed, tray, {
    sizes,
    bases: allowedBases,
    seats: variety.seats,
    theme: variety.theme.toppings,
    salt,
  });
  return { day, tray, orders, variety, allowedBases };
}

/** 第 1–4 天的一輪。第 4 天不走腳本，訂單跟 buildOrders(..., "normal") 同一份。 */
export function buildDayRound(day: number, seed: number): DayRound {
  if (day === 4) {
    const tray = buildTray(seed);
    const variety = roundVariety(seed);
    return {
      day: 4,
      tray,
      orders: buildOrders(seed, tray, "normal"),
      variety,
      allowedBases: ALL_BASES,
    };
  }

  if (day === 1) {
    const others = pickIds(seed, DAY1_SEAT_SALT, ["anan", "ale", "lingling", "xiangxiang"], 2);
    const visitors: CustomerId[] = ["xiaohong", ...others];
    const seats = assignSeats(["xiaohong"], visitors);
    const variety: RoundVariety = {
      visitors,
      seats,
      theme: QUIET_THEME,
      sky: "sunny",
      lantern: "red",
      showTheme: false,
    };
    return scripted(1, seed, buildTrayWithTheme(seed, []), variety, ["nigiri"], DAY1_SIZES, DAY1_ORDER_SALT);
  }

  if (day === 2) {
    const theme = themeById("green");
    const other = pickIds(seed, DAY2_SEAT_SALT, ["xiaohong", "ale", "xiangxiang"], 1)[0]!;
    const visitors: CustomerId[] = ["anan", "lingling", other];
    const seats = assignSeats(["anan", "lingling"], visitors);
    const variety: RoundVariety = {
      visitors,
      seats,
      theme,
      sky: "sunny",
      lantern: "red",
      showTheme: true,
    };
    return scripted(
      2,
      seed,
      buildTrayWithTheme(seed, theme.toppings),
      variety,
      ["nigiri", "gunkan"],
      DAY2_SIZES,
      DAY2_ORDER_SALT,
    );
  }

  if (day === 3) {
    const base = roundVariety(seed);
    const extra = 2 + (Math.abs(seed) % 2);
    const others = pickIds(
      seed,
      DAY3_SEAT_SALT,
      CUSTOMERS.map((customer) => customer.id).filter((id) => id !== "lingling"),
      extra,
    );
    const visitors: CustomerId[] = ["lingling", ...others];
    const seats = assignSeats(["lingling"], visitors);
    const variety: RoundVariety = {
      visitors,
      seats,
      theme: base.theme,
      sky: "evening",
      lantern: "pink",
      showTheme: true,
    };
    return scripted(3, seed, buildTray(seed), variety, ALL_BASES, DAY3_SIZES, DAY3_ORDER_SALT);
  }

  throw new Error(`day ${day} is not playable yet`);
}
