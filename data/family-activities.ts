/**
 * 各集「聽完聊一聊」親子延伸活動（sidecar，以 slug 為 key）。
 * 與 reflection-prompts.ts 同模式：不寫入 stories 原始資料，
 * 避免被 Apple sync 覆寫；於 data/content.ts enrichStory() 合併。
 */
export type FamilyActivity = {
  /** 親子討論問題（3–7 歲、口語化） */
  question: string;
  /** 選填：離線可做的延伸小活動 */
  activity?: string;
};

const FAMILY_ACTIVITIES: Record<string, FamilyActivity> = {
  "ep-5": {
    question: "你家附近看過挖土機嗎？它在做什麼呢？",
    activity:
      "和孩子一起用手當挖斗，「一鏟一鏟」把玩具或襪子搬回收納箱，體驗東東慢慢完成任務的感覺。",
  },
  "ep-1": {
    question: "如果家裡的車車會自己充電，你希望它載你去哪裡？",
    activity:
      "散步時找找路邊的充電站或電動車，數一數今天遇到幾台，回家畫下最喜歡的一台。",
  },
};

export function getFamilyActivity(slug: string): FamilyActivity | undefined {
  return FAMILY_ACTIVITIES[slug];
}
