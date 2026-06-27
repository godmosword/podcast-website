/**
 * 各島靜態 art tile 路徑與詮釋資料（`/public/adventures/zones/`）。
 * 詳見 docs/UNIVERSE-ART-BIBLE.md §10「與程式對接」。
 */
import type { ZoneId } from "@/data/universe-zones";

/** landmark＝小地標 icon（R1 現況）；island＝整島 diorama（未來，需改錨點與渲染）。 */
export type ZoneArtMode = "landmark" | "island";

/** landmark→以島中心對齊 coord；island→以沙岸底部中心對齊 coord。 */
export type ZoneTileAnchor = "center" | "sand-bottom-center";

/** 小地標 icon（現況）：固定以島中心對齊 coord，疊在 UniverseMap 的 SVG 沙草橢圓上。 */
type LandmarkTile = {
  src: string;
  mode: "landmark";
  anchor: "center";
};

/** 整島 diorama（未來）：以沙岸底中心對齊 coord，需提供 stage 固有尺寸。 */
type IslandTile = {
  src: string;
  mode: "island";
  anchor: "sand-bottom-center";
  /** tile 在 stage 座標系的固有尺寸（island 模式必填，故用 union 在編譯期強制）。 */
  stageSize: { w: number; h: number };
};

/** discriminated union：island 模式編譯期即強制帶 anchor + stageSize，無需 any／鬆散 optional。 */
export type ZoneArtTile = LandmarkTile | IslandTile;

/**
 * 各島 art tile 路徑（對應 `ZoneDef.artTile`）。
 *
 * 副檔名切換時機：現況為 R1/R2 inline 風格的 `.svg` 小地標。當某島依
 * docs/UNIVERSE-ART-BIBLE.md §8/§9 產出整島 diorama PNG 後，改本函式回傳
 * `.png`（或交由 next/image 處理 @2x/@3x），並同步把該島 `ZONE_ART_TILES`
 * 的 mode 改為 "island"。
 */
export function zoneArtTilePath(id: ZoneId): string {
  return `/adventures/zones/${id}.svg`;
}

/**
 * 各島 tile 詮釋資料（單一資料源）。
 * R1 現況：全島 landmark／center，渲染行為與 R2 完全一致。
 * 升級整島 diorama 時：改該島 mode="island" + anchor="sand-bottom-center" + stageSize，
 * 並由 ZoneIsland／UniverseMap 對 island 模式調整錨點、尺寸；務必同時在
 * UniverseMap.tsx 條件關閉該島的 SVG 沙／草橢圓（兩層 ellipse 與整島圖直接耦合，
 * 否則會疊圖），渲染改走 next/image（評估尺寸／priority／hit area／pill 位置）。
 */
export const ZONE_ART_TILES: Record<ZoneId, ZoneArtTile> = {
  "car-park": { src: zoneArtTilePath("car-park"), mode: "landmark", anchor: "center" },
  dino: { src: zoneArtTilePath("dino"), mode: "landmark", anchor: "center" },
  rescue: { src: zoneArtTilePath("rescue"), mode: "landmark", anchor: "center" },
  ocean: { src: zoneArtTilePath("ocean"), mode: "landmark", anchor: "center" },
};

export function getZoneArtTile(id: ZoneId): ZoneArtTile {
  return ZONE_ART_TILES[id];
}
