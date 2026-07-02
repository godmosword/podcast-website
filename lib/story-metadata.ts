import type { Metadata } from "next";
import type { Story } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import { DEFAULT_OG_IMAGE } from "@/lib/site-url";
import { storyDefinitionSummary } from "@/lib/story-geo";
import { storyCoverPath } from "@/lib/story-utils";

const SITE_NAME = "車車遊樂園";

export function storyDescription(story: Story): string {
  return storyDefinitionSummary(story);
}

/** 故事分享圖：有插圖用封面，否則全站預設 mascot */
function storyOgImagePath(story: Story): string {
  if (story.pageCount > 0) {
    return storyCoverPath(story.slug);
  }
  return DEFAULT_OG_IMAGE;
}

/** 故事詳情頁的 SEO / 分享 metadata */
export function storyDetailMetadata(story: Story): Metadata {
  const description = storyDescription(story);
  const imagePath = storyOgImagePath(story);
  const modified = storyDateModified(story);

  return {
    title: story.title,
    description,
    alternates: { canonical: `/story/${story.slug}` },
    other: {
      dateModified: modified,
      "article:modified_time": modified,
    },
    openGraph: {
      title: story.title,
      description,
      type: "website",
      locale: "zh_TW",
      siteName: SITE_NAME,
      images: [{ url: imagePath, alt: `${story.title} 封面` }],
    },
    twitter: {
      card: "summary_large_image",
      title: story.title,
      description,
      images: [imagePath],
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
