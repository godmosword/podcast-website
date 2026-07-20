import type { MetadataRoute } from "next";
import {
  AI_RETRIEVAL_CRAWLERS,
  AI_TRAINING_CRAWLERS,
} from "@/lib/robots-policy";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      ...AI_RETRIEVAL_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
      })),
      ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
