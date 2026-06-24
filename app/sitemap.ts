import type { MetadataRoute } from "next";
import { allTags, allVehicles, stories } from "@/data/content";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getSiteUrl();
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1 },
    {
      url: `${baseUrl}/stories`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/topic`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/block-drop`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/car-adventure`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/candy-kart`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/games/candy-match`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal`,
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const storyPages: MetadataRoute.Sitemap = stories.map((story) => ({
    url: `${baseUrl}/story/${story.slug}`,
    lastModified: new Date(`${story.date}T12:00:00+08:00`),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const topicPages: MetadataRoute.Sitemap = allTags().map((tag) => ({
    url: `${baseUrl}/topic/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const vehiclePages: MetadataRoute.Sitemap = allVehicles().map((vehicle) => ({
    url: `${baseUrl}/vehicles/${encodeURIComponent(vehicle)}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...storyPages, ...topicPages, ...vehiclePages];
}
