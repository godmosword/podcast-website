import type { Story } from "@/data/content";
import { CHANNEL_DESCRIPTION, CHANNEL_TITLE } from "@/lib/feed-constants";
import { siteRssUrl } from "@/lib/feed";
import { getSiteUrl } from "@/lib/site-url";
import { storyDescription } from "@/lib/story-metadata";
import { storyAudioPath, storyCoverPath } from "@/lib/story-utils";

const AUTHORS = ["Bonbon", "馬米"];

function absoluteUrl(path: string): string {
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 將 RSS duration（MM:SS 或 H:MM:SS）轉 ISO 8601 duration；無法解析則 null */
function durationToIso8601(duration: string): string | null {
  const parts = duration.trim().split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n) || !Number.isInteger(n) || n < 0)) {
    return null;
  }

  let h = 0;
  let m = 0;
  let s = 0;

  if (parts.length === 2) {
    [m, s] = parts;
  } else if (parts.length === 3) {
    [h, m, s] = parts;
  } else {
    return null;
  }

  if (s > 59 || m > 59) return null;

  const total = h * 3600 + m * 60 + s;
  if (total <= 0) return null;

  const chunks: string[] = ["PT"];
  if (h > 0) chunks.push(`${h}H`);
  if (m > 0) chunks.push(`${m}M`);
  if (s > 0) chunks.push(`${s}S`);
  if (chunks.length === 1) return null;

  return chunks.join("");
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
  const timeRequired = story.duration ? durationToIso8601(story.duration) : null;

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
    ...(timeRequired ? { timeRequired } : {}),
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
