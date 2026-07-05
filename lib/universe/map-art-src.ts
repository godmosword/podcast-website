/**
 * 宇宙地圖「海／天」黏土素材路徑與 srcset（`public/adventures/map/`）。
 * 素材由 `scripts/generate-map-art.ts` 產出，詳見 docs/UNIVERSE-ART-BIBLE.md §14。
 * 集中管理避免字串散落於元件。
 */

import { pngToWebp } from "@/lib/universe/png-to-webp";

const MAP_ART_BASE = "/adventures/map";

export type MapArtSrcSet = {
  /** PNG fallback */
  src: string;
  srcSet: string;
  webpSrc: string;
  webpSrcSet: string;
};

function mapArtPath(file: string): string {
  return `${MAP_ART_BASE}/${file}`;
}

/** 海面（實底黏土，無縫平鋪）。夜間對應 `data-theme="night"`。 */
export function seaTexturePath(night: boolean = false): string {
  return mapArtPath(night ? "sea-night.png" : "sea.png");
}

/** 視差雲層檔名（透明 RGBA，僅 1x）。 */
export const CLOUD_IDS = ["cloud-a", "cloud-b", "cloud-c"] as const;
export type CloudId = (typeof CLOUD_IDS)[number];

export function cloudPath(id: CloudId): string {
  return mapArtPath(`${id}.png`);
}

/** 地平線遠景剪影（透明 RGBA，含 @2x）。 */
export const FAR_ISLAND_IDS = ["far-island-a", "far-island-b"] as const;
export type FarIslandId = (typeof FAR_ISLAND_IDS)[number];

/** 遠島固有 1x 寬（stage px）；@2x 供 pan/zoom 放大。 */
export const FAR_ISLAND_WIDTH = 384;

export function farIslandSrcSet(id: FarIslandId): MapArtSrcSet {
  const src = mapArtPath(`${id}.png`);
  const src2x = mapArtPath(`${id}@2x.png`);
  const srcSet = [`${src} ${FAR_ISLAND_WIDTH}w`, `${src2x} ${FAR_ISLAND_WIDTH * 2}w`].join(", ");
  const webpSrc = pngToWebp(src);
  const webpSrcSet = [
    `${webpSrc} ${FAR_ISLAND_WIDTH}w`,
    `${pngToWebp(src2x)} ${FAR_ISLAND_WIDTH * 2}w`,
  ].join(", ");
  return { src, srcSet, webpSrc, webpSrcSet };
}

/** 黏土日月（透明 RGBA，選用）。 */
export function sunPath(): string {
  return mapArtPath("sun.png");
}

export function sunWebpPath(): string {
  return pngToWebp(sunPath());
}

export function moonPath(): string {
  return mapArtPath("moon.png");
}

export function moonWebpPath(): string {
  return pngToWebp(moonPath());
}
