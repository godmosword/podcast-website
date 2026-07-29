import type { Metadata } from "next";
import type { Story } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import { iosAppStoreId, storyAppLinkUrl } from "@/lib/ios-app-links";
import { storyDefinitionSummary } from "@/lib/story-geo";
import { storyOgImagePath } from "@/lib/story-og-path";
import { hasVtt } from "@/lib/transcript";

const SITE_NAME = "車車遊樂園";

export function storyDescription(story: Story): string {
  return storyDefinitionSummary(story);
}

/** 故事分享圖：動態 OG route（D12 黏土相框卡）。 */
function storyOgImageUrl(story: Story): string {
  return storyOgImagePath(story.slug);
}

/** 故事詳情頁的 SEO / 分享 metadata */
export function storyDetailMetadata(story: Story): Metadata {
  const description = storyDescription(story);
  const imagePath = storyOgImageUrl(story);
  const modified = storyDateModified(story);

  const transcriptPath = hasVtt(story)
    ? `/story/${story.slug}/transcript.vtt`
    : undefined;

  const appStoreId = iosAppStoreId();
  const appleItunesApp = appStoreId
    ? `app-id=${appStoreId}, app-argument=${storyAppLinkUrl(story.slug)}`
    : undefined;

  return {
    title: story.title,
    description,
    alternates: {
      canonical: `/story/${story.slug}`,
      ...(transcriptPath ? { types: { "text/vtt": transcriptPath } } : {}),
    },
    other: {
      dateModified: modified,
      "article:modified_time": modified,
      ...(appleItunesApp ? { "apple-itunes-app": appleItunesApp } : {}),
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
