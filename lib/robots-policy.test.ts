import { describe, expect, it } from "vitest";
import {
  AI_RETRIEVAL_CRAWLERS,
  AI_TRAINING_CRAWLERS,
  robotsRuleMatchesAgent,
  validateRobotsTxtPolicy,
  verifyRobotsPolicy,
} from "./robots-policy";

function expectedPolicyRules() {
  return [
    ...AI_RETRIEVAL_CRAWLERS.map((userAgent) => ({
      userAgent,
      allow: "/",
    })),
    ...AI_TRAINING_CRAWLERS.map((userAgent) => ({
      userAgent,
      disallow: "/",
    })),
    { userAgent: "*", allow: "/" },
  ];
}

describe("robotsRuleMatchesAgent", () => {
  it("ClaudeBot 規則不得匹配 Claude-SearchBot（精確 UA）", () => {
    expect(
      robotsRuleMatchesAgent({ userAgent: "ClaudeBot", disallow: "/" }, "Claude-SearchBot"),
    ).toBe(false);
    expect(
      robotsRuleMatchesAgent(
        { userAgent: "Claude-SearchBot", allow: "/" },
        "Claude-SearchBot",
      ),
    ).toBe(true);
  });
});

describe("verifyRobotsPolicy", () => {
  it("通過完整 allow／disallow 名單", () => {
    const result = verifyRobotsPolicy(expectedPolicyRules());
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("GPTBot 若改為 allow / 則失敗", () => {
    const rules = expectedPolicyRules().map((rule) =>
      rule.userAgent === "GPTBot" ? { userAgent: "GPTBot", allow: "/" } : rule,
    );
    const result = verifyRobotsPolicy(rules);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("GPTBot"))).toBe(true);
  });

  it("OAI-SearchBot 若 disallow / 則失敗", () => {
    const rules = expectedPolicyRules().map((rule) =>
      rule.userAgent === "OAI-SearchBot"
        ? { userAgent: "OAI-SearchBot", disallow: "/" }
        : rule,
    );
    const result = verifyRobotsPolicy(rules);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("OAI-SearchBot"))).toBe(true);
  });

  it("不得僅用 includes 式子字串通過（ClaudeBot 不能代表 Claude-SearchBot）", () => {
    const rules = [
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "*", allow: "/" },
    ];
    const result = verifyRobotsPolicy(rules);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("Claude-SearchBot"))).toBe(true);
    expect(result.errors.some((e) => e.includes("ClaudeBot"))).toBe(true);
  });
});

describe("validateRobotsTxtPolicy", () => {
  it("完整契約 robots.txt 通過", () => {
    const lines = [
      ...AI_RETRIEVAL_CRAWLERS.map((ua) => `User-agent: ${ua}\nAllow: /`),
      ...AI_TRAINING_CRAWLERS.map((ua) => `User-agent: ${ua}\nDisallow: /`),
      "User-agent: *\nAllow: /",
    ];
    expect(validateRobotsTxtPolicy(lines.join("\n\n"))).toHaveLength(0);
  });
});
