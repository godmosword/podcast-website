import type { MetadataRoute } from "next";

/** 檢索／使用者代查型 AI 爬蟲（GEO 放行）。 */
export const AI_RETRIEVAL_CRAWLERS = [
  "OAI-SearchBot",
  "ChatGPT-User",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
] as const;

/** 訓練／資料集收錄型爬蟲（明確拒絕）。 */
export const AI_TRAINING_CRAWLERS = [
  "GPTBot",
  "ClaudeBot",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
  "Bytespider",
  "meta-externalagent",
] as const;

export type RobotsPolicyRule = {
  userAgent?: string | string[];
  allow?: string | string[];
  disallow?: string | string[];
};

export function normalizeRobotsRules(
  rules: MetadataRoute.Robots["rules"],
): RobotsPolicyRule[] {
  if (!rules) return [];
  return Array.isArray(rules) ? rules : [rules];
}

/** 規則的 userAgent 是否與目標 UA 完全相等（禁止子字串誤配）。 */
export function robotsRuleMatchesAgent(
  rule: RobotsPolicyRule,
  agent: string,
): boolean {
  const ua = rule.userAgent;
  if (typeof ua === "string") return ua === agent;
  if (Array.isArray(ua)) return ua.length === 1 && ua[0] === agent;
  return false;
}

function rulePaths(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function ruleAllowsRoot(rule: RobotsPolicyRule): boolean {
  return rulePaths(rule.allow).includes("/");
}

function ruleDisallowsRoot(rule: RobotsPolicyRule): boolean {
  return rulePaths(rule.disallow).includes("/");
}

function rulesForExactAgent(
  rules: RobotsPolicyRule[],
  agent: string,
): RobotsPolicyRule[] {
  return rules.filter((rule) => robotsRuleMatchesAgent(rule, agent));
}

export type RobotsPolicyVerification = {
  ok: boolean;
  errors: string[];
};

/** 以 MetadataRoute.Robots 結構驗證 AI 爬蟲 allow／disallow（精確 UA 相等）。 */
export function verifyRobotsPolicy(
  rulesInput: MetadataRoute.Robots["rules"],
): RobotsPolicyVerification {
  const rules = normalizeRobotsRules(rulesInput);
  const errors: string[] = [];

  for (const agent of AI_RETRIEVAL_CRAWLERS) {
    const matches = rulesForExactAgent(rules, agent);
    if (matches.length === 0) {
      errors.push(`缺少檢索型 UA 規則：${agent}`);
      continue;
    }
    if (matches.some((rule) => ruleDisallowsRoot(rule))) {
      errors.push(`${agent} 為檢索型，不得 disallow /`);
    }
    if (!matches.some((rule) => ruleAllowsRoot(rule))) {
      errors.push(`${agent} 須 explicit allow /`);
    }
  }

  for (const agent of AI_TRAINING_CRAWLERS) {
    const matches = rulesForExactAgent(rules, agent);
    if (matches.length === 0) {
      errors.push(`缺少訓練型 UA 規則：${agent}`);
      continue;
    }
    if (!matches.some((rule) => ruleDisallowsRoot(rule))) {
      errors.push(`${agent} 須 explicit disallow /`);
    }
    if (matches.some((rule) => ruleAllowsRoot(rule) && !ruleDisallowsRoot(rule))) {
      errors.push(`${agent} 為訓練型，不得僅 allow /`);
    }
  }

  return { ok: errors.length === 0, errors };
}

export type RobotsTxtRuleGroup = {
  userAgents: string[];
  allow: string[];
  disallow: string[];
};

/** 解析 robots.txt 文字為規則群組（忽略註解與空行）。 */
export function parseRobotsTxt(text: string): RobotsTxtRuleGroup[] {
  const groups: RobotsTxtRuleGroup[] = [];
  let current: RobotsTxtRuleGroup | null = null;

  const flush = (): void => {
    if (current && current.userAgents.length > 0) {
      groups.push(current);
    }
    current = null;
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.split("#")[0]?.trim() ?? "";
    if (!line) continue;

    const colon = line.indexOf(":");
    if (colon < 0) continue;
    const key = line.slice(0, colon).trim().toLowerCase();
    const value = line.slice(colon + 1).trim();

    if (key === "user-agent") {
      if (!current || (current.allow.length > 0 || current.disallow.length > 0)) {
        flush();
        current = { userAgents: [], allow: [], disallow: [] };
      }
      current!.userAgents.push(value);
      continue;
    }

    if (!current) {
      current = { userAgents: [], allow: [], disallow: [] };
    }
    if (key === "allow") current.allow.push(value || "/");
    if (key === "disallow") current.disallow.push(value || "/");
  }
  flush();
  return groups;
}

function findRobotsTxtGroupForUserAgent(
  groups: RobotsTxtRuleGroup[],
  userAgent: string,
): RobotsTxtRuleGroup | undefined {
  const target = userAgent.toLowerCase();
  return groups.find((g) => g.userAgents.some((ua) => ua.toLowerCase() === target));
}

function isRootPathAllowedInTxtGroup(group: RobotsTxtRuleGroup): boolean {
  const rootDisallow = group.disallow.some((d) => d === "/" || d === "/*");
  if (rootDisallow) return false;
  const rootAllow = group.allow.some((a) => a === "/" || a === "/*");
  if (rootAllow) return true;
  return group.disallow.length === 0;
}

export type RobotsTxtPolicyIssue = { userAgent: string; message: string };

/** 驗證 live robots.txt 文字是否符合本站 AI crawler 契約。 */
export function validateRobotsTxtPolicy(text: string): RobotsTxtPolicyIssue[] {
  const groups = parseRobotsTxt(text);
  const issues: RobotsTxtPolicyIssue[] = [];

  for (const ua of AI_RETRIEVAL_CRAWLERS) {
    const group = findRobotsTxtGroupForUserAgent(groups, ua);
    if (!group) {
      issues.push({ userAgent: ua, message: "缺少專屬 User-agent 規則" });
      continue;
    }
    if (!isRootPathAllowedInTxtGroup(group)) {
      issues.push({ userAgent: ua, message: "根路徑 / 未放行" });
    }
  }

  for (const ua of AI_TRAINING_CRAWLERS) {
    const group = findRobotsTxtGroupForUserAgent(groups, ua);
    if (!group) {
      issues.push({ userAgent: ua, message: "缺少專屬 User-agent 規則" });
      continue;
    }
    if (isRootPathAllowedInTxtGroup(group)) {
      issues.push({ userAgent: ua, message: "根路徑 / 仍被放行（應 Disallow）" });
    }
  }

  const searchGroup = findRobotsTxtGroupForUserAgent(groups, "Claude-SearchBot");
  const trainGroup = findRobotsTxtGroupForUserAgent(groups, "ClaudeBot");
  if (searchGroup && trainGroup && searchGroup === trainGroup) {
    issues.push({
      userAgent: "Claude-SearchBot",
      message: "Claude-SearchBot 與 ClaudeBot 共用同一規則群組",
    });
  }

  return issues;
}
