import type { MetadataRoute } from "next";
import { allTags, allVehicles, getStories } from "@/data/content";
import { storyDateModified } from "@/data/story-dates";
import {
  collectionModifiedDate,
  STATIC_PAGE_MODIFIED_DATES,
} from "@/lib/page-freshness";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const stories = getStories();
  const collectionModified = collectionModifiedDate(stories);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: collectionModified,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/stories`,
      lastModified: collectionModified,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/topic`,
      lastModified: collectionModified,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/for-parents`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/for-parents"],
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/for-parents/dashboard`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/for-parents"],
      changeFrequency: "monthly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/subscribe`,
      lastModified: collectionModified,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/characters`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/characters"],
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/about"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/adventures`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/adventures"],
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/games"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/block-drop`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/games/block-drop"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/car-adventure`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/games/car-adventure"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/candy-kart`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/games/candy-kart"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/candy-match`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/games/candy-match"],
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: STATIC_PAGE_MODIFIED_DATES["/legal"],
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const storyPages: MetadataRoute.Sitemap = stories.map((story) => ({
    url: `${baseUrl}/story/${story.slug}`,
    lastModified: storyDateModified(story),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const topicPages: MetadataRoute.Sitemap = allTags().map((tag) => ({
    url: `${baseUrl}/topic/${encodeURIComponent(tag)}`,
    lastModified: collectionModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const vehiclePages: MetadataRoute.Sitemap = allVehicles().map((vehicle) => ({
    url: `${baseUrl}/vehicles/${encodeURIComponent(vehicle)}`,
    lastModified: collectionModified,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...storyPages, ...topicPages, ...vehiclePages];
}
