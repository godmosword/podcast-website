import type { Story } from "@/data/content";
import { episodeFinderTheme } from "@/data/episode-themes";
import { searchStories } from "@/lib/story-query";

export type StoryFilterState = {
  vehicle: string | null;
  tag: string | null;
  query?: string | null;
};

export function filterStories(
  stories: Story[],
  { vehicle, tag, query = null }: StoryFilterState,
): Story[] {
  const searchedStories = searchStories(stories, query ?? "");

  return searchedStories.filter((story) => {
    if (vehicle && story.vehicle !== vehicle) return false;
    if (tag && episodeFinderTheme(story.slug) !== tag) return false;
    return true;
  });
}
