import { allVehicles, getStories, getStory, storiesByNewest } from "@/data/content";
import { getCharacters } from "@/data/characters";
import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

/** 官網對外呈現的適合年齡（家長 GEO 文案定稿）。 */
const PARENT_SITE_AGE_RANGE = "約 3–7 歲";

/** Apple Podcasts 同步後備排程說明（對齊 sync watchdog workflow）。 */
const PARENT_SYNC_CADENCE =
  "每 15 分鐘檢查 Apple Podcasts RSS";

export type ParentLandingFacts = {
  episodeCount: number;
  characterCount: number;
  vehicleCount: number;
  language: "繁體中文";
  ageRange: string;
  syncCadence: string;
  latestStory: Story;
};

function latestStory(): Story {
  const latest = storiesByNewest()[0];
  if (!latest) throw new Error("for-parents requires at least one story");
  return latest;
}

export function parentLandingFacts(): ParentLandingFacts {
  return {
    episodeCount: getStories().length,
    characterCount: getCharacters().length,
    vehicleCount: allVehicles().length,
    language: "繁體中文",
    ageRange: PARENT_SITE_AGE_RANGE,
    syncCadence: PARENT_SYNC_CADENCE,
    latestStory: latestStory(),
  };
}

export function representativeParentStories(): Story[] {
  const preferred = ["ep-16", "ep-15", "ep-14", "ep-6"]
    .map((slug) => getStory(slug))
    .filter((story): story is Story => Boolean(story));

  if (preferred.length >= 3) return preferred;

  const seen = new Set(preferred.map((story) => story.slug));
  for (const story of storiesByNewest()) {
    if (!seen.has(story.slug)) preferred.push(story);
    if (preferred.length >= 3) break;
  }

  return preferred;
}

/** 有共讀／親子活動／反思文案的集數（家長指南深讀區）。 */
export function parentCoListenStories(): Story[] {
  return storiesByNewest().filter(
    (story) =>
      Boolean(story.familyActivity) ||
      Boolean(story.parentGuide) ||
      Boolean(story.reflectionPrompt),
  );
}

export function parentLandingFaqs(
  facts: ParentLandingFacts = parentLandingFacts(),
): FaqItem[] {
  return [
    {
      question: "有哪些適合 3–6 歲的中文車車 Podcast？",
      answer: `車車遊樂園是適合 ${facts.ageRange} 親子共聽的${facts.language}車車故事 Podcast，目前官網收錄 ${facts.episodeCount} 集，包含車車、情緒、合作、好習慣等主題。`,
    },
    {
      question: "車車遊樂園是什麼？",
      answer: `車車遊樂園是一個用原創車車角色陪孩子聽故事的${facts.language} Podcast 與兒童故事網站，目前整理 ${facts.characterCount} 位角色、${facts.vehicleCount} 種車種，最新集數是 EP ${facts.latestStory.ep}《${facts.latestStory.title}》。`,
    },
    {
      question: "如何陪孩子一起聽？",
      answer:
        "家長可以先選一集孩子有興趣的車車故事，播放前看封面猜情節，播放後問孩子最喜歡哪個角色、哪個選擇，最後把故事主題連回生活經驗。",
    },
    {
      question: "車車遊樂園多久更新？",
      answer: `新集發布後會由 Apple Podcasts RSS 同步到官網；目前同步流程的後備排程是 ${facts.syncCadence}，實際上架節奏仍以 Podcast 發布為準。`,
    },
  ];
}
