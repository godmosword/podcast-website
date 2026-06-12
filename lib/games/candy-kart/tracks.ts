/**
 * 繽紛卡丁車（Candy Kart）賽道中繼資料 — TS 端單一事實來源。
 * Godot 專案（/candy-kart-game/）內的賽道定義需與此對齊；
 * parTimeMs（時間達標）與 starsTotal 供父頁計算三星獎牌。
 */

export type CandyKartTrackId =
  | "macaron-meadow"
  | "candy-beach"
  | "jelly-forest"
  | "icecream-peak"
  | "choco-volcano"
  | "rainbow-skyway";

export type CandyKartTrack = {
  id: CandyKartTrackId;
  /** gamekit medals 的關卡索引（0-based，依大獎賽順序） */
  levelIndex: number;
  name: string;
  laps: number;
  /** flawless（時間達標）門檻：完賽總時間 ≤ parTimeMs */
  parTimeMs: number;
  /** 賽道上的彩虹星星總數（collectedAll 判定） */
  starsTotal: number;
};

export const CANDY_KART_TRACKS: CandyKartTrack[] = [
  { id: "macaron-meadow", levelIndex: 0, name: "馬卡龍草原", laps: 3, parTimeMs: 225_000, starsTotal: 7 },
  { id: "candy-beach", levelIndex: 1, name: "糖果海灘", laps: 3, parTimeMs: 235_000, starsTotal: 7 },
  { id: "jelly-forest", levelIndex: 2, name: "果凍森林", laps: 3, parTimeMs: 245_000, starsTotal: 7 },
  { id: "icecream-peak", levelIndex: 3, name: "冰淇淋雪山", laps: 3, parTimeMs: 255_000, starsTotal: 7 },
  { id: "choco-volcano", levelIndex: 4, name: "巧克力火山", laps: 3, parTimeMs: 265_000, starsTotal: 7 },
  { id: "rainbow-skyway", levelIndex: 5, name: "彩虹天空道", laps: 3, parTimeMs: 275_000, starsTotal: 7 },
];

export function candyKartTrackById(id: string): CandyKartTrack | null {
  return CANDY_KART_TRACKS.find((t) => t.id === id) ?? null;
}

/** 大獎賽積分（名次 1–8）。 */
export const CANDY_KART_GRAND_PRIX_POINTS = [10, 8, 6, 5, 4, 3, 2, 1] as const;

export function grandPrixPointsForPosition(playerPos: number): number {
  if (!Number.isInteger(playerPos) || playerPos < 1) return 0;
  return CANDY_KART_GRAND_PRIX_POINTS[playerPos - 1] ?? 0;
}

/** 單場獲勝名次門檻：前 3 名算「通關」（cleared 星）。 */
export const CANDY_KART_CLEAR_POSITION = 3;
