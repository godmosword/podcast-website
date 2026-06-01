// ============================================================
// 車車故事屋 — 故事資料
// ============================================================
// 這是我手動編輯的故事清單。每則故事對應 public/stories/<slug>/
// 資料夾，裡面放 01.jpg ~ NN.jpg（數字補零兩位）與一個音檔。
//
// 新增故事只要兩步：
//   1. 建立 public/stories/<slug>/，放入圖片與音檔
//   2. 在下方 stories 陣列加一筆資料
// ============================================================

/** 一則故事的資料結構。 */
export type Story = {
  /** 網址與資料夾名稱，對應 public/stories/<slug>/ */
  slug: string;
  /** 卡片與播放頁標題 */
  title: string;
  /** 卡片圖示（emoji） */
  emoji: string;
  /** 卡片主題色（hex），用於邊框、陰影、播放鈕 */
  color: string;
  /** 音檔檔名，放在 public/stories/<slug>/ 底下 */
  audio: string;
  /** 圖片張數；檔名固定 01.jpg ~ NN.jpg（補零兩位） */
  pageCount: number;
  /** 選填：每頁一句字幕，長度應等於 pageCount */
  captions?: string[];
};

/** 所有故事。手動在這裡新增、編輯。 */
export const stories: Story[] = [
  {
    slug: "red-truck",
    title: "紅色大卡車",
    emoji: "🚚",
    color: "#e4572e",
    audio: "audio.mp3",
    pageCount: 10,
    captions: [
      "這是一台紅色的大卡車，它最喜歡載東西了。",
      "早上太陽公公起床，大卡車也發動引擎，嘟嘟！",
      "第一站，大卡車載了滿滿一車新鮮的蘋果。",
      "經過彎彎的山路，大卡車開得又穩又慢。",
      "下雨了，雨刷刷刷刷，把擋風玻璃擦得亮亮的。",
      "大卡車把蘋果送到市場，大家都好開心。",
      "中午休息時間，大卡車在大樹下乘涼。",
      "傍晚，大卡車載著小朋友的玩具回家。",
      "天黑了，大卡車打開亮亮的大燈，照著回家的路。",
      "辛苦了一天，大卡車說晚安，明天再出發！",
    ],
  },

  // ----------------------------------------------------------
  // 範例：如何新增第二則故事
  // 1) 建立資料夾 public/stories/blue-boat/
  //    放入 01.jpg ~ 08.jpg 與 audio.mp3
  // 2) 取消下面的註解，依需求修改：
  // ----------------------------------------------------------
  // {
  //   slug: "blue-boat",
  //   title: "藍色小船",
  //   emoji: "⛵",
  //   color: "#2e86e4",
  //   audio: "audio.mp3",
  //   pageCount: 8,
  //   captions: [
  //     "藍色小船浮在海面上⋯⋯",
  //     // ⋯ 共 8 句，長度要等於 pageCount
  //   ],
  // },
];

/** 依 slug 取得故事；找不到回傳 undefined。 */
export function getStory(slug: string): Story | undefined {
  return stories.find((story) => story.slug === slug);
}
