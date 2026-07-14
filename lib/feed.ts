import type { Story } from "@/data/content";
import {
  CHANNEL_DESCRIPTION,
  CHANNEL_OWNER_EMAIL,
  CHANNEL_OWNER_NAME,
  CHANNEL_PODCAST_GUID,
  CHANNEL_TITLE,
} from "@/lib/feed-constants";
import { familyActivityShowNote, storyZoneMapShowNote } from "@/lib/story-geo";
import { storyDescription } from "@/lib/story-metadata";
import { getSiteUrl } from "@/lib/site-url";
import { storyAudioPath, storyCoverPath } from "@/lib/story-utils";
import { hasVtt } from "@/lib/transcript";

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

/** 組裝 item description：定義式摘要 + 選填 familyActivity + 選填地圖深連結。 */
function buildItemDescription(story: Story): string {
  const parts = [storyDescription(story)];
  const familyNote = familyActivityShowNote(story);
  if (familyNote) parts.push(familyNote);
  const zoneNote = storyZoneMapShowNote(story);
  if (zoneNote) parts.push(zoneNote);
  return parts.join("\n\n");
}

/** buildRssFeed 選填注入項。 */
export type BuildRssFeedOptions = {
  /** slug → enclosure length（bytes）。無對應值時 fallback 0。 */
  audioLengthBySlug?: Record<string, number>;
};

/** 依故事資料產生 RSS 2.0（含 podcast enclosure 與 iTunes 延伸欄位）。 */
export function buildRssFeed(
  stories: Story[],
  options: BuildRssFeedOptions = {},
): string {
  const { audioLengthBySlug = {} } = options;
  const siteUrl = getSiteUrl();
  const feedUrl = siteRssUrl();
  const channelImage = `${siteUrl}/mascot.png`;

  const items = stories
    .map((story) => {
      const pageUrl = `${siteUrl}/story/${story.slug}`;
      const coverUrl = `${siteUrl}${storyCoverPath(story.slug)}`;
      const audioUrl = `${siteUrl}${storyAudioPath(story.slug, story.audio)}`;
      const audioLength = audioLengthBySlug[story.slug] ?? 0;
      const description = buildItemDescription(story);
      const durationTag = story.duration
        ? `\n      <itunes:duration>${escapeXml(story.duration)}</itunes:duration>`
        : "";
      const transcriptTag = hasVtt(story)
        ? `\n      <podcast:transcript url="${escapeXml(`${siteUrl}/story/${story.slug}/transcript.vtt`)}" type="text/vtt" language="zh-TW"/>`
        : "";

      return `    <item>
      <title>${escapeXml(story.title)}</title>
      <link>${escapeXml(pageUrl)}</link>
      <guid isPermaLink="true">${escapeXml(pageUrl)}</guid>
      <pubDate>${toRssPubDate(story.date)}</pubDate>
      <description>${cdata(description)}</description>
      <enclosure url="${escapeXml(audioUrl)}" length="${audioLength}" type="audio/mpeg"/>
      <itunes:title>${escapeXml(story.title)}</itunes:title>
      <itunes:summary>${cdata(description)}</itunes:summary>
      <itunes:image href="${escapeXml(coverUrl)}"/>
      <itunes:episode>${story.ep}</itunes:episode>
      <itunes:episodeType>full</itunes:episodeType>${durationTag}${transcriptTag}
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:podcast="https://podcastindex.org/namespace/1.0">
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
    <itunes:type>episodic</itunes:type>
    <itunes:owner>
      <itunes:name>${escapeXml(CHANNEL_OWNER_NAME)}</itunes:name>
      <itunes:email>${escapeXml(CHANNEL_OWNER_EMAIL)}</itunes:email>
    </itunes:owner>
    <podcast:guid>${escapeXml(CHANNEL_PODCAST_GUID)}</podcast:guid>
${items}
  </channel>
</rss>`;
}
