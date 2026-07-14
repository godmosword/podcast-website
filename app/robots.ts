import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * 檢索／使用者代查型 AI 爬蟲：對應 AI 搜尋與問答的即時檢索（非訓練用途），
 * 放行有利內容被 AI 即時引用（GEO）。
 */
const AI_RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot", // ChatGPT 搜尋檢索（與訓練用的 GPTBot 不同）
  "ChatGPT-User", // ChatGPT 使用者代查
  "Claude-SearchBot", // Claude 搜尋檢索（與訓練用的 ClaudeBot 不同）
  "Claude-User", // Claude 使用者代查
  "PerplexityBot",
  "Perplexity-User", // Perplexity 使用者代查
] as const;

/**
 * 訓練／資料集收錄型爬蟲：與 llms.txt 授權「禁止訓練資料集收錄」一致，
 * 明確拒絕。一般搜尋爬蟲（Googlebot、Applebot）仍由 `*` 規則放行。
 */
const AI_TRAINING_CRAWLERS = [
  "GPTBot", // OpenAI 訓練
  "ClaudeBot", // Anthropic 訓練爬蟲（2026 現行定義；Claude-SearchBot 才是搜尋檢索）
  "Google-Extended", // Gemini/Vertex 訓練
  "Applebot-Extended", // Apple 智慧訓練
  "CCBot", // Common Crawl 資料集
  "Bytespider", // ByteDance 訓練
  "meta-externalagent", // Meta AI 訓練
] as const;

// Claude-Web 已棄用（2026-07 移除）；若舊 UA 仍出現，落入 `*` 規則（allow）。

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
