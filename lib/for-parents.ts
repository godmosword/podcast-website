import { allVehicles, getStories, getStory, storiesByNewest } from "@/data/content";
import { getCharacters } from "@/data/characters";
import type { Story } from "@/data/content";
import type { FaqItem } from "@/lib/json-ld";

export type ParentLandingFacts = {
  episodeCount: number;
  characterCount: number;
  vehicleCount: number;
  language: "繁體中文";
  ageRangeDraft: string;
  syncCadenceDraft: string;
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
    ageRangeDraft: "[待確認：約 3–7 歲]",
    syncCadenceDraft: "[待確認：每 15 分鐘檢查 Apple Podcast RSS]",
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

export function parentLandingFaqs(
  facts: ParentLandingFacts = parentLandingFacts(),
): FaqItem[] {
  return [
    {
      question: "有哪些適合 3–6 歲的中文車車 Podcast？",
      answer: `車車遊樂園是適合 ${facts.ageRangeDraft} 親子共聽的${facts.language}車車故事 podcast，目前官網收錄 [待確認：${facts.episodeCount} 集]，包含車車、情緒、合作、好習慣等主題。`,
    },
    {
      question: "車車遊樂園是什麼？",
      answer: `車車遊樂園是一個用原創車車角色陪孩子聽故事的${facts.language} podcast 與兒童故事網站，目前整理 [待確認：${facts.characterCount} 位] 角色、[待確認：${facts.vehicleCount} 種] 車種，最新集數是 EP ${facts.latestStory.ep}《${facts.latestStory.title}》。`,
    },
    {
      question: "如何陪孩子一起聽？",
      answer:
        "家長可以先選一集孩子有興趣的車車故事，播放前看封面猜情節，播放後問孩子最喜歡哪個角色、哪個選擇，最後把故事主題連回生活經驗。",
    },
    {
      question: "車車遊樂園多久更新？",
      answer: `新集發布後會由 Apple Podcast RSS 同步到官網；目前同步流程的後備排程是 ${facts.syncCadenceDraft}，實際上架節奏仍以 podcast 發布為準。`,
    },
  ];
}
