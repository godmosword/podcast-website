// ============================================================
// 車車故事屋 — 故事資料
// ============================================================
// 手動編輯的故事清單。每則故事對應 public/stories/<slug>/，
// 裡面放 01.jpg ~ NN.jpg（數字補零兩位）與一個音檔。
//
// 新增故事兩步：
//   1. 建立 public/stories/<slug>/，放入圖片與音檔
//   2. 在下方 stories 陣列加一筆資料
// ============================================================

/** 一則故事的資料結構。 */
export type Story = {
  /** 網址與資料夾名稱，對應 public/stories/<slug>/ */
  slug: string;
  /** 集數編號（越大越新，首頁依此由新到舊排序） */
  ep: number;
  /** 標題 */
  title: string;
  /** 發布日期，ISO 格式 "YYYY-MM-DD" */
  date: string;
  /** 選填：音檔時長字串，如 "3:20" */
  duration?: string;
  /** 車種（主分類），用於首頁篩選，如「卡車」「警車」 */
  vehicle: string;
  /** 卡片圖示（emoji） */
  emoji: string;
  /** 主題色（hex），用於邊框、陰影、播放鈕 */
  color: string;
  /** 音檔檔名，放在 public/stories/<slug>/ 底下 */
  audio: string;
  /** 圖片張數；檔名固定 01.jpg ~ NN.jpg（補零兩位） */
  pageCount: number;
  /** 選填：一句話故事大綱 */
  summary?: string;
  /** 選填：主題關鍵字（如「合作」「勇敢」），用於篩選與推薦 */
  tags?: string[];
  /** 選填：每頁一句字幕，長度應等於 pageCount */
  captions?: string[];
};

/** 所有故事。手動在這裡新增、編輯。 */
export const stories: Story[] = [
  {
    slug: "red-truck",
    ep: 3,
    title: "紅色大卡車",
    date: "2026-06-01",
    duration: "3:30",
    vehicle: "卡車",
    emoji: "🚚",
    color: "#e4572e",
    audio: "audio.mp3",
    pageCount: 10,
    summary: "紅色大卡車載著滿滿的蘋果，從清晨工作到天黑回家，學會努力與堅持。",
    tags: ["努力", "負責", "友善"],
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
  {
    slug: "police-car",
    ep: 2,
    title: "勇敢的小警車",
    date: "2026-05-28",
    duration: "3:10",
    vehicle: "警車",
    emoji: "🚓",
    color: "#1c6dd0",
    audio: "audio.mp3",
    pageCount: 10,
    summary: "藍色小警車在城市裡巡邏，溫柔地幫助迷路與害怕的小朋友，帶來滿滿安全感。",
    tags: ["勇敢", "友善"],
    captions: [
      "這是一台藍色的小警車，閃著亮亮的警示燈。",
      "早上，小警車出門巡邏，保護大家的安全。",
      "公園裡有小朋友迷路了，小警車馬上趕過去。",
      "小警車輕聲說：「別怕，我帶你找媽媽。」",
      "經過熱鬧的市場，大家都跟小警車揮揮手。",
      "紅綠燈壞掉了，小警車幫忙指揮交通。",
      "一隻小貓卡在樹上，小警車想辦法救牠下來。",
      "傍晚，小警車把走失的小狗送回家。",
      "天黑了，小警車的燈還亮著，守護整座城市。",
      "辛苦了一天，小警車說：「大家晚安，明天見！」",
    ],
  },
  {
    slug: "excavator",
    ep: 1,
    title: "合作的挖土機",
    date: "2026-05-25",
    duration: "3:40",
    vehicle: "挖土機",
    emoji: "🚜",
    color: "#f59f00",
    audio: "audio.mp3",
    pageCount: 10,
    summary: "黃色挖土機和工程車好友分工合作，從挖土到種花，一起蓋出漂亮的新公園。",
    tags: ["合作", "分享", "努力"],
    captions: [
      "這是一台黃色的挖土機，力氣大得不得了。",
      "今天要和好朋友一起蓋一座新公園。",
      "挖土機先用大鏟子，把土挖得鬆鬆軟軟。",
      "「我來幫忙！」傾卸卡車把土載走。",
      "大家分工合作，工地一點都不亂。",
      "挖到一顆大石頭，挖土機和卡車一起搬。",
      "中午，大家坐在一起吃飯，聊得好開心。",
      "下午，挖土機把地整理得平平整整。",
      "種上小樹和花，新公園越來越漂亮。",
      "公園蓋好了！大家擊掌說：「合作真棒！」",
    ],
  },

  // ----------------------------------------------------------
  // 範例：如何新增第四則故事
  // 1) 建立資料夾 public/stories/<slug>/，放入 01.jpg~NN.jpg 與 audio.mp3
  // 2) 取消下面註解，依需求修改（ep 用最大值代表最新）：
  // ----------------------------------------------------------
  // {
  //   slug: "fire-truck",
  //   ep: 4,
  //   title: "消防車出動",
  //   date: "2026-06-05",
  //   duration: "3:20",
  //   vehicle: "消防車",
  //   emoji: "🚒",
  //   color: "#f03e3e",
  //   audio: "audio.mp3",
  //   pageCount: 8,
  //   summary: "紅色消防車聽到警鈴聲，勇敢出動，和大家合作撲滅大火。",
  //   tags: ["勇敢", "合作"],
  //   captions: [/* 共 8 句，長度等於 pageCount */],
  // },
];

/** 依 slug 取得故事；找不到回傳 undefined。 */
export function getStory(slug: string): Story | undefined {
  return stories.find((story) => story.slug === slug);
}

/** 所有故事，依集數由新到舊排序（不改動原陣列）。 */
export function storiesByNewest(): Story[] {
  return [...stories].sort((a, b) => b.ep - a.ep);
}

/** 所有出現過的車種（依故事順序去重）。 */
export function allVehicles(): string[] {
  return Array.from(new Set(stories.map((s) => s.vehicle)));
}

/** 所有出現過的主題關鍵字（去重）。 */
export function allTags(): string[] {
  return Array.from(new Set(stories.flatMap((s) => s.tags ?? [])));
}

/**
 * 相關故事：優先同車種或共用標籤，依重疊程度排序，排除自己。
 * @param slug 目前故事
 * @param limit 最多回傳幾筆（預設 3）
 */
export function getRelated(slug: string, limit = 3): Story[] {
  const current = getStory(slug);
  if (!current) return [];

  const currentTags = new Set(current.tags ?? []);

  return stories
    .filter((s) => s.slug !== slug)
    .map((s) => {
      const sharedTags = (s.tags ?? []).filter((t) => currentTags.has(t)).length;
      const sameVehicle = s.vehicle === current.vehicle ? 1 : 0;
      return { story: s, score: sharedTags + sameVehicle };
    })
    .sort((a, b) => b.score - a.score || b.story.ep - a.story.ep)
    .slice(0, limit)
    .map((x) => x.story);
}
