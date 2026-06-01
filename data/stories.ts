// ============================================================
// 車車故事屋 — 故事資料
// ============================================================
// 內容對應 podcast《車車遊樂園》(Bonbon & 馬米) 的真實集數。
// 每則故事對應 public/stories/<slug>/：
//   - audio.mp3        該集真實音檔（已自 SoundOn 下載自存）
//   - 01.jpg ~ NN.jpg  看圖翻頁用的插畫（目前為佔位圖，待替換）
//
// 新增 / 更新故事兩步：
//   1. 在 public/stories/<slug>/ 放圖片與音檔
//   2. 在下方 stories 陣列加 / 改一筆
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
  /** 選填：音檔時長字串，如 "5:48" */
  duration?: string;
  /** 車種（主分類），用於首頁篩選 */
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
  /** 選填：主題關鍵字（用於篩選與推薦） */
  tags?: string[];
  /** 選填：每頁一句字幕，長度應等於 pageCount */
  captions?: string[];
};

/** 所有故事。手動在這裡新增、編輯。 */
export const stories: Story[] = [
  {
    slug: "ambulance",
    ep: 6,
    title: "安安救護車｜勇敢說出我需要幫忙",
    date: "2026-05-28",
    duration: "5:48",
    vehicle: "救護車",
    emoji: "🚑",
    color: "#e03131",
    audio: "audio.mp3",
    pageCount: 6,
    summary: "安安救護車出任務時遇到困難，學會開口求助，和夥伴一起合作完成任務。",
    tags: ["勇敢", "合作", "求助"],
  },
  {
    slug: "excavator",
    ep: 5,
    title: "東東挖土機的勇氣任務",
    date: "2026-05-26",
    duration: "5:21",
    vehicle: "挖土機",
    emoji: "🚜",
    color: "#f59f00",
    audio: "audio.mp3",
    pageCount: 6,
    summary: "東東挖土機有點膽小，卻鼓起勇氣，一步步完成任務。",
    tags: ["勇氣", "成長"],
  },
  {
    slug: "sweeper",
    ep: 4,
    title: "守信用的鈴鈴清潔車",
    date: "2026-05-20",
    duration: "4:21",
    vehicle: "清潔車",
    emoji: "🚛",
    color: "#0ca678",
    audio: "audio.mp3",
    pageCount: 6,
    summary:
      "鈴鈴清潔車的早安音樂鈴壞掉了，她仍努力提醒車車朋友起床，學會守信用、說到做到。",
    tags: ["守信用", "負責"],
  },
  {
    slug: "racecar",
    ep: 3,
    title: "小紅賽車不是第一名也沒關係",
    date: "2026-05-18",
    duration: "5:50",
    vehicle: "賽車",
    emoji: "🏎️",
    color: "#e64980",
    audio: "audio.mp3",
    pageCount: 6,
    summary:
      "小紅賽車在比賽中遇到挫折，學會接受失敗、整理心情，明白不是第一名也沒關係。",
    tags: ["勇氣", "接受失敗"],
  },
  {
    slug: "drone",
    ep: 2,
    title: "小小無人機出任務",
    date: "2026-05-13",
    duration: "7:41",
    vehicle: "無人機",
    emoji: "🛸",
    color: "#4263eb",
    audio: "audio.mp3",
    pageCount: 6,
    summary:
      "在公園遇見可愛的無人機小飛，大家一起幫小妹妹找回小兔子，學會安全飛行、遵守規則。",
    tags: ["安全", "合作", "助人"],
  },
  {
    slug: "ev",
    ep: 1,
    title: "神奇的未來電動車",
    date: "2026-05-04",
    duration: "6:37",
    vehicle: "電動車",
    emoji: "🚗",
    color: "#7048e8",
    audio: "audio.mp3",
    pageCount: 6,
    summary:
      "Bonbon 發揮創意，想出有剪頭髮車、洗澡車、運動車的未來電動車，坐車不無聊還能完成好多事。",
    tags: ["想像力", "創意"],
  },

  // ----------------------------------------------------------
  // 新增下一集：ep 用最大值（目前是 7），建好 public/stories/<slug>/
  // 放入 audio.mp3 與 01.jpg~NN.jpg，再照上面格式加一筆即可。
  // ----------------------------------------------------------
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
