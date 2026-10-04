/** 《繽紛消消樂》關卡資料（企劃第六節 10 關）。 */

/** 圖案＝車車角色（最多 5 種；levels 以索引 0..4 取前 N 種）。 */
export const CANDY_MATCH_PIECES = [
  { id: "xiao-hong", name: "小紅", color: "#ff7a9c" },
  { id: "taxi", name: "計程車", color: "#ffd34d" },
  { id: "bus", name: "小巴士", color: "#6fc3f0" },
  { id: "ling-ling", name: "鈴鈴", color: "#7fd4a8" },
  { id: "duo-duo", name: "多多", color: "#c9a8ff" },
] as const;

/** 地圖站：名稱、圖示、主題色與棋盤尺寸（同一關跨裝置與玩法格數相同）。 */
export type CandyMatchLevel = {
  index: number;
  name: string;
  /** 關卡地圖節點名（企劃第二節） */
  place: string;
  /** K-6：地圖節點的黏土小圖（public/games/v2/candy-match/places/<placeIcon>.webp），孩子不識字靠圖認站 */
  placeIcon: string;
  cols: number;
  rows: number;
  /** 主題色（背景漸層） */
  themeA: string;
  themeB: string;
};

/** 1–2 關 6×6、3–5 關 6×7、6–10 關 6×8；手機保留六欄。 */
export const CANDY_MATCH_LEVELS: readonly CandyMatchLevel[] = [
  { index: 0, name: "認識消除", place: "彩虹入口", placeIcon: "rainbow-gate", cols: 6, rows: 6, themeA: "#fff3f9", themeB: "#e8f7ff" },
  { index: 1, name: "收集小紅", place: "泡泡廣場", placeIcon: "bubble-plaza", cols: 6, rows: 6, themeA: "#eaf6ff", themeB: "#fff0f7" },
  { index: 2, name: "雙色任務", place: "冰淇淋小店", placeIcon: "ice-cream-shop", cols: 6, rows: 7, themeA: "#fff8e6", themeB: "#ffeef5" },
  { index: 3, name: "做出特殊糖", place: "旋轉木馬", placeIcon: "carousel", cols: 6, rows: 7, themeA: "#eef3ff", themeB: "#fdf0ff" },
  { index: 4, name: "清潔小廣場", place: "清潔廣場", placeIcon: "clean-plaza", cols: 6, rows: 7, themeA: "#eefaf0", themeB: "#f3f6ff" },
  { index: 5, name: "鈴鈴派對", place: "小小賽道", placeIcon: "mini-track", cols: 6, rows: 8, themeA: "#effaf2", themeB: "#fff5ea" },
  { index: 6, name: "摩天輪亮起來", place: "摩天輪", placeIcon: "ferris-wheel", cols: 6, rows: 8, themeA: "#fdf3ff", themeB: "#eef8ff" },
  { index: 7, name: "禮物送下來", place: "星星舞台", placeIcon: "star-stage", cols: 6, rows: 8, themeA: "#fff5e8", themeB: "#f1f0ff" },
  { index: 8, name: "繽紛大遊行", place: "甜甜圈屋", placeIcon: "donut-house", cols: 6, rows: 8, themeA: "#fff0f4", themeB: "#eefcf4" },
  { index: 9, name: "煙火慶祝", place: "繽紛煙火", placeIcon: "fireworks", cols: 6, rows: 8, themeA: "#f0ecff", themeB: "#ffeef2" },
];
