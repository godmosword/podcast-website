import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStory, getNextStory, stories } from "@/data/stories";
import { storyPlayMetadata } from "@/lib/story-metadata";
import { pad2, storyAudioPath, storyCoverPath } from "@/lib/story-utils";
import StoryPlayer from "@/components/StoryPlayer";

export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) {
    return { title: "找不到故事" };
  }
  return storyPlayMetadata(story);
}

export default async function StoryPlayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const story = getStory(slug);

  if (!story) {
    notFound();
  }

  const nextStory = getNextStory(slug);
  const base = `/stories/${story.slug}`;

  const segments = story.captions?.length ?? story.pageCount;
  const cover = storyCoverPath(story.slug);
  const images =
    story.pageCount <= 1
      ? Array.from({ length: Math.max(1, segments) }, () => cover)
      : Array.from({ length: story.pageCount }, (_, i) =>
          `${base}/${pad2(i + 1)}.jpg`,
        );

  return (
    <StoryPlayer
      slug={story.slug}
      title={story.title}
      color={story.color}
      images={images}
      audio={storyAudioPath(story.slug, story.audio)}
      captions={story.captions}
      captionTimes={story.captionTimes}
      backHref={`/story/${story.slug}`}
      nextStorySlug={nextStory?.slug}
      nextStoryTitle={nextStory?.title}
    />
  );
}
