/**
 * 繽紛卡丁車黏土材質契約（站內／Godot 共用常數）。
 * 必須與 `candy-kart-game/scripts/materials.gd` CATALOG 對齊。
 */

export const CANDY_KART_MATERIAL_CATALOG = [
  "clay",
  "solid",
  "road",
  "skin",
  "fabric",
  "wood",
  "foliage",
  "kart_shell",
  "rubber",
  "candy",
] as const;

export type CandyKartMaterialId = (typeof CANDY_KART_MATERIAL_CATALOG)[number];
