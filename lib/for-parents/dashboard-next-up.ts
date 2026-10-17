import { getStory, storiesByNewest, type Story } from "@/data/content";
import type { ProgressStore } from "@/lib/progress-store";
import { splitStoryTitle, storyDisplayTitle } from "@/lib/story-title";
import type { StoryProgressRow } from "./dashboard";

/** 「接著聽」主按鈕下面最多再列幾集。 */
const NEXT_UP_MORE_LIMIT = 3;

export type NextUpPrimary = {
  /** resume＝上次聽到一半；latest＝最新一集還沒聽完；recommended＝最新一集已聽完時改推的集數。 */
  kind: "resume" | "latest" | "recommended";
  slug: string;
  title: string;
  ep: number;
  href: string;
  /** 只有 resume 有：上次停在第幾頁（從 1 算）。 */
  page: number | null;
  lastDate: string | null;
  /** 完整標題「｜」後的第一段，例如「情緒管理故事」。 */
  tagline: string | null;
};

export type NextUpReason = "in-progress" | "favorite" | "latest" | "not-started";

export type NextUpRow = {
  slug: string;
  title: string;
  ep: number;
  href: string;
  reason: NextUpReason;
  lastDate: string | null;
  tagline: string | null;
};

export type NextUp = {
  /** 這台裝置還沒聽過任何一集。 */
  firstTime: boolean;
  primary: NextUpPrimary | null;
  more: NextUpRow[];
};

/**
 * 播放器的頁數上限：多頁插圖＝`pageCount`；單張封面的集數只有 1 頁
 * （與 `app/story/[slug]/play` 組 images 的規則一致）。
 * `StoryPlayer` 只在 `saved.page < total` 時接續，超出就從頭播。
 */
function playerPageLimit(story: Story): number {
  return story.pageCount > 1 ? story.pageCount : 1;
}

function taglineOf(story: Story): string | null {
  return splitStoryTitle(story.title).rest[0] ?? null;
}

function toPrimary(
  story: Story,
  kind: NextUpPrimary["kind"],
  extra: Pick<NextUpPrimary, "href" | "page" | "lastDate"> = {
    href: `/story/${story.slug}`,
    page: null,
    lastDate: null,
  },
): NextUpPrimary {
  return {
    kind,
    slug: story.slug,
    title: storyDisplayTitle(story),
    ep: story.ep,
    tagline: taglineOf(story),
    ...extra,
  };
}

function pickPrimary(
  progress: Pick<ProgressStore, "continue" | "favorites">,
  rowBySlug: ReadonlyMap<string, StoryProgressRow>,
  newest: readonly Story[],
): NextUpPrimary | null {
  const isDone = (slug: string) => rowBySlug.get(slug)?.status === "completed";

  const saved = progress.continue;
  const resume = saved ? getStory(saved.slug) : undefined;
  const resumable =
    saved != null &&
    resume != null &&
    !isDone(resume.slug) &&
    saved.page >= 0 &&
    saved.page < playerPageLimit(resume);
  if (saved && resume && resumable) {
    return toPrimary(resume, "resume", {
      href: `/story/${resume.slug}/play`,
      // 只有多頁插圖才說「第幾頁」；存的是 0 起算。
      page: resume.pageCount > 1 ? saved.page + 1 : null,
      lastDate: rowBySlug.get(resume.slug)?.lastDate ?? null,
    });
  }

  const latest = newest[0];
  if (latest && !isDone(latest.slug)) return toPrimary(latest, "latest");

  const favorite = progress.favorites
    .map((slug) => getStory(slug))
    .find((story): story is Story => story != null && !isDone(story.slug));
  const fallback = favorite ?? newest.find((story) => !isDone(story.slug));
  return fallback ? toPrimary(fallback, "recommended") : null;
}

/**
 * 「接著聽」：一個主按鈕（繼續聽／最新一集），下面再列聽到一半、收藏、
 * 較新的未聽集數，最多 3 集、不重複主按鈕那一集。
 */
export function buildNextUp(
  progress: Pick<ProgressStore, "continue" | "favorites" | "engagement">,
  storyProgress: readonly StoryProgressRow[],
): NextUp {
  const rowBySlug = new Map(storyProgress.map((row) => [row.slug, row]));
  const isDone = (slug: string) => rowBySlug.get(slug)?.status === "completed";
  const newest = storiesByNewest();
  const latestSlug = newest[0]?.slug;
  const primary = pickPrimary(progress, rowBySlug, newest);

  const taken = new Set<string>(primary ? [primary.slug] : []);
  const candidates: { story: Story | undefined; reason: NextUpReason }[] = [
    ...storyProgress
      .filter((row) => row.status === "in-progress")
      .map((row) => ({ story: getStory(row.slug), reason: "in-progress" as const })),
    ...progress.favorites.map((slug) => ({
      story: getStory(slug),
      reason: "favorite" as const,
    })),
    ...newest.map((story) => ({
      story,
      reason: story.slug === latestSlug ? ("latest" as const) : ("not-started" as const),
    })),
  ];

  const more: NextUpRow[] = [];
  for (const { story, reason } of candidates) {
    if (more.length >= NEXT_UP_MORE_LIMIT) break;
    if (!story || taken.has(story.slug) || isDone(story.slug)) continue;
    taken.add(story.slug);
    more.push({
      slug: story.slug,
      title: storyDisplayTitle(story),
      ep: story.ep,
      href: `/story/${story.slug}`,
      reason,
      lastDate: rowBySlug.get(story.slug)?.lastDate ?? null,
      tagline: taglineOf(story),
    });
  }

  return {
    firstTime: storyProgress.every((row) => row.status === "not-started"),
    primary,
    more,
  };
}
