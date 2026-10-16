/**
 * 《多多壽司屋》素材的縮小副本。
 *
 * 原檔是主人核准的黏土 WebP（600–1407px），留在原處不動；畫面一律讀同目錄 `sm/`
 * 底下的副本，由 `npm run optimize:dino-sushi-assets` 產生並 commit 進 repo。
 *
 * 寬度：在 16 種尺寸（320×568 到 2560×1440，含直式平板、橫放手機）跑過標題、五單、
 * 結算、自由做，量每張圖的最大顯示寬度；平板與桌機按 2 倍螢幕、手機（7 種尺寸）按 3 倍螢幕
 * 換算，取大的那個，再取 64 的倍數、最小 128。2026-10-14 實測（#226 之後的版面）。
 * 版面放大某張圖時要重量、改這張表，再重跑腳本。
 * `null`＝換算後已超過原圖，副本就是原檔照抄。
 */
export const DINO_SUSHI_ASSET_ROOT = "/games/v2/dino-sushi";

export const DINO_SUSHI_SM_WIDTH = {
  // 多多：1180×820 最大 360px（手機 250px）
  "duoduo/sticker-closed.webp": 768,
  "duoduo/sticker-open.webp": 768,
  "duoduo/sticker-chew.webp": 768,
  "duoduo/sticker-laugh.webp": 768,
  "duoduo/sticker-love.webp": 768,
  "duoduo/sticker-yum.webp": 768,
  "duoduo/sticker-sweet.webp": 768,
  "duoduo/sticker-fire.webp": 768,
  "duoduo/sticker-look.webp": 768,
  "duoduo/sticker-toothbrush.webp": 320, // 手機 92px
  // 飯：橫放手機（932×430）備料盤上最大 190px；手捲是瘦長的，寬只有 85px
  "food/nigiri.webp": 576,
  "food/gunkan.webp": 576,
  "food/temaki.webp": 256,
  "food/temaki-front.webp": 256,
  // 料：多半是單料放在握壽司上最大，也是橫放手機（括號是手機最大寬）；布丁是手捲上的單料最大（932×430 約 79px）
  "food/tamago.webp": 448, // 144px
  "food/shrimp.webp": 512, // 154px
  "food/crab.webp": 512, // 164px
  "food/corn.webp": 384, // 112px
  "food/cucumber.webp": 384, // 123px
  "food/tuna.webp": 320, // 89px
  "food/floss.webp": 448, // 130px
  "food/salmon.webp": 512, // 161px
  "food/avocado.webp": 448, // 137px
  "food/strawberry.webp": 256, // 79px
  "food/pudding.webp": 256, // 79px
  "food/wasabi.webp": 256, // 97px（桌機）
  // 店面：直式平板（768–834 寬）最大（括號是平板或桌機最大寬）
  "shop/wall.webp": null, // 606px
  "shop/awning.webp": 1152, // 560px
  "shop/counter.webp": null, // 638px
  "shop/belt.webp": null, // 274px，原圖 266
  "shop/window.webp": 320, // 手機 96px
  "shop/lantern.webp": 128, // 44px
  "shop/dome.webp": 128, // 43px
  "shop/plate.webp": 384, // 手機 110px
  "shop/prepplate.webp": null, // 手機 274px
  "shop/tray-neutral.webp": 256, // 107px
  "shop/tray-sweet.webp": 256, // 105px
  "shop/tray-wasabi.webp": 256, // 115px
} as const satisfies Record<string, number | null>;

export type DinoSushiAsset = keyof typeof DINO_SUSHI_SM_WIDTH;

/** `food/salmon.webp` → `food/sm/salmon.webp`（相對素材根目錄）。 */
export function dinoSushiSmPath(asset: DinoSushiAsset): string {
  const slash = asset.lastIndexOf("/");
  return `${asset.slice(0, slash)}/sm/${asset.slice(slash + 1)}`;
}

/** 畫面上用的網址：一律指向縮小副本。 */
export function dinoSushiSrc(asset: DinoSushiAsset): string {
  return `${DINO_SUSHI_ASSET_ROOT}/${dinoSushiSmPath(asset)}`;
}
