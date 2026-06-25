import type { Story } from "@/data/content";
import {
  getStoriesByTag,
  storiesByNewest,
} from "@/data/content";
import {
  LANDING_CLAY_EXTERNAL,
  LANDING_SEGMENT_IDS,
  type LandingSegmentDef,
  LANDING_SEGMENTS,
} from "@/data/landing-segments";

type LandingStoryItem = { kind: "story"; story: Story };
type LandingExternalItem = {
  kind: "external";
  title: string;
  subtitle?: string;
  href: string;
  image: string;
  external: boolean;
};
type LandingGameItem = {
  kind: "game";
  title: string;
  subtitle: string;
  href: string;
  image: string;
};

type LandingCarouselItem =
  | LandingStoryItem
  | LandingExternalItem
  | LandingGameItem;

export type ResolvedLandingSegment = LandingSegmentDef & {
  items: LandingCarouselItem[];
};

function uniqueStories(lists: Story[][]): Story[] {
  const seen = new Set<string>();
  const out: Story[] = [];
  for (const list of lists) {
    for (const story of list) {
      if (seen.has(story.slug)) continue;
      seen.add(story.slug);
      out.push(story);
    }
  }
  return out;
}

function storiesForSegment(id: LandingSegmentDef["id"]): LandingCarouselItem[] {
  switch (id) {
    case "stories":
      return storiesByNewest()
        .slice(0, 8)
        .map((story) => ({ kind: "story" as const, story }));
    case "bedtime":
      return uniqueStories([
        getStoriesByTag("睡前"),
        getStoriesByTag("好習慣"),
      ]).map((story) => ({ kind: "story" as const, story }));
    case "clay":
      return [
        {
          kind: "external" as const,
          title: LANDING_CLAY_EXTERNAL.title,
          subtitle: LANDING_CLAY_EXTERNAL.subtitle,
          href: LANDING_CLAY_EXTERNAL.href,
          image: LANDING_CLAY_EXTERNAL.image,
          external: true,
        },
        {
          kind: "game" as const,
          title: "去遊樂園玩小遊戲",
          subtitle: "免下載 · 練手眼協調",
          href: "/games",
          image: "/mascot.png",
        },
      ];
    case "health":
      return uniqueStories([
        getStoriesByTag("安全"),
        getStoriesByTag("好習慣"),
        getStoriesByTag("解決問題"),
      ]).map((story) => ({ kind: "story" as const, story }));
    default:
      return [];
  }
}

export function resolveLandingSegments(): ResolvedLandingSegment[] {
  return LANDING_SEGMENT_IDS.map((id) => {
    const def = LANDING_SEGMENTS.find((s) => s.id === id)!;
    return { ...def, items: storiesForSegment(id) };
  });
}
