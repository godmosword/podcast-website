import type { Story } from "@/data/content";
import { getStories, getStory, storiesByNewest } from "@/data/content";
import { CHANNEL_TITLE } from "@/lib/feed-constants";
import { visiblePlatforms } from "@/lib/platforms";
import { getSiteUrl } from "@/lib/site-url";
import { pad2, storyAudioUrl, storyCoverPath } from "@/lib/story-utils";
import { hasTranscriptVtt } from "@/lib/transcript";
import type { ZoneId } from "@/data/universe-zones";

/** iOS／第一方客戶端集目摘要（列表）。 */
export type ApiV1StoryListItem = {
  slug: string;
  ep: number;
  title: string;
  date: string;
  duration?: string;
  vehicle: string;
  summary?: string;
  tags?: string[];
  ageRange?: string;
  color: string;
  pageCount: number;
  coverUrl: string;
  audioUrl: string;
  zoneId?: ZoneId;
  hasTranscriptVtt: boolean;
};

/** 單集詳情：列表欄位 + 播放器所需。 */
export type ApiV1StoryDetail = ApiV1StoryListItem & {
  captions?: string[];
  captionTimes?: number[];
  pageImageUrls: string[];
  transcriptVttUrl?: string;
  reflectionPrompt?: { child: string; parentFollowUp: string };
  characterIds?: string[];
};

/** 頻道 meta（對齊 feed-constants／platforms）。 */
export type ApiV1ChannelMeta = {
  title: string;
  siteUrl: string;
  feedUrl: string;
  artworkUrl: string;
  platforms: { label: string; url: string }[];
};

const CACHE_CONTROL = "public, max-age=3600, s-maxage=3600";
/** 404 用；避免 CDN 把「這集還不存在」快取住。 */
const NO_STORE = "no-store";

/** 相對路徑 → 絕對 URL；已是 http(s) 則原樣回傳。 */
export function toAbsoluteUrl(pathOrUrl: string, siteUrl = getSiteUrl()): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${siteUrl}${path}`;
}

function storyAudioAbsolute(story: Story, siteUrl: string): string {
  return toAbsoluteUrl(storyAudioUrl(story.slug, story.audio), siteUrl);
}

function storyCoverAbsolute(slug: string, siteUrl: string, page = 1): string {
  return toAbsoluteUrl(storyCoverPath(slug, page), siteUrl);
}

function pageImageUrls(story: Story, siteUrl: string): string[] {
  const count = Math.max(1, story.pageCount);
  return Array.from({ length: count }, (_, i) =>
    storyCoverAbsolute(story.slug, siteUrl, i + 1),
  );
}

/** Story → 列表 DTO。 */
export function toStoryListItem(
  story: Story,
  siteUrl = getSiteUrl(),
): ApiV1StoryListItem {
  const item: ApiV1StoryListItem = {
    slug: story.slug,
    ep: story.ep,
    title: story.title,
    date: story.date,
    vehicle: story.vehicle,
    color: story.color,
    pageCount: story.pageCount,
    coverUrl: storyCoverAbsolute(story.slug, siteUrl),
    audioUrl: storyAudioAbsolute(story, siteUrl),
    hasTranscriptVtt: hasTranscriptVtt(story),
  };
  if (story.duration !== undefined) item.duration = story.duration;
  if (story.summary !== undefined) item.summary = story.summary;
  if (story.tags !== undefined) item.tags = story.tags;
  if (story.ageRange !== undefined) item.ageRange = story.ageRange;
  if (story.zoneId !== undefined) item.zoneId = story.zoneId;
  return item;
}

/** Story → 詳情 DTO（含翻頁圖與可選字幕／反思）。 */
export function toStoryDetail(
  story: Story,
  siteUrl = getSiteUrl(),
): ApiV1StoryDetail {
  const base = toStoryListItem(story, siteUrl);
  const detail: ApiV1StoryDetail = {
    ...base,
    pageImageUrls: pageImageUrls(story, siteUrl),
  };
  if (story.captions !== undefined) detail.captions = story.captions;
  if (story.captionTimes !== undefined) detail.captionTimes = story.captionTimes;
  if (hasTranscriptVtt(story)) {
    detail.transcriptVttUrl = toAbsoluteUrl(
      `/story/${story.slug}/transcript.vtt`,
      siteUrl,
    );
  }
  if (story.reflectionPrompt !== undefined) {
    detail.reflectionPrompt = story.reflectionPrompt;
  }
  if (story.characterIds !== undefined) {
    detail.characterIds = story.characterIds;
  }
  return detail;
}

/** 最新在前的集目列表。 */
export function listStoriesApi(siteUrl = getSiteUrl()): ApiV1StoryListItem[] {
  return storiesByNewest().map((s) => toStoryListItem(s, siteUrl));
}

/** 單集詳情；找不到回 null。 */
export function getStoryApi(
  slug: string,
  siteUrl = getSiteUrl(),
): ApiV1StoryDetail | null {
  const story = getStory(slug);
  if (!story) return null;
  return toStoryDetail(story, siteUrl);
}

/** 頻道 meta。 */
export function getChannelMetaApi(siteUrl = getSiteUrl()): ApiV1ChannelMeta {
  return {
    title: CHANNEL_TITLE,
    siteUrl,
    feedUrl: toAbsoluteUrl("/feed.xml", siteUrl),
    artworkUrl: toAbsoluteUrl("/mascot.png", siteUrl),
    platforms: visiblePlatforms().map((p) => ({ label: p.label, url: p.url })),
  };
}

/** 統一 JSON 回應（長快取；內容來自 SSG 靜態目錄）。 */
export function apiV1Json(
  body: unknown,
  init: { status?: number; cacheControl?: string } = {},
): Response {
  return Response.json(body, {
    status: init.status ?? 200,
    headers: {
      "Cache-Control": init.cacheControl ?? CACHE_CONTROL,
    },
  });
}

/**
 * 404 契約：`{ "error": "not_found" }`
 *
 * 刻意**不**快取：新集上線前若有客戶端先打過該 slug，
 * 公開快取會讓 CDN 把 not_found 留一小時。
 */
export function apiV1NotFound(): Response {
  return apiV1Json(
    { error: "not_found" },
    { status: 404, cacheControl: NO_STORE },
  );
}

/** 供測試／除錯：目錄長度應與 getStories 一致。 */
export function apiV1StoryCount(): number {
  return getStories().length;
}

/** 內部：組裝翻頁檔名（測試用，避免魔法字串）。 */
export function pageImageFileName(page: number): string {
  return `${pad2(page)}.jpg`;
}
