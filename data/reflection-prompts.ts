/** 各集親子反思提問（無標準答案，供詳情頁與播放結束畫面）。 */
const REFLECTION_PROMPTS: Record<
  string,
  { child: string; parentFollowUp: string }
> = {
  "ep-9": {
    child: "你覺得多多為什麼要睡前刷牙呢？",
    parentFollowUp:
      "可以和孩子一起回想故事裡「牙齒黃黃黏黏」的感覺，討論什麼時候需要刷牙、誰可以提醒。",
  },
  "ep-8": {
    child: "如果你是怪獸卡車，你會怎麼輕輕開過螢火蟲旁邊？",
    parentFollowUp:
      "引導孩子描述「慢一點、小聲一點」的具體做法，連結到日常會打擾別人的情境。",
  },
  "ep-7": {
    child: "如果計畫突然改變，你會先做什麼？",
    parentFollowUp: "分享自己遇到延誤時的冷靜步驟，鼓勵孩子說出可控制的選項。",
  },
  "ep-6": {
    child: "什麼時候你會願意開口說「我需要幫忙」？",
    parentFollowUp: "肯定求助是勇敢，討論家中可以找誰幫忙。",
  },
  "ep-5": {
    child: "東東一鏟一鏟往前，你遇過什麼事要慢慢完成？",
    parentFollowUp: "把「害怕但願意試」連結到孩子正在學的新技能。",
  },
  "ep-4": {
    child: "鈴鈴答應的事，你覺得守信用是什麼意思？",
    parentFollowUp: "舉一個家庭裡說到做到的小例子，讓孩子說說自己的承諾。",
  },
  "ep-3": {
    child: "不是第一名時，心情會怎樣？你會怎麼讓自己好一點？",
    parentFollowUp: "不否定難過，一起想整理心情的方法（深呼吸、休息、再試一次）。",
  },
  "ep-2": {
    child: "小飛幫忙找兔子時，遵守了哪些安全規則？",
    parentFollowUp: "連結公園或戶外活動的安全約定，請孩子舉一個要遵守的規則。",
  },
  "ep-1": {
    child: "如果你可以設計一台未來電動車，它會做什麼事？",
    parentFollowUp: "鼓勵天馬行空，再問「這個設計要幫誰解決什麼問題」。",
  },
};

export function getReflectionPrompt(slug: string) {
  return REFLECTION_PROMPTS[slug];
}
