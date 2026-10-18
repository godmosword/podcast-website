/**
 * 《多多壽司屋》每一輪的小變化。同一個 seed 永遠得到同一組，測試與截圖才重現得了。
 * 難度不變：仍是 5 單、料數 1、1、2、2、3。不計時、不扣分。
 * 訂單仍只點熟食家常料；草莓、布丁、芥末不進訂單，也不另加新料。
 * 圓蓋只展示已經拿到的貼紙，不新增拿貼紙的規則、不改存檔。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { CUSTOMERS, customerById, type CustomerId } from "./customers";
import { isDinoSushiStickerId } from "./stickers";
import type { ToppingId } from "./toppings";

export type ThemeId = "yellow" | "green" | "seafood";
export type SkyMood = "sunny" | "evening" | "snow";
export type LanternTone = "red" | "orange" | "pink" | "gold";

export type ThemeDay = {
  id: ThemeId;
  /** 念出來的一句，不加句號。 */
  label: string;
  /** 標題上的短名。 */
  name: string;
  toppings: readonly ToppingId[];
};

export const THEME_DAYS: readonly ThemeDay[] = [
  { id: "yellow", label: "今天是黃色日", name: "黃色日", toppings: ["tamago", "corn"] },
  { id: "green", label: "今天是綠色日", name: "綠色日", toppings: ["cucumber", "avocado"] },
  { id: "seafood", label: "今天是海鮮日", name: "海鮮日", toppings: ["shrimp", "crab", "tuna", "salmon"] },
];

export const SKY_MOODS: readonly SkyMood[] = ["sunny", "evening", "snow"];
export const LANTERN_TONES: readonly LanternTone[] = ["red", "orange", "pink", "gold"];

/** 送完第 3 盤，迴轉帶上的圓蓋自己打開。 */
export const DOME_AFTER_PLATES = 3;
export const DOME_SPEECH = "哇，蓋子打開了！";

const VARIETY_SALT = 0x85ebca6b;
const DOME_SALT = 0x27bb2ee6;

export type RoundVariety = {
  /** 今天會來的朋友，3–5 位，不重複。 */
  visitors: readonly CustomerId[];
  /** 5 個位子。人比單少時輪流再來；小紅在的話坐前兩單，東東在的話坐最後一單。 */
  seats: readonly CustomerId[];
  theme: ThemeDay;
  sky: SkyMood;
  lantern: LanternTone;
  /** false：第 1 單不念主題、托盤也不換色。沒寫＝要念、要換色。 */
  showTheme?: boolean;
};

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

function themeById(id: ThemeId): ThemeDay {
  const theme = THEME_DAYS.find((item) => item.id === id);
  if (!theme) throw new Error(`unknown theme: ${id}`);
  return theme;
}

/**
 * 小紅來的話，坐前兩單其中一單（飯＋1 料）。
 * 東東來的話，只坐最後一單（飯＋3 料），不在前面重複。
 * 前兩單盡量換人，孩子才不會連兩次看到同一盤。
 */
function seatVisitors(visitors: readonly CustomerId[], rng: () => number): CustomerId[] {
  const seats: Array<CustomerId | undefined> = [undefined, undefined, undefined, undefined, undefined];
  if (visitors.includes("dongdong")) seats[4] = "dongdong";
  if (visitors.includes("xiaohong")) seats[rng() < 0.5 ? 0 : 1] = "xiaohong";
  const cycleSource = visitors.filter((id) => id !== "dongdong");
  const cycle = shuffled(cycleSource.length > 0 ? cycleSource : visitors, rng);
  let cursor = 0;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i]) continue;
    seats[i] = cycle[cursor % cycle.length]!;
    cursor += 1;
  }
  if (seats[0] === seats[1] && cycle.length > 1) {
    const other = cycle.find((id) => id !== seats[0]);
    if (other) seats[1] = other;
  }
  return seats.filter((id): id is CustomerId => id !== undefined);
}

export function roundVariety(seed: number): RoundVariety {
  const rng = seededRng((seed ^ VARIETY_SALT) >>> 0);
  const visitCount = 3 + pickIndex(3, rng);
  const theme = themeById(THEME_DAYS[pickIndex(THEME_DAYS.length, rng)]!.id);
  const sky = SKY_MOODS[pickIndex(SKY_MOODS.length, rng)]!;
  const lantern = LANTERN_TONES[pickIndex(LANTERN_TONES.length, rng)]!;
  const visitors = shuffled(
    CUSTOMERS.map((customer) => customer.id),
    rng,
  ).slice(0, visitCount);
  return { visitors, seats: seatVisitors(visitors, rng), theme, sky, lantern };
}

function joinNames(names: readonly string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]}和${names[1]}`;
  return `${names.slice(0, -1).join("、")}和${names.at(-1)}`;
}

/**
 * 第 1 單先說主題日。送完第 3 盤、第 4 單出現時說圓蓋打開。
 * 合成進同一句訂單，才不會把訂單從朗讀排隊裡擠掉。
 */
export function orderLead(index: number, variety: RoundVariety): string {
  if (index === 0 && variety.showTheme !== false && variety.theme.label) return `${variety.theme.label}。`;
  if (index === DOME_AFTER_PLATES) return DOME_SPEECH;
  return "";
}

/** 標題讀屏：「今天是黃色日。今天會來小紅、安安和阿樂。」 */
export function todayAnnouncement(variety: RoundVariety): string {
  const names = variety.visitors.map((id) => customerById(id).name);
  return `${variety.theme.label}。今天會來${joinNames(names)}。`;
}

/**
 * 圓蓋裡展示的貼紙。只從這輪已經拿到的 id 裡挑，沒有就回 null（畫面改畫一顆星）。
 * 不發新貼紙。
 */
export function domeStickerId(seed: number, owned: readonly string[]): string | null {
  const real = owned.filter(isDinoSushiStickerId);
  if (real.length === 0) return null;
  const rng = seededRng((seed ^ DOME_SALT) >>> 0);
  return real[pickIndex(real.length, rng)] ?? null;
}

/** 視覺測試可把 window.__dinoSushiSeed 釘住；沒釘就隨機。 */
export function readRoundSeed(): number {
  if (typeof window === "undefined") return 1;
  const fixed = (window as Window & { __dinoSushiSeed?: number }).__dinoSushiSeed;
  if (typeof fixed === "number" && Number.isFinite(fixed)) return Math.trunc(fixed);
  return Math.floor(Math.random() * 0x7fffffff);
}
