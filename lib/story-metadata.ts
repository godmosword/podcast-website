import type { Metadata } from "next";
import type { Story } from "@/data/stories";
import { storyCoverPath } from "@/lib/story-utils";

const SITE_NAME = "車車遊樂園";

export function storyDescription(story: Story): string {
  return (
    story.summary ??
    `${story.title} — ${SITE_NAME}親子 podcast，適合睡前看圖聽故事。`
  );
}

/** 故事詳情頁的 SEO / 分享 metadata */
export function storyDetailMetadata(story: Story): Metadata {
  const description = storyDescription(story);
  const cover = storyCoverPath(story.slug);

  return {
    title: story.title,
    description,
    openGraph: {
      title: story.title,
      description,
      type: "website",
      locale: "zh_TW",
      siteName: SITE_NAME,
      images: [{ url: cover, alt: `${story.title} 封面` }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [cover],
    },
  };
}

/** 播放頁：可被索引但 canonical 指向詳情頁 */
export function storyPlayMetadata(story: Story): Metadata {
  const detailPath = `/story/${story.slug}`;

  return {
    title: `播放：${story.title}`,
    description: storyDescription(story),
    alternates: { canonical: detailPath },
    robots: { index: false, follow: true },
  };
}
