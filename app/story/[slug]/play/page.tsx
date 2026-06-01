import { notFound } from "next/navigation";
import { getStory, stories } from "@/data/stories";
import StoryPlayer from "@/components/StoryPlayer";

// 預渲染每一則故事的播放頁（SSG）。
export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Next 15 的 params 是 Promise，要 await。
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

  const base = `/stories/${story.slug}`;

  // 每集目前只有一張 artwork（01.jpg）。若有字幕軌，就讓這張圖
  // 對應每一句字幕（播放時字幕會跟著音檔進度換句）；否則依插圖張數。
  const segments = story.captions?.length ?? story.pageCount;
  const cover = `${base}/${pad2(1)}.jpg`;
  const images =
    story.pageCount <= 1
      ? Array.from({ length: Math.max(1, segments) }, () => cover)
      : Array.from({ length: story.pageCount }, (_, i) => `${base}/${pad2(i + 1)}.jpg`);

  return (
    <StoryPlayer
      title={story.title}
      color={story.color}
      images={images}
      audio={`${base}/${story.audio}`}
      captions={story.captions}
      backHref={`/story/${story.slug}`}
    />
  );
}
