import { describe, expect, it, vi } from "vitest";
import robots from "./robots";

const RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
] as const;

const TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
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

  it("Claude-SearchBot（檢索）與 ClaudeBot（訓練）不互相蓋掉彼此規則", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const data = robots();
    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];

    const disallowedAgents = rules
      .filter((rule) => "disallow" in rule && rule.disallow)
      .map((rule) => rule.userAgent);
    const allowedAgents = rules
      .filter((rule) => "allow" in rule && rule.allow)
      .map((rule) => rule.userAgent);

    // Claude-SearchBot 是檢索型：必須出現在某條 allow，且不得出現在任何 disallow。
    expect(allowedAgents).toContainEqual("Claude-SearchBot");
    expect(disallowedAgents).not.toContainEqual("Claude-SearchBot");

    // ClaudeBot 是訓練型：必須（精確全名）出現在 disallow「/」規則中，且不影響 Claude-SearchBot。
    expect(rules).toContainEqual({ userAgent: "ClaudeBot", disallow: "/" });
    expect(allowedAgents).not.toContainEqual("ClaudeBot");

    vi.unstubAllEnvs();
  });

  it("Claude-Web 已棄用，不應出現在任何規則中", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const data = robots();
    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];
    const allAgents = rules.map((rule) => rule.userAgent);

    expect(allAgents).not.toContainEqual("Claude-Web");

    vi.unstubAllEnvs();
  });
});
