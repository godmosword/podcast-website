import appleSynced from "./apple-synced.json";
import { getCharactersForStory } from "./characters";
import { manualStories, type ManualStory } from "./stories";
import { storyCoverPath } from "@/lib/story-utils";

export type ContentBase = {
  slug: string;
  title: string;
  date: string;
  tags?: string[];
  ageRange?: string;
  emoji?: string;
  color?: string;
};

export type Story = ContentBase & {
  kind: "story";
  emoji: string;
  color: string;
  ep: number;
  vehicle: string;
  audio: string;
  pageCount: number;
  duration?: string;
  summary?: string;
  captions?: string[];
  captionTimes?: number[];
  characterIds?: string[];
  reflectionPrompt?: {
    child: string;
    parentFollowUp: string;
  };
};

export type CraftStep = { image: string; voiceLine: string };

export type Craft = ContentBase & {
  kind: "craft";
  steps: CraftStep[];
  materials?: string[];
};

export type Printable = ContentBase & {
  kind: "printable";
  pdfUrl: string;
  pageCount?: number;
};

export type Content = Story | Craft | Printable;

type RawStory = ManualStory;

function enrichStory(raw: RawStory): Story {
  const characters = getCharactersForStory(raw.slug);
  return {
    ...raw,
    kind: "story",
    characterIds: characters.map((c) => c.id),
  };
}

function sortByEp(list: Story[]): Story[] {
  return [...list].sort((a, b) => b.ep - a.ep);
}

const storyList: Story[] = sortByEp([
  ...manualStories.map(enrichStory),
  ...(appleSynced as RawStory[]).map(enrichStory),
]);

/** 所有內容聯集（目前僅故事；craft / printable 預留）。 */
export function getAllContent(): Content[] {
  return storyList;
}

export function getStories(): Story[] {
  return storyList;
}

/** @deprecated 請改用 getStories() */
export const stories = storyList;

export function getStory(slug: string): Story | undefined {
  return storyList.find((story) => story.slug === slug);
}

export function getNextStory(slug: string): Story | undefined {
  const sorted = storiesByNewest();
  const idx = sorted.findIndex((s) => s.slug === slug);
  if (idx < 0 || idx >= sorted.length - 1) return undefined;
  return sorted[idx + 1];
}

export function getStoriesByVehicle(vehicle: string): Story[] {
  return storiesByNewest().filter((s) => s.vehicle === vehicle);
}

export function storiesByNewest(): Story[] {
  return [...storyList].sort((a, b) => b.ep - a.ep);
}

export function allVehicles(): string[] {
  return Array.from(new Set(storyList.map((s) => s.vehicle)));
}

export function getVehicleCoverPath(vehicle: string): string | null {
  const slug = storyList.find((s) => s.vehicle === vehicle)?.slug;
  return slug ? storyCoverPath(slug) : null;
}

export function allTags(): string[] {
  return Array.from(new Set(storyList.flatMap((s) => s.tags ?? []))).sort((a, b) =>
    a.localeCompare(b, "zh-Hant"),
  );
}

export function getStoriesByTag(tag: string): Story[] {
  return storiesByNewest().filter((s) => (s.tags ?? []).includes(tag));
}

export function getRelated(slug: string, limit = 3): Story[] {
  const current = getStory(slug);
  if (!current) return [];

  const currentTags = new Set(current.tags ?? []);

  return storyList
    .filter((s) => s.slug !== slug)
    .map((s) => {
      const sharedTags = (s.tags ?? []).filter((t) => currentTags.has(t)).length;
      const sameVehicle = s.vehicle === current.vehicle ? 1 : 0;
      return { story: s, score: sharedTags + sameVehicle };
    })
    .sort((a, b) => b.score - a.score || b.story.ep - a.story.ep)
    .slice(0, limit)
    .map((x) => x.story);
}
