import { describe, expect, it, vi } from "vitest";
import {
  AI_RETRIEVAL_CRAWLERS,
  AI_TRAINING_CRAWLERS,
  verifyRobotsPolicy,
} from "@/lib/robots-policy";
import robots from "./robots";

describe("robots", () => {
  it("放行檢索型 AI crawler、拒絕訓練型 crawler，並保留全站 allow 與 sitemap", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const data = robots();
    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];

    for (const userAgent of AI_RETRIEVAL_CRAWLERS) {
      expect(rules).toContainEqual({ userAgent, allow: "/" });
    }

    for (const userAgent of AI_TRAINING_CRAWLERS) {
      expect(rules).toContainEqual({ userAgent, disallow: "/" });
    }

    expect(rules).toContainEqual({ userAgent: "*", allow: "/" });
    expect(data.sitemap).toBe("https://example.com/sitemap.xml");

    const policy = verifyRobotsPolicy(data.rules);
    expect(policy.ok).toBe(true);

    vi.unstubAllEnvs();
  });

  it("Claude-SearchBot（檢索）與 ClaudeBot（訓練）不互相蓋掉彼此規則", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://example.com");

    const data = robots();
    const policy = verifyRobotsPolicy(data.rules);
    expect(policy.ok).toBe(true);

    const rules = Array.isArray(data.rules) ? data.rules : [data.rules];
    const disallowedAgents = rules
      .filter((rule) => "disallow" in rule && rule.disallow)
      .map((rule) => rule.userAgent);
    const allowedAgents = rules
      .filter((rule) => "allow" in rule && rule.allow)
      .map((rule) => rule.userAgent);

    expect(allowedAgents).toContainEqual("Claude-SearchBot");
    expect(disallowedAgents).not.toContainEqual("Claude-SearchBot");
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
