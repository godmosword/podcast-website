import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

function storyShortTitle(story: Story): string {
  return story.title.split("｜")[0]?.trim() || story.title;
}

function representativeExamples(stories: Story[]): string {
  const picks = stories.slice(0, 2).map((story) => `EP ${story.ep}《${storyShortTitle(story)}》`);
  return picks.join("、");
}

const VEHICLE_WHEN_HINTS: Record<string, string> = {
  消防車: "喜歡救災、助人題材的孩子常從這裡開始",
  救護車: "對醫護與幫助他人有興趣時可先挑",
  警車: "規則、秩序或安全守護話題時很合適",
  清潔車: "日常街道觀察、環境整潔話題很貼近生活",
  挖土機: "工程、建造與「把事情完成」情境時可聽",
  怪獸卡車: "偏愛大車、力量感角色時通常很買帳",
  恐龍車: "恐龍加車車的想像組合，創意遊戲前可先聽",
  賽車: "速度、競賽與接受輸贏的共聽時機適用",
  高鐵: "出遠門、旅行或認識交通工具時可挑",
  餐車: "美食、分享與小創業想像的輕鬆入口",
  電動車: "環保、新科技與未來城市話題時可先聽",
  無人機: "空拍、科技應用與安全規則討論時適用",
  其他: "想跳脫固定車種、探索多元角色時可瀏覽",
};

function vehicleWhenHint(vehicle: string): string {
  return (
    VEHICLE_WHEN_HINTS[vehicle] ??
    `孩子特別喜歡${vehicle}角色、想集中聽同類車車故事時`
  );
}

/** 車種聚合頁的 answer-first 導言。 */
export function vehicleDefinitionSummary(vehicle: string, stories: Story[]): string {
  const examples = representativeExamples(stories);
  const when = vehicleWhenHint(vehicle);
  return `本頁整理 ${stories.length} 則以${vehicle}為主角或關鍵角色的親子故事；${when}。代表集數包含${examples}等，可依封面與本集介紹再選。`;
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
