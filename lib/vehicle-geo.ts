import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

function storyShortTitle(story: Story): string {
  return story.title.split("｜")[0]?.trim() || story.title;
}

function representativeExamples(stories: Story[]): string {
  const picks = stories.slice(0, 2).map((story) => `EP ${story.ep}《${storyShortTitle(story)}》`);
  return picks.join("、");
}

/** 車種聚合頁的 answer-first 導言。 */
export function vehicleDefinitionSummary(vehicle: string, stories: Story[]): string {
  const examples = representativeExamples(stories);
  return `車車遊樂園收錄 ${stories.length} 則${vehicle}相關親子故事，適合喜歡車車角色的孩子挑選收聽。代表集數包含${examples}等。`;
}

export function vehicleFaqs(vehicle: string, stories: Story[]): FaqItem[] {
  return [
    {
      question: `車車遊樂園有哪些${vehicle}故事？`,
      answer: `官網目前收錄 ${stories.length} 則${vehicle}相關故事，可先從封面與本集介紹和孩子一起挑選。`,
    },
    {
      question: `${vehicle}故事適合幾歲？`,
      answer:
        "多數集數適合約 3–7 歲親子共聽；每集故事頁有本集介紹與家長延伸問題，可依孩子狀況調整。",
    },
    {
      question: `怎麼陪孩子聽${vehicle}故事？`,
      answer: `先選一集孩子有興趣的封面，聽完問孩子最喜歡哪台車或哪個選擇，再把${vehicle}角色連回日常生活觀察。`,
    },
  ];
}
