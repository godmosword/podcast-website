import type { Story } from "@/data/stories";
import { CHANNEL_DESCRIPTION, CHANNEL_TITLE } from "@/lib/feed-constants";
import { siteRssUrl } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";
import { storyDescription } from "@/lib/story-metadata";
import { storyAudioPath, storyCoverPath } from "@/lib/story-utils";

const AUTHORS = ["Bonbon", "馬米"];

function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 首頁 PodcastSeries 結構化資料（對齊 /feed.xml） */
export function podcastSeriesJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    name: CHANNEL_TITLE,
    description: CHANNEL_DESCRIPTION,
    url: siteUrl,
    webFeed: siteRssUrl(),
    image: absoluteUrl("/mascot.png"),
    inLanguage: "zh-TW",
    author: AUTHORS.map((name) => ({
      "@type": "Person",
      name,
    })),
  };
}

/** 單集 PodcastEpisode 結構化資料 */
export function podcastEpisodeJsonLd(story: Story): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/story/${story.slug}`;
  const coverUrl = absoluteUrl(storyCoverPath(story.slug));
  const audioUrl = absoluteUrl(storyAudioPath(story.slug, story.audio));

  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    name: story.title,
    description: storyDescription(story),
    url: pageUrl,
    datePublished: story.date,
    episodeNumber: story.ep,
    image: coverUrl,
    inLanguage: "zh-TW",
    associatedMedia: {
      "@type": "MediaObject",
      contentUrl: audioUrl,
      encodingFormat: "audio/mpeg",
    },
    partOfSeries: {
      "@type": "PodcastSeries",
      name: CHANNEL_TITLE,
      url: siteUrl,
    },
  };
}
