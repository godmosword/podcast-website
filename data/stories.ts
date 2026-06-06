// ============================================================
// 車車遊樂園 — 故事資料
// ============================================================
// 內容對應 podcast《車車遊樂園》(Bonbon & 馬米) 的真實集數。
// 每則故事對應 public/stories/<slug>/：
//   - audio.mp3        該集真實音檔
//   - 01.jpg ~ NN.jpg  看圖翻頁用的插畫（pageCount 需與檔案數一致）
//
// 資料來源：
//   - manualStories：下方手動維護（既有 6 集，完整插畫）
//   - apple-synced.json：npm run sync:apple 從 Apple Podcast 追加（MVP 單圖）
//
// 手動新增一集：在 manualStories 加一筆 + public/stories/<slug>/
// Apple 新集：每日 GHA 或本機 sync:apple，再視需要改 apple-synced.json / overrides
// ============================================================

import appleSynced from "./apple-synced.json";
import { storyCoverPath } from "@/lib/story-utils";

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
  /** 插圖張數（01.jpg～NN.jpg） */
  pageCount: number;
  /** 選填：一句話故事大綱 */
  summary?: string;
  /** 選填：建議年齡，如「3–8 歲」；未填則 UI 不顯示 */
  ageRange?: string;
  /** 選填：主題關鍵字（用於篩選與推薦） */
  tags?: string[];
  /**
   * 選填：字幕軌。播放時會跟著音檔進度自動換句（疊在插圖上）。
   * 為依官方節目大綱改寫的故事摘要，非逐字稿；可自由編輯。
   */
  captions?: string[];
  /**
   * 選填：即時字幕。每句字幕的「起始秒數」，需與 captions 一一對應且遞增。
   * 有提供時，播放器在精準時間換句（與插圖同步）；未提供則回退為時長平均切換。
   * 取得方式：在播放頁加 `?cue=1` 進入「字幕對時模式」，邊聽邊點記下每句秒數再複製貼回。
   */
  captionTimes?: number[];
};

/** 手動維護的故事（sync 腳本不會修改此陣列）。 */
export const manualStories: Story[] = [
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
    ageRange: "3–8 歲",
    tags: ["勇敢", "合作", "求助"],
    captions: [
      "安安救護車今天要出任務，幫助需要幫忙的朋友。",
      "路上遇到了好大的困難，安安有點緊張。",
      "安安鼓起勇氣大聲說：「我需要幫忙！」",
      "好朋友們聽到了，馬上趕來幫忙。",
      "大家分工合作，困難一下子就解決了。",
      "原來開口求助，也是一種勇敢！",
    ],
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
    ageRange: "3–8 歲",
    tags: ["勇氣", "成長"],
    captions: [
      "東東挖土機有點膽小，做事常常怕怕的。",
      "今天有一個重要的任務要完成。",
      "東東深呼吸，告訴自己：「我可以的！」",
      "一鏟一鏟，東東慢慢往前挖。",
      "雖然會怕，東東還是勇敢完成了任務。",
      "東東長大了，變得更有勇氣囉！",
    ],
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
    ageRange: "3–8 歲",
    tags: ["守信用", "負責"],
    captions: [
      "鈴鈴清潔車每天用音樂鈴叫大家起床。",
      "有一天，她的音樂鈴突然壞掉了。",
      "鈴鈴沒有放棄，努力想別的辦法。",
      "她一家一家提醒車車朋友起床。",
      "答應的事，鈴鈴一定說到做到。",
      "守信用的鈴鈴，是大家最好的鬧鐘！",
    ],
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
    ageRange: "4–8 歲",
    tags: ["勇氣", "接受失敗"],
    captions: [
      "小紅賽車最喜歡比賽，跑得飛快。",
      "這次比賽，小紅卻沒有得到第一名。",
      "小紅有點難過，心情亂亂的。",
      "慢慢地，小紅整理好自己的心情。",
      "「不是第一名，也沒關係！」",
      "勇敢完成比賽，才是最棒的事。",
    ],
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
    ageRange: "4–8 歲",
    tags: ["安全", "合作", "助人"],
    captions: [
      "公園裡來了一台可愛的無人機小飛。",
      "有個小妹妹的小兔子不見了，好著急。",
      "小飛飛上天空，幫忙到處尋找。",
      "大家一起合作，終於找到了小兔子！",
      "小飛記得要安全飛行、遵守規則。",
      "幫助別人，讓小飛覺得好溫暖。",
    ],
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
    ageRange: "3–7 歲",
    tags: ["想像力", "創意"],
    captions: [
      "Bonbon 想像出神奇的未來電動車。",
      "車上有剪頭髮車，坐車也能變帥變美。",
      "還有洗澡車，髒髒的也不怕。",
      "更有運動車，坐車就能動一動。",
      "坐這台車一點都不無聊！",
      "發揮想像力，未來什麼都有可能。",
    ],
  },
];

function sortByEp(list: Story[]): Story[] {
  return [...list].sort((a, b) => b.ep - a.ep);
}

/** 所有故事（手動 + Apple 同步），依集數由新到舊。 */
export const stories: Story[] = sortByEp([
  ...manualStories,
  ...(appleSynced as Story[]),
]);

/** 依 slug 取得故事；找不到回傳 undefined。 */
export function getStory(slug: string): Story | undefined {
  return stories.find((story) => story.slug === slug);
}

/** 依集數由新到舊，取得「下一集」（較早的集數）。 */
export function getNextStory(slug: string): Story | undefined {
  const sorted = storiesByNewest();
  const idx = sorted.findIndex((s) => s.slug === slug);
  if (idx < 0 || idx >= sorted.length - 1) return undefined;
  return sorted[idx + 1];
}

/** 依車種篩選故事（由新到舊）。 */
export function getStoriesByVehicle(vehicle: string): Story[] {
  return storiesByNewest().filter((s) => s.vehicle === vehicle);
}

/** 所有故事，依集數由新到舊排序（不改動原陣列）。 */
export function storiesByNewest(): Story[] {
  return [...stories].sort((a, b) => b.ep - a.ep);
}

/** 所有出現過的車種（依故事順序去重）。 */
export function allVehicles(): string[] {
  return Array.from(new Set(stories.map((s) => s.vehicle)));
}

/** 依車種取得代表 emoji（取該車種第一則故事的 emoji）。 */
export function getVehicleEmoji(vehicle: string): string {
  return stories.find((s) => s.vehicle === vehicle)?.emoji ?? "🚗";
}

/** 依車種取得黏土風代表封面（該車種第一則故事的 01.jpg）。 */
export function getVehicleCoverPath(vehicle: string): string | null {
  const slug = stories.find((s) => s.vehicle === vehicle)?.slug;
  return slug ? storyCoverPath(slug) : null;
}

/** 所有出現過的主題標籤（去重、繁中排序）。 */
export function allTags(): string[] {
  return Array.from(new Set(stories.flatMap((s) => s.tags ?? []))).sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

/** 依主題標籤篩選故事（由新到舊）。 */
export function getStoriesByTag(tag: string): Story[] {
  return storiesByNewest().filter((s) => (s.tags ?? []).includes(tag));
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
