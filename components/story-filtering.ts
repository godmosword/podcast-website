import type { Story } from "@/data/content";
import { episodeFinderTheme } from "@/data/episode-themes";
import { searchStories } from "@/lib/story-query";

export type StoryFilterState = {
  vehicle: string | null;
  tag: string | null;
  query?: string | null;
  featuredStorySlug?: string | null;
};

export function filterStories(
  stories: Story[],
  { vehicle, tag, query = null, featuredStorySlug = null }: StoryFilterState,
): Story[] {
  const hasFilter = Boolean(vehicle || tag || query?.trim());
  const searchedStories = searchStories(stories, query ?? "");

  return searchedStories.filter((story) => {
    if (vehicle && story.vehicle !== vehicle) return false;
    if (tag && episodeFinderTheme(story.slug) !== tag) return false;
    if (!hasFilter && story.slug === featuredStorySlug) return false;
    return true;
  });
}
