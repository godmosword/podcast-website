/**
 * 《多多壽司屋》貼紙書：現役 29 張（料 13、飯 3、表情 3、驚喜 4、朋友 6）。
 * 2026-11-08 起甜點下架：草莓、布丁、甜甜、刷牙 4 張退役（RETIRED_STICKER_IDS）——仍是合法 id、舊存檔已收集的照留在貼紙書，
 * 但不再送出、不算總數與全收集；新增鮭魚卵、鰻魚、干貝 3 張。
 * 圖只用現有的飯、料、多多縮小副本、角色定裝照，再加上程式畫的獎章框。不另生圖。
 * 貼紙只會增加、不會收回。一輪結束若一張新的都沒有，依目錄順序送出下一張
 * （先補原本 24 張，那些都有了才送客人），直到收滿。
 */

import { CUSTOMERS, type CustomerId } from "./customers";
import { roundMedals } from "./medals";
import type { RetiredToppingId } from "./art";
import type { Mood } from "./reactions";
import { BASES, TOPPINGS, type BaseId, type ToppingId } from "./toppings";


export type StickerGroup = "food" | "base" | "mood" | "surprise" | "customer";

export type StickerArt =
  | { kind: "topping"; id: ToppingId }
  /** 下架的甜點：只畫舊存檔已收集的。 */
  | { kind: "retired-topping"; id: RetiredToppingId }
  | { kind: "base"; id: BaseId }
  | { kind: "duoduo"; state: "love" | "yum" | "sweet" | "fire" | "toothbrush" | "laugh" | "chew" | "closed" }
  | { kind: "medal"; state: "chew" | "laugh"; frame: "gold" | "sun" }
  | { kind: "customer"; id: CustomerId };

export type DinoSushiSticker = {
  id: string;
  name: string;
  group: StickerGroup;
  /** 給孩子聽、給家長看的一句話。 */
  rule: string;
  art: StickerArt;
};

const FOOD_STICKERS: DinoSushiSticker[] = TOPPINGS.map((topping) => ({
  id: `topping-${topping.id}`,
  name: topping.label,
  group: "food",
  rule: `把${topping.label}放上壽司`,
  art: { kind: "topping", id: topping.id },
}));

/** 這家店現在不賣甜點：已收集的照留，說明改字。 */
const RETIRED_FOOD_STICKERS: DinoSushiSticker[] = [
  { id: "topping-strawberry", name: "草莓", group: "food", rule: "這家店現在不賣甜點", art: { kind: "retired-topping", id: "strawberry" } },
  { id: "topping-pudding", name: "布丁", group: "food", rule: "這家店現在不賣甜點", art: { kind: "retired-topping", id: "pudding" } },
];

const BASE_STICKERS: DinoSushiSticker[] = BASES.map((base) => ({
  id: `base-${base.id}`,
  name: base.label,
  group: "base",
  rule: `做好${base.label}，送出去`,
  art: { kind: "base", id: base.id },
}));

const MOOD_STICKERS: DinoSushiSticker[] = [
  { id: "mood-love", name: "最愛", group: "mood", rule: "讓多多說「最愛」", art: { kind: "duoduo", state: "love" } },
  { id: "mood-yum", name: "好吃", group: "mood", rule: "讓多多說「好好吃」", art: { kind: "duoduo", state: "yum" } },
  { id: "mood-sweet", name: "甜甜", group: "mood", rule: "這家店現在不賣甜點", art: { kind: "duoduo", state: "sweet" } },
  { id: "mood-puff", name: "噴火", group: "mood", rule: "給多多吃芥末", art: { kind: "duoduo", state: "fire" } },
  { id: "mood-brush", name: "刷牙", group: "mood", rule: "這家店現在不賣甜點", art: { kind: "duoduo", state: "toothbrush" } },
];

const CUSTOMER_STICKERS: DinoSushiSticker[] = CUSTOMERS.map((customer) => ({
  id: `customer-${customer.id}`,
  name: customer.name,
  group: "customer",
  rule: `幫${customer.name}做對一盤`,
  art: { kind: "customer", id: customer.id },
}));

const SURPRISE_STICKERS: DinoSushiSticker[] = [
  { id: "surprise-round", name: "吃飽飽", group: "surprise", rule: "點餐，送完 5 盤", art: { kind: "duoduo", state: "laugh" } },
  {
    id: "surprise-perfect",
    name: "一次做對",
    group: "surprise",
    rule: "連續 5 盤都一次做對",
    art: { kind: "medal", state: "chew", frame: "gold" },
  },
  { id: "surprise-free", name: "自由做", group: "surprise", rule: "自由做，按到多多吃飽", art: { kind: "duoduo", state: "closed" } },
  {
    id: "surprise-daily",
    name: "第一次來",
    group: "surprise",
    rule: "第一次來玩",
    art: { kind: "medal", state: "laugh", frame: "sun" },
  },
];

export const DINO_SUSHI_STICKERS: readonly DinoSushiSticker[] = [
  ...FOOD_STICKERS,
  ...RETIRED_FOOD_STICKERS,
  ...BASE_STICKERS,
  ...MOOD_STICKERS,
  ...SURPRISE_STICKERS,
  ...CUSTOMER_STICKERS,
];

export const DINO_SUSHI_STICKER_IDS: readonly string[] = DINO_SUSHI_STICKERS.map((sticker) => sticker.id);

const STICKER_BY_ID = new Map(DINO_SUSHI_STICKERS.map((sticker) => [sticker.id, sticker]));
const ID_SET = new Set(DINO_SUSHI_STICKER_IDS);

export const STICKER_GROUP_LABEL: Record<StickerGroup, string> = {
  food: "吃過的料",
  base: "送出的飯",
  mood: "多多的臉",
  surprise: "驚喜",
  customer: "來過的朋友",
};

/** 貼紙書最下面那一句：沒拿到新的也還有一張。 */
export const STICKER_ROUND_PROMISE = "每一輪結束，多多會送一張新貼紙，送完為止；「驚喜」要自己做到。";

export type DinoSushiStickerId = (typeof DINO_SUSHI_STICKERS)[number]["id"];

export function isDinoSushiStickerId(id: string): id is DinoSushiStickerId {
  return ID_SET.has(id);
}

export function stickerById(id: string): DinoSushiSticker | undefined {
  return STICKER_BY_ID.get(id);
}

export type PlateFact = {
  sushi: { base: BaseId | null; toppings: readonly ToppingId[] };
  mood: Mood;
  /** 點餐做對、朋友吃下去時才有。看一看或自由做不會記客人。 */
  customerId?: CustomerId;
};

/** 一輪裡跟貼紙有關的事實。看的是這一輪累積，不是畫面上還留著的那層。 */
export type RoundFactSource = {
  mode: "order" | "free";
  done: boolean;
  brushUsed: boolean;
  sushi: { toppings: readonly ToppingId[] };
  plates: readonly PlateFact[];
  firstTries: readonly boolean[];
};

export type StickerFacts = {
  placed: readonly ToppingId[];
  servedBases: readonly BaseId[];
  moods: ReadonlyArray<"love" | "yum" | "sweet" | "puff">;
  brushed: boolean;
  orderRoundDone: boolean;
  perfectRound: boolean;
  freeDone: boolean;
  firstVisitToday: boolean;
  /** 這一輪做對、吃下去的客人。同一位只算一次。 */
  servedCustomers: readonly CustomerId[];
};

const EMPTY_FACTS: StickerFacts = {
  placed: [],
  servedBases: [],
  moods: [],
  brushed: false,
  orderRoundDone: false,
  perfectRound: false,
  freeDone: false,
  firstVisitToday: false,
  servedCustomers: [],
};

export function rememberPlaced(memory: readonly ToppingId[], round: RoundFactSource): ToppingId[] {
  const next = new Set<ToppingId>(memory);
  for (const id of round.sushi.toppings) next.add(id);
  for (const plate of round.plates) {
    for (const id of plate.sushi.toppings) next.add(id);
  }
  return [...next];
}

export function factsFromRound(
  round: RoundFactSource,
  remembered: readonly ToppingId[] = [],
  firstVisitToday = false,
): StickerFacts {
  const placed = rememberPlaced(remembered, round);
  const eaten = round.plates.filter((plate) => plate.mood !== "look");
  const moods: Array<"love" | "yum" | "sweet" | "puff"> = [];
  const servedCustomers: CustomerId[] = [];
  for (const plate of eaten) {
    if (plate.mood === "love" || plate.mood === "yum" || plate.mood === "sweet" || plate.mood === "puff") {
      moods.push(plate.mood);
    }
    if (plate.customerId && !servedCustomers.includes(plate.customerId)) servedCustomers.push(plate.customerId);
  }
  const perfect =
    round.mode === "order" && round.done && roundMedals(round.firstTries).collectedAll;
  return {
    placed,
    servedBases: eaten.flatMap((plate) => (plate.sushi.base ? [plate.sushi.base] : [])),
    moods,
    brushed: round.brushUsed,
    orderRoundDone: round.mode === "order" && round.done,
    perfectRound: perfect,
    freeDone: round.mode === "free" && round.done,
    firstVisitToday,
    servedCustomers,
  };
}

/**
 * 退役的貼紙（2026-11-08 甜點下架）：仍是合法 id（讀寫存檔不過濾）、已收集的照留在貼紙書；
 * 保底不送、沒拿過的不放進貼紙書、不算總數與全收集（bookStickers、isStickerBookComplete）。
 */
export const RETIRED_STICKER_IDS: ReadonlySet<string> = new Set([
  "topping-strawberry",
  "topping-pudding",
  "mood-sweet",
  "mood-brush",
]);

/** 現役貼紙數（貼紙書的分母）。 */
export const DINO_SUSHI_STICKER_TOTAL = DINO_SUSHI_STICKERS.filter((sticker) => !RETIRED_STICKER_IDS.has(sticker.id)).length;

/** 這位玩家的貼紙書：拿得到的全部，加上舊存檔已經拿到的下架貼紙（不收回），依原本的順序。 */
export function bookStickers(owned: Iterable<string>): DinoSushiSticker[] {
  const have = new Set(owned);
  return DINO_SUSHI_STICKERS.filter((sticker) => !RETIRED_STICKER_IDS.has(sticker.id) || have.has(sticker.id));
}

/** 拿得到的都收齊就算全收集；下架的那幾張不擋。 */
export function isStickerBookComplete(owned: Iterable<string>): boolean {
  const have = new Set(owned);
  return DINO_SUSHI_STICKERS.every((sticker) => RETIRED_STICKER_IDS.has(sticker.id) || have.has(sticker.id));
}

export type CollectResult = {
  /** 這次新拿到的，依貼紙書順序。 */
  unlocked: DinoSushiStickerId[];
  /** 保底送出的那張；靠規則拿到的就是 null。 */
  gifted: DinoSushiStickerId | null;
};

/**
 * 依規則收集。`earnedThisRound` 是這一輪前面已經拿到的：
 * 有拿到就不再保底，免得一輪送兩次。
 */
export function collectStickers(
  owned: readonly string[],
  facts: StickerFacts = EMPTY_FACTS,
  options?: { finishedRound?: boolean; earnedThisRound?: readonly string[] },
): CollectResult {
  const have = new Set(owned);
  const unlocked: DinoSushiStickerId[] = [];
  const grant = (id: string, when: boolean) => {
    // 退役的貼紙不再發（甜點下架後本來就做不到，這裡再擋一次）
    if (!when || have.has(id) || !isDinoSushiStickerId(id) || RETIRED_STICKER_IDS.has(id)) return;
    have.add(id);
    unlocked.push(id);
  };

  for (const topping of TOPPINGS) grant(`topping-${topping.id}`, facts.placed.includes(topping.id));
  for (const base of BASES) grant(`base-${base.id}`, facts.servedBases.includes(base.id));
  grant("mood-love", facts.moods.includes("love"));
  grant("mood-yum", facts.moods.includes("yum"));
  grant("mood-sweet", facts.moods.includes("sweet"));
  grant("mood-puff", facts.moods.includes("puff"));
  grant("mood-brush", facts.brushed);
  grant("surprise-round", facts.orderRoundDone);
  grant("surprise-perfect", facts.perfectRound);
  grant("surprise-free", facts.freeDone);
  grant("surprise-daily", facts.firstVisitToday);
  for (const customer of CUSTOMERS) {
    grant(`customer-${customer.id}`, facts.servedCustomers.includes(customer.id));
  }

  const earnedEarlier = options?.earnedThisRound?.length ?? 0;
  if (unlocked.length > 0 || !options?.finishedRound || earnedEarlier > 0) {
    return { unlocked, gifted: null };
  }
  // 成就類只能自己達成，不當保底送；暫時拿不到的（甜點、刷牙）也不送。
  const gift = DINO_SUSHI_STICKERS.find(
    (sticker) => sticker.group !== "surprise" && !have.has(sticker.id) && !RETIRED_STICKER_IDS.has(sticker.id),
  );
  if (!gift || !isDinoSushiStickerId(gift.id)) return { unlocked, gifted: null };
  return { unlocked: [gift.id], gifted: gift.id };
}

export type ApplyState = {
  playId: string;
  placed: ToppingId[];
  earned: DinoSushiStickerId[];
  gifted: DinoSushiStickerId | null;
  settled: boolean;
};

export type ApplyRoundResult = {
  state: ApplyState;
  added: DinoSushiStickerId[];
  alreadySettled: boolean;
};

/** 同一輪（同一個 playId）重複送進來不會再送一張保底。 */
export function applyRoundStickers(
  owned: readonly string[],
  prev: ApplyState | null,
  playId: string,
  round: RoundFactSource,
  settledKey: string,
): ApplyRoundResult {
  const continued = prev && prev.playId === playId ? prev : null;
  if (continued?.settled || (round.done && playId !== "" && settledKey === playId)) {
    const state = continued ?? { playId, placed: [], earned: [], gifted: null, settled: true };
    return { state: { ...state, settled: true }, added: [], alreadySettled: true };
  }
  const base = continued ?? { playId, placed: [], earned: [], gifted: null, settled: false };
  const placed = rememberPlaced(base.placed, round);
  const facts = factsFromRound(round, base.placed);
  const collected = collectStickers(owned, facts, {
    finishedRound: round.done,
    earnedThisRound: base.earned,
  });
  return {
    state: {
      playId,
      placed,
      earned: [...base.earned, ...collected.unlocked],
      gifted: collected.gifted ?? base.gifted,
      settled: round.done,
    },
    added: collected.unlocked,
    alreadySettled: false,
  };
}

/** 一輪結束念的那一句：貼紙接著新開的天。speakText 只留一句等待，要併成一句才不會互相蓋掉。 */
export function roundEndAnnouncement(ids: readonly string[], giftedId: string | null, closing: string): string {
  return `${stickerAnnouncement(ids, giftedId)}${closing}`;
}

/** 念出來的句子。多張只念前三個名字，免得排隊太長。 */
export function stickerAnnouncement(ids: readonly string[], giftedId: string | null): string {
  const names = ids.map((id) => stickerById(id)?.name).filter((name): name is string => Boolean(name));
  if (names.length === 0) return "";
  if (giftedId && ids.length === 1 && ids[0] === giftedId) return `多多送你貼紙！${names[0]}！`;
  if (names.length === 1) return `新貼紙！${names[0]}！`;
  const head = names.slice(0, 3).join("、");
  return names.length > 3 ? `新貼紙！${head}，還有更多！` : `新貼紙！${head}！`;
}

export function stickerTapSpeech(id: string, unlocked: boolean): string {
  const sticker = stickerById(id);
  if (!sticker) return "";
  return unlocked ? sticker.name : `還沒有。${sticker.rule}`;
}
