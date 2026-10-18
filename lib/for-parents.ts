import { allVehicles, getStories, getStory, storiesByNewest } from "@/data/content";
import { getCharacters } from "@/data/characters";
import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

/** 官網對外呈現的適合年齡（家長 GEO 文案定稿）。 */
const PARENT_SITE_AGE_RANGE = "約 3–7 歲";

/** 新集多快出現在網站（白話；對齊 sync watchdog 每 15 分鐘的後備排程）。 */
const PARENT_SYNC_CADENCE = "15 分鐘內";

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

/**
 * 編輯手選的起手集，順序維持原樣。新集上架不改這份清單，也不依「哪集比較好」重挑。
 */
const CURATED_PARENT_STORY_SLUGS = ["ep-16", "ep-15", "ep-14", "ep-6"] as const;

/**
 * 接在手選前面的最新集數。4 對齊關於頁四欄一列，只依上架順序，不挑內容。
 */
const LATEST_PARENT_STORY_COUNT = 4;

export function representativeParentStories(): Story[] {
  const curated = CURATED_PARENT_STORY_SLUGS.map((slug) => getStory(slug)).filter(
    (story): story is Story => Boolean(story),
  );
  const seen = new Set<string>();
  const stories: Story[] = [];

  for (const story of storiesByNewest()) {
    if (stories.length >= LATEST_PARENT_STORY_COUNT) break;
    seen.add(story.slug);
    stories.push(story);
  }

  for (const story of curated) {
    if (seen.has(story.slug)) continue;
    seen.add(story.slug);
    stories.push(story);
  }

  if (stories.length >= 3) return stories;

  for (const story of storiesByNewest()) {
    if (seen.has(story.slug)) continue;
    seen.add(story.slug);
    stories.push(story);
    if (stories.length >= 3) break;
  }

  return stories;
}

export function parentLandingFaqs(
  facts: ParentLandingFacts = parentLandingFacts(),
): FaqItem[] {
  return [
    {
      question: "有哪些適合 3–7 歲的中文車車 Podcast？",
      answer: `車車遊樂園是適合${facts.ageRange}親子共聽的${facts.language}車車故事 Podcast，目前官網收錄 ${facts.episodeCount} 集，包含車車、情緒、合作、好習慣等主題。`,
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
      answer: `新集在 Podcast 上架後會自動同步到網站，通常 ${facts.syncCadence}就會出現；上架節奏以 Podcast 發布為準。`,
    },
  ];
}
