/**
 * 《多多壽司屋》來店的朋友。只點餐，不吃；壽司仍是多多吃、多多做反應。
 * 頭像用 podcast 現成定裝照（public/characters），不另生圖、不改舊圖。
 * 最愛只從熟食家常料挑。草莓、布丁、芥末不進訂單。
 * 這一輪誰來、坐哪一單，見 variety.ts（同一個 seed）。
 */

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

export function customerById(id: CustomerId): Customer {
  const customer = BY_ID.get(id);
  if (!customer) throw new Error(`unknown customer: ${id}`);
  return customer;
}
