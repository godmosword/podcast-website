/**
 * 車車大冒險 Canvas 黏土材質契約。
 * 色票與筆刷 ID 必須與 `render.ts` 對齊（source 契約測試對帳）。
 */

/** 具名筆刷（Canvas 版「材質 catalog」）。 */
export const CAR_ADVENTURE_MATERIAL_CATALOG = [
  "soil",
  "grass",
  "brick",
  "platform",
  "car_shell",
  "rubber",
  "coin",
  "spike",
  "wood",
  "candy",
] as const;

export type CarAdventureMaterialId =
  (typeof CAR_ADVENTURE_MATERIAL_CATALOG)[number];

/**
 * 黏土風美術色（canvas 讀不到 CSS 變數）。
 * 鏡射 DESIGN.md 的 --c-* token 與 --ink；地形／點綴為同色相深淺階。
 */
export const CAR_ADVENTURE_CLAY = {
  ink: "#34302b",
  pink: "#f7a8c4",
  yellow: "#ffd866",
  mint: "#b7df9b",
  sky: "#8fcde8",
  teal: "#79c8c1",
  lilac: "#c5b3e6",
  soil: "#f0c795",
  soilEdge: "#d9a566",
  grassEdge: "#93c979",
  coinRim: "#e8b64a",
  spike: "#f27ba0",
  cloud: "rgba(255,255,255,.9)",
  hudPanel: "rgba(255,255,255,.82)",
  brick: "#e8b06a",
  brickSeam: "rgba(120,80,40,.5)",
  /** 輪胎橡膠（略暖於 ink，與車殼區隔）。 */
  rubber: "#3a342f",
  /** 終點旗桿／樹幹木質。 */
  wood: "#b48a5a",
  /** 車殼高光奶油。 */
  shellHighlight: "rgba(255,255,255,.42)",
  /** 車窗臉底。 */
  face: "#ffffff",
  /** 輪圈奶油。 */
  hub: "#fff6e0",
  /** 車頭燈。 */
  headlamp: "#fff3b0",
} as const;

export type CarAdventureClayKey = keyof typeof CAR_ADVENTURE_CLAY;
