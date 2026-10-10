/** 《多多壽司屋》砧板上的一個壽司：飯型＋最多 3 層料。純函數，不可變更新。 */

import type { BaseId, ToppingId } from "./toppings";

export type Sushi = {
  readonly base: BaseId | null;
  readonly toppings: readonly ToppingId[];
};

export const MAX_TOPPINGS = 3;

export const EMPTY_SUSHI: Sushi = { base: null, toppings: [] };

/** 加一層料；還沒選飯或已滿 3 層時回傳同一物件（View 以此判斷要不要讓料位輕晃）。 */
export function addTopping(sushi: Sushi, id: ToppingId): Sushi {
  if (sushi.base === null || sushi.toppings.length >= MAX_TOPPINGS) return sushi;
  return { ...sushi, toppings: [...sushi.toppings, id] };
}

/** 點料位拿掉那一層；越界回傳同一物件。 */
export function removeTopping(sushi: Sushi, slot: number): Sushi {
  if (slot < 0 || slot >= sushi.toppings.length) return sushi;
  return { ...sushi, toppings: sushi.toppings.filter((_, i) => i !== slot) };
}

/** 換飯型，已放的料保留。 */
export function changeBase(sushi: Sushi, base: BaseId): Sushi {
  if (sushi.base === base) return sushi;
  return { ...sushi, base };
}

export function isServable(sushi: Sushi): boolean {
  return sushi.base !== null;
}
