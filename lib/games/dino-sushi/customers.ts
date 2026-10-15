/**
 * 《多多壽司屋》來店的朋友。只點餐，不吃；壽司仍是多多吃、多多做反應。
 * 頭像用 podcast 現成定裝照（public/characters），不另生圖、不改舊圖。
 * 最愛只從熟食家常料挑。草莓、布丁、芥末不進訂單。
 */

import { pickIndex, seededRng } from "@/lib/games/candy-match/rng";
import type { ToppingId } from "./toppings";

export type CustomerId = "xiaohong" | "anan" | "ale" | "lingling" | "dongdong" | "xiangxiang";

export type Customer = {
  id: CustomerId;
  /** 孩子聽到的短名。 */
  name: string;
  /** data/characters.json 的名字，用來對定裝照。 */
  fullName: string;
  avatar: string;
  /** 進店第一句，後面再接想吃的壽司。 */
  greeting: string;
  /** 這單做對、多多吃下去時，朋友在旁邊說的一句。朋友自己不吃。 */
  thanks: string;
  favorites: readonly ToppingId[];
};

export const CUSTOMERS: readonly Customer[] = [
  {
    id: "xiaohong",
    name: "小紅",
    fullName: "小紅賽車",
    avatar: "/characters/小紅賽車.jpg",
    greeting: "嗨，我是小紅。",
    thanks: "咻～好快好好吃！",
    favorites: ["shrimp"],
  },
  {
    id: "anan",
    name: "安安",
    fullName: "安安救護車",
    avatar: "/characters/安安救護車.jpg",
    greeting: "你好，我是安安。",
    thanks: "謝謝你，好健康喔！",
    favorites: ["cucumber", "tamago"],
  },
  {
    id: "ale",
    name: "阿樂",
    fullName: "黃色計程車",
    avatar: "/characters/黃色計程車.jpg",
    greeting: "嗶嗶，我是阿樂。",
    thanks: "嗶嗶！黃黃的最棒！",
    favorites: ["corn", "tamago"],
  },
  {
    id: "lingling",
    name: "鈴鈴",
    fullName: "鈴鈴清潔車",
    avatar: "/characters/鈴鈴清潔車.jpg",
    greeting: "你好，我是鈴鈴。",
    thanks: "乾乾淨淨，真好吃！",
    favorites: ["cucumber"],
  },
  {
    id: "dongdong",
    name: "東東",
    fullName: "東東挖土機",
    avatar: "/characters/東東挖土機.jpg",
    greeting: "挖，我是東東。",
    thanks: "挖～一大口！",
    favorites: ["floss", "tuna", "crab"],
  },
  {
    id: "xiangxiang",
    name: "香香",
    fullName: "香香餐車",
    avatar: "/characters/香香餐車.jpg",
    greeting: "你好，我是香香。",
    thanks: "你做得比我還香！",
    favorites: ["salmon", "tamago"],
  },
];

const BY_ID = new Map(CUSTOMERS.map((customer) => [customer.id, customer]));

/** 跟點餐亂數錯開，同一個 seed 的客人名單才不會跟著托盤一起變。 */
const ASSIGN_SALT = 0x27d4eb2f;

export function customerById(id: CustomerId): Customer {
  const customer = BY_ID.get(id);
  if (!customer) throw new Error(`unknown customer: ${id}`);
  return customer;
}

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

/**
 * 一輪 5 個位子，5 位不同的朋友（6 位裡有 1 位這輪不來）。
 * 東東固定最後一單（飯＋3 料）；小紅在前兩單其中一單（飯＋1 料）。
 */
export function customersForRound(seed: number): CustomerId[] {
  const rng = seededRng((seed ^ ASSIGN_SALT) >>> 0);
  const seats: Array<CustomerId | undefined> = [undefined, undefined, undefined, undefined, "dongdong"];
  seats[rng() < 0.5 ? 0 : 1] = "xiaohong";
  const rest = shuffled(
    CUSTOMERS.filter((customer) => customer.id !== "dongdong" && customer.id !== "xiaohong"),
    rng,
  );
  let cursor = 0;
  for (let i = 0; i < seats.length; i++) {
    if (seats[i]) continue;
    const next = rest[cursor];
    if (!next) throw new Error("not enough customers");
    seats[i] = next.id;
    cursor += 1;
  }
  return seats.filter((id): id is CustomerId => id !== undefined);
}
