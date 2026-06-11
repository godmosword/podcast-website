import appleSyncDefaults from "./apple-sync.defaults.json";
import appleSynced from "./apple-synced.json";
import { episodeColorForSlug } from "./episode-colors";
import { getCharactersForStory } from "./characters";
import { getReflectionPrompt } from "./reflection-prompts";
import { manualStories, type ManualStory } from "./stories";
import { canonicalStorySlug } from "@/lib/story-slug-aliases";
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

type ManualStoryOverride = Partial<
  Pick<
    ManualStory,
    | "pageCount"
    | "captionTimes"
    | "captions"
    | "vehicle"
    | "emoji"
    | "tags"
    | "summary"
    | "duration"
  >
>;

/** illustrate --approve 寫入 overrides；執行時與 stories.ts／apple-synced 合併（與 sync 腳本邏輯對齊）。 */
function applyStoryOverrides(raw: RawStory): RawStory {
  const overrides = appleSyncDefaults.overrides as
    | Record<string, ManualStoryOverride>
    | undefined;
  const override = overrides?.[raw.slug];
  if (!override) return raw;
  return {
    ...raw,
    ...(override.vehicle !== undefined ? { vehicle: override.vehicle } : {}),
    ...(override.emoji !== undefined ? { emoji: override.emoji } : {}),
    ...(override.tags !== undefined ? { tags: override.tags } : {}),
    ...(override.summary !== undefined ? { summary: override.summary } : {}),
    ...(override.captions !== undefined ? { captions: override.captions } : {}),
    ...(override.captionTimes !== undefined
      ? { captionTimes: override.captionTimes }
      : {}),
    ...(override.duration !== undefined ? { duration: override.duration } : {}),
    ...(override.pageCount !== undefined ? { pageCount: override.pageCount } : {}),
  };
}

function enrichStory(raw: RawStory): Story {
  const merged = applyStoryOverrides(raw);
  const characters = getCharactersForStory(merged.slug);
  const reflectionPrompt =
    merged.reflectionPrompt ?? getReflectionPrompt(merged.slug);
  return {
    ...merged,
    kind: "story",
    color: episodeColorForSlug(merged.slug),
    characterIds: characters.map((c) => c.id),
    reflectionPrompt,
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
  const canonical = canonicalStorySlug(slug);
  return storyList.find((story) => story.slug === canonical);
}

export function getNextStory(slug: string): Story | undefined {
  const canonical = canonicalStorySlug(slug);
  const sorted = storiesByNewest();
  const idx = sorted.findIndex((s) => s.slug === canonical);
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

  const canonical = canonicalStorySlug(slug);
  const currentTags = new Set(current.tags ?? []);

  return storyList
    .filter((s) => s.slug !== canonical)
    .map((s) => {
      const sharedTags = (s.tags ?? []).filter((t) => currentTags.has(t)).length;
      const sameVehicle = s.vehicle === current.vehicle ? 1 : 0;
      return { story: s, score: sharedTags + sameVehicle };
    })
    .sort((a, b) => b.score - a.score || b.story.ep - a.story.ep)
    .slice(0, limit)
    .map((x) => x.story);
}
