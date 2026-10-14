import type { PlateTone } from "./art";
import type { Sushi } from "./sushi";

/**
 * 迴轉帶上繞來繞去的裝飾盤（不是點餐，盤上的壽司刻意小、蓋著透明蓋子）。
 * 燈籠、圓窗改用黏土 WebP，圖在 shop 資產；店名「多多壽司」是文字，刻在櫃台前板上（DinoSushiShop）。
 */

export const BELT_PLATES: readonly { tone: PlateTone; sushi: Sushi }[] = [
  { tone: "pink", sushi: { base: "nigiri", toppings: ["salmon"] } },
  { tone: "mint", sushi: { base: "gunkan", toppings: ["corn"] } },
  { tone: "lavender", sushi: { base: "nigiri", toppings: ["tamago"] } },
  { tone: "pink", sushi: { base: "temaki", toppings: ["cucumber"] } },
  { tone: "mint", sushi: { base: "nigiri", toppings: ["shrimp"] } },
  { tone: "lavender", sushi: { base: "gunkan", toppings: ["floss"] } },
];
