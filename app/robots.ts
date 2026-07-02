import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * 檢索／引用型 AI 爬蟲：對應 AI 搜尋與問答的即時檢索，
 * 放行以利內容被引用（GEO）。
 */
const AI_RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot", // ChatGPT 搜尋檢索（與訓練用的 GPTBot 不同）
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
] as const;

/**
 * 訓練／資料集收錄型爬蟲：與 llms.txt 授權「禁止訓練資料集收錄」一致，
 * 明確拒絕。一般搜尋爬蟲（Googlebot、Applebot）仍由 `*` 規則放行。
 */
const AI_TRAINING_CRAWLERS = [
  "GPTBot", // OpenAI 訓練
  "Google-Extended", // Gemini/Vertex 訓練
  "Applebot-Extended", // Apple 智慧訓練
  "CCBot", // Common Crawl 資料集
  "Bytespider", // ByteDance 訓練
] as const;

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
