import type { Story } from "@/data/content";

export function filterStoriesForVehicle(
  stories: Story[],
  vehicle: string | null,
  featuredStorySlug?: string | null,
): Story[] {
  return stories.filter((story) => {
    if (vehicle) return story.vehicle === vehicle;
    return story.slug !== featuredStorySlug;
  });
}
