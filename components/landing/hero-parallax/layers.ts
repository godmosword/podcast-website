/**
 * 橫向 2.5D 視差帶的分層資料（規格 docs/specs/HERO-PARALLAX-SPEC.md §4.1）。
 *
 * tile 由 `npm run compose:parallax` 產出，尺寸與
 * `public/landing/hero-parallax/manifest.json` 必須一致——`layers.test.ts` 守這件事。
 * 這裡不直接 import 那份 JSON：public/ 是靜態資產，不該進 bundle 依賴圖。
 */
export const PARALLAX_ASSET_PATH = "/landing/hero-parallax";

export type ParallaxLayerId = "l1" | "l2" | "l3" | "l5";

export type ParallaxLayer = {
  id: ParallaxLayerId;
  file: string;
  /** tile 原生像素尺寸。 */
  width: number;
  height: number;
  /** 相對路面層的捲動速度（規格 §4.1：路面 = 1.0x）。 */
  speed: number;
  label: string;
};

/**
 * 由遠到近。L0 天空是 CSS 漸層、L4 主角是定點 sprite，都不在這張表裡。
 * §4.1 的六層已滿額，不得再加層。
 */
export const PARALLAX_LAYERS: readonly ParallaxLayer[] = [
  { id: "l1", file: "l1-props.webp", width: 1920, height: 268, speed: 0.3, label: "遠景地標" },
  { id: "l2", file: "l2-props.webp", width: 1920, height: 221, speed: 0.6, label: "中景" },
  { id: "l3", file: "l3-road.webp", width: 1630, height: 237, speed: 1.0, label: "路面" },
  { id: "l5", file: "l5-props.webp", width: 1920, height: 221, speed: 1.6, label: "近景" },
] as const;

/** L4 主角：沿用地圖 roamer 的同一份檔案（規格 §2.3 對策 1、§4.3）。 */
export const PARALLAX_HERO_SPRITE = {
  src: "/adventures/roamers/xiao-hong.webp",
  width: 625,
  height: 396,
} as const;

/**
 * 路面層（1.0x）的捲動速度。其他層依 `speed` 等比。
 *
 * 60px/s 在 1630px 的路面 tile 上是 27 秒一圈——慢到像「一直往前開」而不是
 * 「衝刺」。這是美術旋鈕。
 */
export const BASE_VELOCITY_PX_PER_SECOND = 60;

/**
 * 一層 tile 捲完一整輪所需秒數。動畫用 `translateX(-33.333%)` 在三份 tile 上
 * 位移剛好一份，所以一輪 = 一個 tile 寬。
 */
export function loopDurationSeconds(layer: Pick<ParallaxLayer, "width" | "speed">): number {
  return layer.width / (BASE_VELOCITY_PX_PER_SECOND * layer.speed);
}

/** 每層並排幾份 tile。固定值，避免依視窗寬動態算份數造成 hydration 落差。 */
export const TILE_COPIES = 3;

/**
 * 位移一份 tile 之後 strip 仍蓋得住的最大視窗寬。
 *
 * 動畫在 `TILE_COPIES` 份上位移剛好一份，所以可見範圍只剩 (copies − 1) 份。
 * 三份在 scale 1 時支援到 2 × 1630 = 3260px（以最短的路面 tile 計）。
 */
export function coveredViewportWidth(tileWidth: number, scale: number, copies = TILE_COPIES): number {
  return (copies - 1) * tileWidth * scale;
}
