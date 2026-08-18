import type { Character } from "@/data/characters";
import type { Story } from "@/data/content";
import type { Playground } from "@/data/playgrounds";
import { storyDateModified } from "@/data/story-dates";
import { CHANNEL_DESCRIPTION, CHANNEL_TITLE } from "@/lib/feed-constants";
import { siteRssUrl } from "@/lib/feed";
import { STATIC_PAGE_MODIFIED_DATES } from "@/lib/page-freshness";
import { platformShowUrls } from "@/lib/platforms";
import {
  playgroundDetailDescription,
  playgroundDetailUrl,
} from "@/lib/playground-detail";
import { getSiteUrl } from "@/lib/site-url";
import { storyDescription } from "@/lib/story-metadata";
import { storyAudioUrl, storyCoverPath } from "@/lib/story-utils";
import { hasVtt } from "@/lib/transcript";

const AUTHORS = ["Bonbon", "馬米"];
const LANGUAGE = "zh-Hant";

export type FaqItem = {
  question: string;
  answer: string;
};

function absoluteUrl(path: string): string {
  if (/^https?:\/\//.test(path)) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/** 將 RSS duration（MM:SS 或 H:MM:SS）轉 ISO 8601 duration；無法解析則 null */
function durationToIso8601(duration: string): string | null {
  const parts = duration.trim().split(":").map((p) => Number(p));
  if (parts.some((n) => !Number.isFinite(n) || !Number.isInteger(n) || n < 0)) {
    return null;
  }

  let hInput = 0;
  let mInput = 0;
  let sInput = 0;

  if (parts.length === 2) {
    // MM:SS —— 分鐘可超過 59（例如 90:00），僅秒需 < 60
    [mInput, sInput] = parts;
    if (sInput > 59) return null;
  } else if (parts.length === 3) {
    [hInput, mInput, sInput] = parts;
    if (sInput > 59 || mInput > 59) return null;
  } else {
    return null;
  }

  const total = hInput * 3600 + mInput * 60 + sInput;
  if (total <= 0) return null;

  // 正規化為 H/M/S，避免 MM:SS 溢位造成非標準輸出
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  const chunks: string[] = ["PT"];
  if (h > 0) chunks.push(`${h}H`);
  if (m > 0) chunks.push(`${m}M`);
  if (s > 0) chunks.push(`${s}S`);
  if (chunks.length === 1) return null;

  return chunks.join("");
}

export function siteIdentityJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": organizationId,
        name: CHANNEL_TITLE,
        url: siteUrl,
        logo: absoluteUrl("/icon-512.png"),
      },
      {
        "@type": "WebSite",
        "@id": websiteId,
        name: CHANNEL_TITLE,
        description: CHANNEL_DESCRIPTION,
        url: siteUrl,
        inLanguage: LANGUAGE,
        publisher: { "@id": organizationId },
      },
    ],
  };
}

/** 首頁 PodcastSeries 結構化資料（對齊 /feed.xml） */
export function podcastSeriesJsonLd(): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "PodcastSeries",
    "@id": `${siteUrl}/#podcast-series`,
    name: CHANNEL_TITLE,
    description: CHANNEL_DESCRIPTION,
    url: siteUrl,
    webFeed: siteRssUrl(),
    image: absoluteUrl("/mascot.png"),
    inLanguage: LANGUAGE,
    genre: "兒童",
    author: AUTHORS.map((name) => ({
      "@type": "Person",
      name,
    })),
    publisher: {
      "@id": `${siteUrl}/#organization`,
    },
    sameAs: platformShowUrls(),
  };
}

/** 單集 PodcastEpisode 結構化資料 */
export function podcastEpisodeJsonLd(story: Story): Record<string, unknown> {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/story/${story.slug}`;
  const coverUrl = absoluteUrl(storyCoverPath(story.slug));
  const audioUrl = absoluteUrl(storyAudioUrl(story.slug, story.audio));
  const timeRequired = story.duration ? durationToIso8601(story.duration) : null;
  const transcriptMedia = hasVtt(story)
    ? {
        "@type": "MediaObject",
        name: "完整逐字稿",
        contentUrl: `${pageUrl}/transcript.vtt`,
        encodingFormat: "text/vtt",
        inLanguage: "zh-TW",
      }
    : null;

  return {
    "@context": "https://schema.org",
    "@type": "PodcastEpisode",
    "@id": `${pageUrl}#episode`,
    name: story.title,
    description: storyDescription(story),
    url: pageUrl,
    datePublished: story.date,
    dateModified: storyDateModified(story),
    episodeNumber: story.ep,
    image: coverUrl,
    inLanguage: LANGUAGE,
    author: AUTHORS.map((name) => ({ "@type": "Person", name })),
    publisher: { "@id": `${siteUrl}/#organization` },
    ...(timeRequired ? { duration: timeRequired, timeRequired } : {}),
    associatedMedia: transcriptMedia
      ? [
          {
            "@type": "MediaObject",
            contentUrl: audioUrl,
            encodingFormat: "audio/mpeg",
          },
          transcriptMedia,
        ]
      : {
          "@type": "MediaObject",
          contentUrl: audioUrl,
          encodingFormat: "audio/mpeg",
        },
    partOfSeries: {
      "@type": "PodcastSeries",
      "@id": `${siteUrl}/#podcast-series`,
      name: CHANNEL_TITLE,
      url: siteUrl,
    },
  };
}

export function faqPageJsonLd(faqs: FaqItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

/** 麵包屑結構化資料；url 一律轉為以 getSiteUrl() 起頭的絕對網址 */
export function breadcrumbListJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url.startsWith(siteUrl) ? item.url : absoluteUrl(item.url),
    })),
  };
}

export function characterCreativeWorkJsonLd(
  characters: Character[],
): Record<string, unknown> {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${siteUrl}/characters#creative-work`,
    name: "車車遊樂園原創角色",
    description:
      "車車遊樂園的原創車車角色名冊，整理角色個性、車種與出場故事。",
    url: `${siteUrl}/characters`,
    dateModified: STATIC_PAGE_MODIFIED_DATES["/characters"],
    inLanguage: LANGUAGE,
    isPartOf: {
      "@type": "PodcastSeries",
      "@id": `${siteUrl}/#podcast-series`,
      name: CHANNEL_TITLE,
    },
    character: characters.map((character) => ({
      "@type": "Person",
      "@id": `${siteUrl}/characters#${character.id}`,
      name: character.name,
      description: `${character.vehicle}角色，${character.personality}`,
      url: `${siteUrl}/characters#${character.id}`,
      ...(character.ref ? { image: absoluteUrl(`/${character.ref}`) } : {}),
    })),
  };
}

export function playgroundPlaceJsonLd(
  place: Playground,
): Record<string, unknown> {
  const url = playgroundDetailUrl(place.id);

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    "@id": `${url}#place`,
    name: place.name,
    url,
    description: playgroundDetailDescription(place),
    address: {
      "@type": "PostalAddress",
      addressCountry: "TW",
      addressLocality: place.city,
      ...(place.district ? { addressRegion: place.district } : {}),
      streetAddress: place.address,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: place.lat,
      longitude: place.lng,
    },
    isAccessibleForFree: place.free,
    ...(place.officialUrl ? { sameAs: place.officialUrl } : {}),
  };
}

/**
 * 親子遊樂地圖的地點清單（ItemList of Place）。
 * 卡片列表本身受篩選影響，這裡固定輸出全部收錄地點，讓各縣市名稱有穩定的結構化訊號。
 */
export function playgroundItemListJsonLd(places: readonly Playground[]) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/for-parents/play-map`;

  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${pageUrl}#item-list`,
    name: "親子遊樂地圖收錄地點",
    description:
      "適合 3–8 歲親子的公園、博物館、動物園與農場清單，含縣市、是否室內與是否免費。",
    url: pageUrl,
    dateModified: STATIC_PAGE_MODIFIED_DATES["/for-parents/play-map"],
    inLanguage: LANGUAGE,
    numberOfItems: places.length,
    itemListOrder: "https://schema.org/ItemListUnordered",
    itemListElement: places.map((place, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Place",
        "@id": `${playgroundDetailUrl(place.id)}#place`,
        name: place.name,
        url: playgroundDetailUrl(place.id),
        address: {
          "@type": "PostalAddress",
          addressCountry: "TW",
          addressLocality: place.city,
          ...(place.district ? { addressRegion: place.district } : {}),
          streetAddress: place.address,
        },
        geo: {
          "@type": "GeoCoordinates",
          latitude: place.lat,
          longitude: place.lng,
        },
        isAccessibleForFree: place.free,
        ...(place.officialUrl ? { sameAs: place.officialUrl } : {}),
      },
    })),
  };
}
