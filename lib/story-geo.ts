import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

const DEFAULT_AGE_RANGE = "約 3–7 歲";
const SOCIAL_COPY_PATTERN = /(👶|🚗|希望大家|也可許願|留言告訴我們|IG|threads|FB).*/i;

function chars(text: string): string[] {
  return Array.from(text);
}

function clip(text: string, maxLength: number): string {
  const list = chars(text.trim());
  if (list.length <= maxLength) return text.trim();
  return `${list.slice(0, Math.max(1, maxLength - 1)).join("").trim()}…`;
}

function sentenceEnd(text: string): string {
  return /[。！？!?]$/.test(text) ? text : `${text}。`;
}

function cleanSummary(summary?: string): string {
  if (!summary) return "";
  return summary
    .replace(SOCIAL_COPY_PATTERN, "")
    .replace(/h\s*ttps?:\/\/\S+/gi, "")
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function storyPlainSummary(story: Story): string {
  return cleanSummary(story.summary);
}

function compactSummaryPoint(story: Story): string {
  const cleaned = cleanSummary(story.summary);
  if (cleaned) {
    const firstChunk = cleaned.split(/[。！？!?]/)[0]?.trim() ?? cleaned;
    return sentenceEnd(clip(firstChunk, 40));
  }

  const vehicle = story.vehicle === "其他" ? "車車朋友" : story.vehicle;
  return `這一集用${vehicle}故事陪孩子理解${topicText(story)}。`;
}

function coreTitle(story: Story): string {
  return story.title.split("｜")[0]?.trim() || story.title;
}

function storyAgeRange(story: Story): string {
  return story.ageRange ?? DEFAULT_AGE_RANGE;
}

function topicText(story: Story): string {
  const tags = story.tags?.filter(Boolean) ?? [];
  if (tags.length > 0) return tags.slice(0, 2).join("、");
  return story.vehicle === "其他" ? "生活經驗" : story.vehicle;
}

export function storyDefinitionSummary(story: Story): string {
  const title = coreTitle(story);
  const ageRange = storyAgeRange(story);
  const topic = topicText(story);
  let point = compactSummaryPoint(story);

  let summary = `《${title}》是車車遊樂園第 ${story.ep} 集，${point}這一集適合${ageRange}親子共聽，家長可以陪孩子聊${topic}與故事裡的感受。`;

  while (chars(summary).length > 120 && chars(point).length > 22) {
    point = sentenceEnd(clip(point.replace(/[。！？!?]$/, ""), chars(point).length - 6));
    summary = `《${title}》是車車遊樂園第 ${story.ep} 集，${point}這一集適合${ageRange}親子共聽，家長可以陪孩子聊${topic}與故事裡的感受。`;
  }

  if (chars(summary).length < 80) {
    const extended = `${summary}聽完也可以一起回想最喜歡的角色和下一步。`;
    if (chars(extended).length <= 120) return extended;
  }

  return summary;
}

export function storyOutlineItems(story: Story): string[] {
  if (story.captions?.length) return story.captions;

  const items = [
    `本集主題：${coreTitle(story)}`,
    `故事重點：${cleanSummary(story.summary) || compactSummaryPoint(story)}`,
    `適合年齡：${storyAgeRange(story)}親子共聽`,
    `親子延伸：聊聊${topicText(story)}，也可以請孩子說說最想幫哪位角色。`,
  ];

  if (story.tags?.length) {
    items.splice(3, 0, `關鍵主題：${story.tags.slice(0, 3).join("、")}`);
  }

  return items;
}

export function storyParentExtension(story: Story): {
  heading: string;
  prompts: string[];
} {
  const prompts = [
    `聽完後，可以問孩子：「故事裡哪個地方讓你最有感覺？」`,
    `如果孩子願意分享，再一起聊：「下次遇到${topicText(story)}時，我們可以怎麼做？」`,
  ];

  if (story.reflectionPrompt) {
    prompts.unshift(story.reflectionPrompt.child);
    prompts.push(story.reflectionPrompt.parentFollowUp);
  }

  return {
    heading: "家長可以這樣延伸",
    prompts,
  };
}

export function storyFaqs(story: Story): FaqItem[] {
  return [
    {
      question: `這一集適合幾歲的孩子？`,
      answer: `《${coreTitle(story)}》適合${storyAgeRange(story)}親子共聽。若孩子年紀較小，建議由家長陪同看圖、停下來聊角色感受。`,
    },
    {
      question: `這一集在講什麼？`,
      answer: storyDefinitionSummary(story),
    },
    {
      question: `家長可以怎麼陪孩子聽？`,
      answer: `可以先一起看封面，再邊聽邊問孩子注意到哪台車、哪個表情或哪個選擇，最後用自己的生活經驗延伸${topicText(story)}。`,
    },
  ];
}
