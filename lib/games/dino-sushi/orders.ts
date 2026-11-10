/**
 * 《多多壽司屋》托盤與點餐。決定性：同一個 seed 產生同一盤料與同一串訂單（視覺測試用 window.__dinoSushiSeed）。
 * 2026-11-08 起（PR-C）每一單都是真實配方（recipes.ts），托盤反過來由這輪的訂單決定：先放訂單要的料，
 * 剩下的空格再隨機補「放得上當天飯型」的料。所以每一輪的托盤與搭配都比以前多變。
 */

import { TIER_SIZES, type OrderTier } from "./difficulty";
import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { customerById, type CustomerId } from "./customers";
import { fitsBase, RECIPES, type Recipe } from "./recipes";
import { roundVariety } from "./variety";
import type { Sushi } from "./sushi";
import { BASES, baseById, SAVORY_TOPPINGS, toppingById, type BaseId, type ToppingId } from "./toppings";

export type Order = {
  readonly base: BaseId;
  readonly toppings: readonly ToppingId[];
  /** 這單是誰點的；做好用輸送帶送給這位朋友吃。 */
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

/** 一單：幾樣料、可以用哪些飯。 */
export type OrderSlot = { readonly size: number; readonly bases: readonly BaseId[] };

export const TRAY_SIZE = 8;
/** 7 種家常料＋芥末。 */
const TRAY_SAVORY = 7;
export const ORDERS_PER_ROUND = 5;
/** 第 4 天（一般檔）每單幾樣料：1、1、2、2、3。 */
export const ORDER_SIZES: readonly number[] = TIER_SIZES.normal;
const ALL_BASES: readonly BaseId[] = BASES.map((base) => base.id);
/** 第 4 天與沒指定天的訂單亂數。換掉就換一串訂單（視覺基準要跟著重錄）。 */
const ORDER_SALT = 0x9e3779b9;
/** 自由做托盤的亂數。 */
const FREE_TRAY_SALT = 0x5bd1e995;

/**
 * 托盤順序。鮪魚沙拉和肉鬆顏色很近（2026-11-09 設計審），一個排最前、一個排最後，
 * 不管直排、橫排、兩欄四欄都不會相鄰。芥末固定在最後。
 */
const TRAY_ORDER: readonly ToppingId[] = [
  "tuna",
  "tamago",
  "shrimp",
  "crab",
  "corn",
  "cucumber",
  "salmon",
  "avocado",
  "ikura",
  "unagi",
  "scallop",
  "floss",
  "wasabi",
];
const TRAY_RANK = new Map(TRAY_ORDER.map((id, i) => [id, i]));

function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = pickIndex(i + 1, rng);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

function sortTray(ids: readonly ToppingId[]): ToppingId[] {
  return [...ids].sort((a, b) => TRAY_RANK.get(a)! - TRAY_RANK.get(b)!);
}

const sameRecipe = (a: Recipe | undefined, b: Recipe): boolean =>
  a !== undefined &&
  a.base === b.base &&
  a.toppings.length === b.toppings.length &&
  a.toppings.every((id) => b.toppings.includes(id));

/** 依序套一層層偏好；某一層篩完沒東西就跳過那一層（不會因為偏好而沒單可出）。 */
function prefer(candidates: readonly Recipe[], layers: readonly ((r: Recipe) => boolean)[]): Recipe[] {
  let pool = [...candidates];
  for (const keep of layers) {
    const next = pool.filter(keep);
    if (next.length > 0) pool = next;
  }
  return pool;
}

type PickContext = {
  slot: OrderSlot;
  used: ReadonlySet<ToppingId>;
  prev: Recipe | undefined;
  picked: readonly Recipe[];
  theme: readonly ToppingId[];
  favorites: readonly ToppingId[];
  rng: () => number;
};

/**
 * 挑一單：先看托盤放不放得下（這輪要用的料最多 7 樣），再依序偏好「跟上一單不一樣」「有主題料」「有客人的最愛」。
 * 放不下時改挑只用已經在托盤上的料的配方；還是沒有，就沿用前面符合這一單飯型與料數的某一單（托盤一定做得出來）；
 * 再沒有才放寬容量（托盤會超過 7 樣；目前的配方表與腳本走不到這裡，days／orders 測試掃 1000 個 seed 守著）。
 */
function pickRecipe(ctx: PickContext): Recipe {
  const { slot, used, prev, picked, theme, favorites, rng } = ctx;
  const fit = RECIPES.filter((r) => slot.bases.includes(r.base) && r.toppings.length === slot.size);
  const room = fit.filter((r) => new Set([...used, ...r.toppings]).size <= TRAY_SAVORY);
  const onTray = fit.filter((r) => r.toppings.every((id) => used.has(id)));
  const reuse = picked.filter((r) => fit.includes(r));
  const base = [room, onTray, reuse, fit].find((list) => list.length > 0)!;
  const pool = prefer(base, [
    (r) => !sameRecipe(prev, r),
    (r) => r.toppings.some((id) => theme.includes(id)),
    (r) => r.toppings.some((id) => favorites.includes(id)),
  ]);
  return pool[pickIndex(pool.length, rng)]!;
}

/** 托盤：訂單要的料先放，空格補放得上當天飯型的料（隨機），再加芥末。 */
function trayFor(used: ReadonlySet<ToppingId>, bases: readonly BaseId[], rng: () => number): ToppingId[] {
  const fillers = SAVORY_TOPPINGS.map((t) => t.id).filter((id) => !used.has(id) && bases.some((b) => fitsBase(id, b)));
  // 訂單要的料一定都在；正常是 7 樣，只有 pickRecipe 最後的退路才可能超過
  const savory = [...used, ...shuffled(fillers, rng)].slice(0, Math.max(TRAY_SAVORY, used.size));
  return sortTray([...savory, "wasabi"]);
}

/**
 * 一輪的訂單與托盤：五單依序決定，每單只挑一次、不重抽，保證會結束、托盤 ≤ 7 樣家常料。
 * slots、seats 由外面指定（第 1–3 天的腳本，或第 4 天的 1、1、2、2、3）。
 */
export function buildRecipeRound(
  seed: number,
  script: { slots: readonly OrderSlot[]; seats: readonly CustomerId[]; theme: readonly ToppingId[]; salt: number },
): { orders: Order[]; tray: ToppingId[] } {
  const rng = seededRng((seed ^ script.salt) >>> 0);
  const picked: Recipe[] = [];
  const used = new Set<ToppingId>();
  script.slots.forEach((slot, index) => {
    const customerId = script.seats[index]!;
    const recipe = pickRecipe({
      slot,
      used,
      prev: picked.at(-1),
      picked,
      theme: script.theme,
      favorites: customerById(customerId).favorites,
      rng,
    });
    picked.push(recipe);
    for (const id of recipe.toppings) used.add(id);
  });
  const orders = picked.map((recipe, index) => ({
    base: recipe.base,
    toppings: [...recipe.toppings],
    customerId: script.seats[index]!,
  }));
  const bases = [...new Set(script.slots.flatMap((slot) => slot.bases))];
  return { orders, tray: trayFor(used, bases, rng) };
}

/** 第 4 天（與沒指定天）：三種飯都可以，料數照難度檔位。 */
export function buildOrders(seed: number, tier: OrderTier = "normal"): { orders: Order[]; tray: ToppingId[] } {
  const variety = roundVariety(seed);
  return buildRecipeRound(seed, {
    slots: TIER_SIZES[tier].map((size) => ({ size, bases: ALL_BASES })),
    seats: variety.seats,
    theme: variety.theme.toppings,
    salt: ORDER_SALT,
  });
}

/** 自由做托盤最多先放幾樣主題料。海鮮日有 7 樣，全放就每個海鮮日托盤都一樣。 */
const FREE_THEME_MAX = 3;

/**
 * 自由做的托盤：主題料隨機先放最多 3 樣，其餘隨機補滿 7 種家常料，再加芥末。
 * 自由做沒有訂單，孩子愛怎麼搭就怎麼搭。
 */
export function buildTray(seed: number): ToppingId[] {
  const rng = seededRng((seed ^ FREE_TRAY_SALT) >>> 0);
  const theme = roundVariety(seed).theme.toppings;
  const all = shuffled(
    SAVORY_TOPPINGS.map((t) => t.id),
    rng,
  );
  const themed = all.filter((id) => theme.includes(id)).slice(0, FREE_THEME_MAX);
  const savory = [...themed, ...all.filter((id) => !themed.includes(id))].slice(0, TRAY_SAVORY);
  return sortTray([...savory, "wasabi"]);
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

/** 讀屏宣告：「小紅想吃：手捲、玉子、小黃瓜」。2026-11-08 起點餐是朋友自己吃（輸送帶送過去）。 */
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
