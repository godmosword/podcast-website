import { describe, expect, it, vi } from "vitest";
import robots from "./robots";

const RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "PerplexityBot",
] as const;

const TRAINING_CRAWLERS = [
  "GPTBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
] as const;

describe("robots", () => {
  it("放行檢索型 AI crawler、拒絕訓練型 crawler，並保留全站 allow 與 sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const data = robots();
    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];

    for (const userAgent of RETRIEVAL_CRAWLERS) {
      expect(rules).toContainEqual({ userAgent, allow: "/" });
    }

    for (const userAgent of TRAINING_CRAWLERS) {
      expect(rules).toContainEqual({ userAgent, disallow: "/" });
    }

    expect(rules).toContainEqual({ userAgent: "*", allow: "/" });
    expect(data.sitemap).toBe("https://example.com/sitemap.xml");

    vi.unstubAllEnvs();
  });
});
