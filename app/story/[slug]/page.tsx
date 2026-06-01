import { notFound } from "next/navigation";
import { getStory, stories } from "@/data/stories";
import StoryPlayer from "@/components/StoryPlayer";

// 預渲染每一則故事（SSG）。
export function generateStaticParams() {
  return stories.map((story) => ({ slug: story.slug }));
}

// 補零兩位，組出 01.jpg ~ NN.jpg。
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

// Next 15 的 params 是 Promise，要 await。
export default async function StoryPage({
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
  const images = Array.from(
    { length: story.pageCount },
    (_, i) => `${base}/${pad2(i + 1)}.jpg`
  );
  const audio = `${base}/${story.audio}`;

  return (
    <StoryPlayer
      title={story.title}
      color={story.color}
      images={images}
      audio={audio}
      captions={story.captions}
    />
  );
}
