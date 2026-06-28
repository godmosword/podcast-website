import { getStories, getStory } from "@/data/content";
import { buildStoryVtt } from "@/lib/transcript";

export function generateStaticParams() {
  return getStories().map((story) => ({ slug: story.slug }));
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const story = getStory(slug);
  if (!story) {
    return new Response(null, { status: 404 });
  }

  const vtt = buildStoryVtt(story);
  if (!vtt) {
    return new Response(null, { status: 404 });
  }

  return new Response(vtt, {
    status: 200,
    headers: {
      "Content-Type": "text/vtt; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
