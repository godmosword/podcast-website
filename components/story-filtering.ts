import type { Story } from "@/data/content";

export type StoryFilterState = {
  vehicle: string | null;
  tag: string | null;
  featuredStorySlug?: string | null;
};

export function filterStories(
  stories: Story[],
  { vehicle, tag, featuredStorySlug = null }: StoryFilterState,
): Story[] {
  const hasFilter = Boolean(vehicle || tag);

  return stories.filter((story) => {
    if (vehicle && story.vehicle !== vehicle) return false;
    if (tag && !(story.tags ?? []).includes(tag)) return false;
    if (!hasFilter && story.slug === featuredStorySlug) return false;
    return true;
  });
}

/** @deprecated 使用 filterStories */
export function filterStoriesForVehicle(
  stories: Story[],
  vehicle: string | null,
  featuredStorySlug?: string | null,
): Story[] {
  return filterStories(stories, { vehicle, tag: null, featuredStorySlug });
}
