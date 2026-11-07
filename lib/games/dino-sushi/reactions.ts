/**
 * 《多多壽司屋》多多吃到壽司的反應：表情、看得到的字卡、音型。純函數。
 * 優先序：缺料（不吃）＞芥末＞甜點＞一次做對／最愛＞普通好吃。甜點反應不能是最高級。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import { matchOrder, type Order, type OrderMatch } from "./orders";
import type { Sushi } from "./sushi";
import { baseById, SAVORY_TOPPINGS, toppingById, type ToppingId } from "./toppings";

export type Mood = "love" | "yum" | "sweet" | "puff" | "look";

/** 數字越大越開心；love 是唯一最高級。 */
export const MOOD_RANK: Readonly<Record<Mood, number>> = {
  look: 0,
  puff: 1,
  sweet: 2,
  yum: 3,
  love: 4,
};

export type Reaction = {
  mood: Mood;
  line: string;
  /** 每種反應一種音型，由 View 對應到音效。 */
  sfx: Mood;
  /** false＝多多先不吃，看泡泡。 */
  eats: boolean;
  /** 吃到甜點，可以點牙刷幫多多刷牙。 */
  brush: boolean;
  /** 點餐模式才有：缺料時 View 用來閃泡泡上缺的那一樣。 */
  match?: OrderMatch;
};

export type OrderContext = { order: Order; firstTry: boolean };
export type FreeContext = { favorite: ToppingId };

const FAVORITE_SEED_SALT = 0x5bd1e995;

function uniqueLabels(sushi: Sushi): string[] {
  return [...new Set(sushi.toppings)].map((t) => toppingById(t).label);
}

/** 「玉子加蝦，好好吃！」；只有白飯時「白飯香香的！」。 */
export function servingLine(sushi: Sushi): string {
  const labels = uniqueLabels(sushi);
  if (labels.length === 0) return "白飯香香的！";
  if (labels.length === 1) return `${labels[0]}，好好吃！`;
  const last = labels.at(-1)!;
  return `${labels.slice(0, -1).join("、")}加${last}，好好吃！`;
}

function missingLine(order: Order, match: OrderMatch): string {
  const missing = match.missing.map((t) => toppingById(t).label).join("、");
  if (!match.baseOk) {
    const base = baseById(order.base).label;
    return missing ? `想要${base}，還有${missing}！` : `想要${base}！`;
  }
  return `還想要${missing}！`;
}

/**
 * 矮舞台的字卡：吃下去的句子只留最後一段（「好好吃！」），才不會蓋住坐在旁邊的客人。
 * 完整句留給朗讀。缺料句不裁，孩子要看缺什麼。
 */
export function shortCaption(reaction: Pick<Reaction, "mood" | "line">): string {
  if (reaction.mood === "look") return reaction.line;
  return reaction.line.split("，").at(-1) ?? reaction.line;
}

/** 自由做的「最愛」：只從這一輪托盤上的家常料挑，孩子一定做得出來。不挑甜點。 */
export function favoriteFor(seed: number, tray: readonly ToppingId[]): ToppingId {
  const rng = seededRng((seed ^ FAVORITE_SEED_SALT) >>> 0);
  const onTray = tray.filter((id) => toppingById(id).kind === "savory");
  const pool = onTray.length > 0 ? onTray : SAVORY_TOPPINGS.map((topping) => topping.id);
  return pool[pickIndex(pool.length, rng)]!;
}

function react(mood: Mood, line: string, brush: boolean, match?: OrderMatch): Reaction {
  return { mood, line, sfx: mood, eats: mood !== "look", brush, ...(match ? { match } : {}) };
}

function treatReaction(sushi: Sushi, match?: OrderMatch): Reaction | null {
  const kinds = new Set(sushi.toppings.map((t) => toppingById(t).kind));
  const brush = kinds.has("sweet");
  if (kinds.has("wasabi")) return react("puff", "噗～辣辣的，哈哈！", brush, match);
  if (brush) return react("sweet", "甜甜的！", true, match);
  return null;
}

export function reactionFor(sushi: Sushi, ctx: OrderContext | FreeContext): Reaction {
  if ("order" in ctx) {
    const match = matchOrder(sushi, ctx.order);
    if (!match.ok) return react("look", missingLine(ctx.order, match), false, match);
    return (
      treatReaction(sushi, match) ??
      react(ctx.firstTry ? "love" : "yum", servingLine(sushi), false, match)
    );
  }
  const treat = treatReaction(sushi);
  if (treat) return treat;
  if (sushi.toppings.includes(ctx.favorite)) {
    return react("love", `最愛${toppingById(ctx.favorite).label}了！`, false);
  }
  return react("yum", servingLine(sushi), false);
}
