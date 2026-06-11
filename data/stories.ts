// ============================================================
// 車車遊樂園 — 故事資料
// ============================================================
// 內容對應 podcast《車車遊樂園》(Bonbon & 馬米) 的真實集數。
// 每則故事對應 public/stories/<slug>/：
//   - audio.mp3        該集真實音檔
//   - 01.jpg ~ NN.jpg  看圖翻頁用的插畫（pageCount 需與檔案數一致）
//
// 資料來源：
//   - manualStories：下方手動維護（EP1–6，slug 為 ep-N）
//   - apple-synced.json：npm run sync:apple 從 Apple Podcast 追加（MVP 單圖）
//
// 查詢 API 請使用 data/content.ts（getStories / getAllContent）。
// ============================================================

/** 手動維護的故事原始資料（不含 kind；由 content.ts 補齊）。 */
export type ManualStory = {
  slug: string;
  ep: number;
  title: string;
  date: string;
  duration?: string;
  vehicle: string;
  emoji: string;
  color: string;
  audio: string;
  pageCount: number;
  summary?: string;
  ageRange?: string;
  tags?: string[];
  captions?: string[];
  captionTimes?: number[];
  reflectionPrompt?: {
    child: string;
    parentFollowUp: string;
  };
};

/** 手動維護的故事（sync 腳本不會修改此陣列）。 */
export const manualStories: ManualStory[] = [
  {
    slug: "ep-6",
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
    ageRange: "3–7 歲",
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
    slug: "ep-5",
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
    ageRange: "3–7 歲",
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
    slug: "ep-4",
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
    ageRange: "3–7 歲",
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
    slug: "ep-3",
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
    ageRange: "4–7 歲",
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
    slug: "ep-2",
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
    ageRange: "4–7 歲",
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
    slug: "ep-1",
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
