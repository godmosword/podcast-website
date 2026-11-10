/**
 * 《多多壽司屋》真實配方（計畫 docs/plans/2026-11-08-dino-sushi-real-shop.md，PR-C）。
 * 每一單都從這張表挑：照真的壽司店怎麼搭，不再隨機湊料。料的順序＝泡泡與成品上的順序（第一樣是主角）。
 *
 * - 握壽司：一片料壓在飯上，最多兩樣（蝦＋酪梨這種）。散的料（玉米、鮭魚卵、肉鬆、鮪魚沙拉）放不住，不上握壽司。
 * - 軍艦：海苔圍一圈，放散的料與沙拉類。
 * - 手捲：一樣到三樣，常見的是「主料＋小黃瓜」與加州捲（蟹肉棒、小黃瓜、酪梨）。
 */
import type { BaseId, ToppingId } from "./toppings";

export type Recipe = { readonly base: BaseId; readonly toppings: readonly ToppingId[] };

const r = (base: BaseId, ...toppings: ToppingId[]): Recipe => ({ base, toppings });

export const RECIPES: readonly Recipe[] = [
  // 握壽司
  r("nigiri", "tamago"),
  r("nigiri", "shrimp"),
  r("nigiri", "crab"),
  r("nigiri", "salmon"),
  r("nigiri", "avocado"),
  r("nigiri", "unagi"),
  r("nigiri", "scallop"),
  r("nigiri", "shrimp", "avocado"),
  r("nigiri", "salmon", "avocado"),
  // 軍艦
  r("gunkan", "corn"),
  r("gunkan", "tuna"),
  r("gunkan", "ikura"),
  r("gunkan", "floss"),
  r("gunkan", "crab"),
  r("gunkan", "tuna", "corn"),
  r("gunkan", "ikura", "cucumber"),
  r("gunkan", "crab", "corn"),
  r("gunkan", "tuna", "cucumber"),
  r("gunkan", "floss", "corn"),
  r("gunkan", "scallop", "ikura"),
  r("gunkan", "tuna", "corn", "cucumber"),
  r("gunkan", "crab", "corn", "cucumber"),
  // 手捲
  r("temaki", "crab"),
  r("temaki", "tuna"),
  r("temaki", "salmon"),
  r("temaki", "shrimp"),
  r("temaki", "cucumber"),
  r("temaki", "floss"),
  r("temaki", "unagi"),
  r("temaki", "crab", "cucumber"),
  r("temaki", "tuna", "cucumber"),
  r("temaki", "salmon", "avocado"),
  r("temaki", "shrimp", "avocado"),
  r("temaki", "floss", "cucumber"),
  r("temaki", "tamago", "cucumber"),
  r("temaki", "unagi", "cucumber"),
  r("temaki", "salmon", "ikura"),
  r("temaki", "tuna", "corn"),
  r("temaki", "crab", "cucumber", "avocado"),
  r("temaki", "shrimp", "avocado", "cucumber"),
  r("temaki", "salmon", "avocado", "cucumber"),
  r("temaki", "tamago", "crab", "cucumber"),
  r("temaki", "floss", "tamago", "cucumber"),
  r("temaki", "unagi", "tamago", "cucumber"),
  r("temaki", "tuna", "corn", "cucumber"),
];

const FITS = new Map<BaseId, ReadonlySet<ToppingId>>();
for (const recipe of RECIPES) {
  const set = new Set(FITS.get(recipe.base) ?? []);
  for (const id of recipe.toppings) set.add(id);
  FITS.set(recipe.base, set);
}

/** 這樣料放得上這種飯（真的有這種壽司）。托盤補空位時，只補放得上當天飯型的料。 */
export function fitsBase(id: ToppingId, base: BaseId): boolean {
  return FITS.get(base)?.has(id) ?? false;
}
