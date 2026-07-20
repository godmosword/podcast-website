import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

function storyShortTitle(story: Story): string {
  return story.title.split("｜")[0]?.trim() || story.title;
}

function representativeExamples(stories: Story[]): string {
  const picks = stories.slice(0, 2).map((story) => `EP ${story.ep}《${storyShortTitle(story)}》`);
  return picks.join("、");
}

const TOPIC_WHEN_HINTS: Record<string, string> = {
  睡前: "適合晚間放鬆、建立睡前儀式時挑一集",
  好習慣: "想聊刷牙、整理等日常習慣時可先聽",
  情緒: "孩子有情緒起伏、需要被理解時很實用",
  勇氣: "面對新挑戰或需要鼓起勇氣時共聽",
  勇敢: "孩子害怕嘗試新事物時可先選這類故事",
  安全: "出門、交通或生活安全話題的共聽起點",
  合作: "和手足、同學一起完成任務前可先聽",
  守信用: "約定與說到做到的情境討論前適合",
  求助: "教孩子敢開口請人幫忙時可參考",
  助人: "想培養關心他人、互相幫忙時挑選",
  成長: "適合聊「長大了一點」的變化與選擇",
  接受失敗: "比賽輸了或事情不如預期時共聽",
  想像力: "想延伸創意遊戲或天馬行空時很合適",
  創意: "手作、解題或換個做法時可先聽",
  負責: "分配任務、自己把事情完成時適用",
};

function topicWhenHint(tag: string): string {
  return TOPIC_WHEN_HINTS[tag] ?? `想和孩子一起聊「${tag}」相關情境時`;
}

/** 主題聚合頁的 answer-first 導言（短段，不堆滿列表頁）。 */
export function topicDefinitionSummary(tag: string, stories: Story[]): string {
  const examples = representativeExamples(stories);
  const when = topicWhenHint(tag);
  return `本頁收錄 ${stories.length} 則「${tag}」標籤的車車親子故事；${when}。可先從${examples}等集數開始，再依封面與本集介紹和孩子一起選。`;
}

export function topicFaqs(tag: string, stories: Story[]): FaqItem[] {
  return [
    {
      question: `車車遊樂園有哪些「${tag}」主題故事？`,
      answer: `官網目前收錄 ${stories.length} 則「${tag}」標籤故事，可先從封面與本集介紹和孩子一起挑選。`,
    },
    {
      question: `「${tag}」主題故事適合幾歲？`,
      answer:
        "多數集數適合約 3–7 歲親子共聽；每集故事頁有本集介紹與家長延伸問題，可依孩子狀況調整。",
    },
    {
      question: `怎麼陪孩子聽「${tag}」主題故事？`,
      answer: `先選一集孩子有興趣的封面，聽完問孩子故事裡哪個選擇或感受最深刻，再把「${tag}」連回日常生活。`,
    },
  ];
}
