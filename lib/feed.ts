import type { Story } from "@/data/content";
import { CHANNEL_DESCRIPTION, CHANNEL_TITLE } from "@/lib/feed-constants";
import { storyDescription } from "@/lib/story-metadata";
import { getSiteUrl } from "@/lib/site-url";
import { storyAudioPath, storyCoverPath } from "@/lib/story-utils";

const SITE_RSS_PATH = "/feed.xml";

export function siteRssUrl(): string {
  return `${getSiteUrl()}${SITE_RSS_PATH}`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** ISO 日期 → RSS pubDate（RFC 822） */
function toRssPubDate(iso: string): string {
  return new Date(`${iso}T12:00:00+08:00`).toUTCString();
}

function cdata(text: string): string {
  return `<![CDATA[${text.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** 依故事資料產生 RSS 2.0（含 podcast enclosure 與 iTunes 延伸欄位）。 */
export function buildRssFeed(stories: Story[]): string {
  const siteUrl = getSiteUrl();
  const feedUrl = siteRssUrl();
  const channelImage = `${siteUrl}/mascot.png`;

  const items = stories
    .map((story) => {
      const pageUrl = `${siteUrl}/story/${story.slug}`;
      const coverUrl = `${siteUrl}${storyCoverPath(story.slug)}`;
      const audioUrl = `${siteUrl}${storyAudioPath(story.slug, story.audio)}`;
      const description = storyDescription(story);
      const durationTag = story.duration
        ? `\n      <itunes:duration>${escapeXml(story.duration)}</itunes:duration>`
        : "";

      return `    <item>
      <title>${escapeXml(story.title)}</title>
      <link>${escapeXml(pageUrl)}</link>
      <guid isPermaLink="true">${escapeXml(pageUrl)}</guid>
      <pubDate>${toRssPubDate(story.date)}</pubDate>
      <description>${cdata(description)}</description>
      <enclosure url="${escapeXml(audioUrl)}" length="0" type="audio/mpeg"/>
      <itunes:title>${escapeXml(story.title)}</itunes:title>
      <itunes:summary>${cdata(description)}</itunes:summary>
      <itunes:image href="${escapeXml(coverUrl)}"/>
      <itunes:episode>${story.ep}</itunes:episode>${durationTag}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(CHANNEL_TITLE)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(CHANNEL_DESCRIPTION)}</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${escapeXml(channelImage)}</url>
      <title>${escapeXml(CHANNEL_TITLE)}</title>
      <link>${escapeXml(siteUrl)}</link>
    </image>
    <itunes:title>${escapeXml(CHANNEL_TITLE)}</itunes:title>
    <itunes:summary>${escapeXml(CHANNEL_DESCRIPTION)}</itunes:summary>
    <itunes:image href="${escapeXml(channelImage)}"/>
    <itunes:author>Bonbon &amp; 馬米</itunes:author>
    <itunes:explicit>false</itunes:explicit>
    <itunes:category text="Kids &amp; Family"/>
${items}
  </channel>
</rss>`;
}
