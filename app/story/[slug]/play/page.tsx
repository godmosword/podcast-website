import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStory, getNextStory, getStories } from "@/data/content";
import { storyPlayMetadata } from "@/lib/story-metadata";
import { getSubtitles } from "@/lib/subtitles";
import { pad2, storyAudioPath, storyCoverPath } from "@/lib/story-utils";
import StoryPlayer from "@/components/StoryPlayer";

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
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
  const subtitles = getSubtitles(story.slug);
  const cover = storyCoverPath(story.slug);

  // 單圖集：有即時字幕時只需一張封面（字幕獨立跑時間軸）；
  // 沒字幕時沿用舊行為（用句數複製封面，靠 captions 翻「頁」）。
  const segments = story.captions?.length ?? story.pageCount;
  const images =
    story.pageCount <= 1
      ? subtitles?.length
        ? [cover]
        : Array.from({ length: Math.max(1, segments) }, () => cover)
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
      subtitles={subtitles ?? undefined}
      backHref={`/story/${story.slug}`}
      nextStorySlug={nextStory?.slug}
      nextStoryTitle={nextStory?.title}
      reflectionPrompt={story.reflectionPrompt}
    />
  );
}
