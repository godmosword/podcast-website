/**
 * 《多多壽司屋》食材表。純資料。
 * 點餐只用熟食家常料；甜點是「多多愛吃糖」彩蛋，芥末只會讓多多噗一朵白雲，兩者都不進訂單。
 */

export type BaseId = "nigiri" | "gunkan" | "temaki";

export type ToppingId =
  | "tamago"
  | "shrimp"
  | "crab"
  | "corn"
  | "cucumber"
  | "tuna"
  | "floss"
  | "salmon"
  | "avocado"
  | "strawberry"
  | "pudding"
  | "wasabi";

export type ToppingKind = "savory" | "sweet" | "wasabi";

export type BaseMeta = { id: BaseId; label: string };

export type ToppingMeta = { id: ToppingId; label: string; kind: ToppingKind };

export const BASES: readonly BaseMeta[] = [
  { id: "nigiri", label: "握壽司" },
  { id: "gunkan", label: "軍艦" },
  { id: "temaki", label: "手捲" },
];

/** 同色系的料靠形狀區分（玉子方塊／玉米粒、蝦彎／鮭魚條紋／蟹肉棒圓柱、小黃瓜圓片／酪梨月牙）。 */
export const TOPPINGS: readonly ToppingMeta[] = [
  { id: "tamago", label: "玉子", kind: "savory" },
  { id: "shrimp", label: "蝦", kind: "savory" },
  { id: "crab", label: "蟹肉棒", kind: "savory" },
  { id: "corn", label: "玉米", kind: "savory" },
  { id: "cucumber", label: "小黃瓜", kind: "savory" },
  { id: "tuna", label: "鮪魚沙拉", kind: "savory" },
  { id: "floss", label: "肉鬆", kind: "savory" },
  { id: "salmon", label: "鮭魚", kind: "savory" },
  { id: "avocado", label: "酪梨", kind: "savory" },
  { id: "strawberry", label: "草莓", kind: "sweet" },
  { id: "pudding", label: "布丁", kind: "sweet" },
  { id: "wasabi", label: "芥末", kind: "wasabi" },
];

export const SAVORY_TOPPINGS: readonly ToppingMeta[] = TOPPINGS.filter((t) => t.kind === "savory");
export const SWEET_TOPPINGS: readonly ToppingMeta[] = TOPPINGS.filter((t) => t.kind === "sweet");

const TOPPING_BY_ID = new Map(TOPPINGS.map((t) => [t.id, t]));
const BASE_BY_ID = new Map(BASES.map((b) => [b.id, b]));

export function toppingById(id: ToppingId): ToppingMeta {
  const meta = TOPPING_BY_ID.get(id);
  if (!meta) throw new Error(`unknown topping: ${id}`);
  return meta;
}

export function baseById(id: BaseId): BaseMeta {
  const meta = BASE_BY_ID.get(id);
  if (!meta) throw new Error(`unknown base: ${id}`);
  return meta;
}
