/** 《多多壽司屋》砧板上的一個壽司：飯型＋最多 3 層料。純函數，不可變更新。 */

import type { BaseId, ToppingId } from "./toppings";

export type Sushi = {
  readonly base: BaseId | null;
  readonly toppings: readonly ToppingId[];
  /**
   * 每一層「這一次放上去」的編號，跟 toppings 一一對應，只給 React 當 key：
   * 同一種料放兩次也分得開，擠掉或拿掉一層時留下來的不重掛、不重播落下。
   * 訂單泡泡、結算盤這類靜態壽司沒有這欄，畫的時候退回「第幾個同樣的料」。
   */
  readonly layerIds?: readonly number[];
  /** 下一層要發的編號；只增不減，剛拿掉的那號不會馬上被新的一層撿去用。 */
  readonly nextLayerId?: number;
};

export const MAX_TOPPINGS = 3;

export const EMPTY_SUSHI: Sushi = { base: null, toppings: [] };

function layerIdsOf(sushi: Sushi): readonly number[] {
  return sushi.layerIds ?? sushi.toppings.map((_, i) => i);
}

/**
 * 加一層料；已滿 3 層時擠掉最舊的那層，孩子不會因為放滿而卡住。
 * 還沒選飯時回傳同一物件（View 以此判斷要不要讓料位輕晃）。
 */
export function addTopping(sushi: Sushi, id: ToppingId): Sushi {
  if (sushi.base === null) return sushi;
  const ids = layerIdsOf(sushi);
  const layerId = sushi.nextLayerId ?? ids.length;
  const full = sushi.toppings.length >= MAX_TOPPINGS;
  const kept = full ? sushi.toppings.slice(1 - MAX_TOPPINGS) : sushi.toppings;
  const keptIds = full ? ids.slice(1 - MAX_TOPPINGS) : ids;
  return { ...sushi, toppings: [...kept, id], layerIds: [...keptIds, layerId], nextLayerId: layerId + 1 };
}

/** 點料位拿掉那一層；越界回傳同一物件。 */
export function removeTopping(sushi: Sushi, slot: number): Sushi {
  if (slot < 0 || slot >= sushi.toppings.length) return sushi;
  return {
    ...sushi,
    toppings: sushi.toppings.filter((_, i) => i !== slot),
    layerIds: layerIdsOf(sushi).filter((_, i) => i !== slot),
    nextLayerId: sushi.nextLayerId ?? sushi.toppings.length,
  };
}

/**
 * 第 i 層的 React key。有層編號就用編號；沒有（靜態壽司）就用「第幾個同樣的料」，
 * 至少不同種的料拿掉一層時不會互相換位。
 */
export function layerKey(sushi: Sushi, i: number): string {
  const layerId = sushi.layerIds?.[i];
  if (layerId !== undefined) return `layer-${layerId}`;
  const id = sushi.toppings[i];
  const nth = sushi.toppings.slice(0, i).filter((t) => t === id).length;
  return `${id}-${nth}`;
}

/** 換飯型，已放的料保留。 */
export function changeBase(sushi: Sushi, base: BaseId): Sushi {
  if (sushi.base === base) return sushi;
  return { ...sushi, base };
}

export function isServable(sushi: Sushi): boolean {
  return sushi.base !== null;
}
