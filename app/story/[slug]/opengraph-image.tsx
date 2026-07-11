import { getStory, getStories } from "@/data/content";
import {
  createStoryOgImage,
  storyOgContentType,
  storyOgImageSize,
} from "@/lib/story-og";

export const alt = "車車遊樂園故事分享卡";
export const size = storyOgImageSize;
export const contentType = storyOgContentType;

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) {
    throw new Error(`story og: unknown slug ${slug}`);
  }
  return createStoryOgImage(story);
}
