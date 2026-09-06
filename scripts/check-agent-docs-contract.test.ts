import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

function activeSection(relativePath: string): string {
  return readRepoFile(relativePath).split("## 修訂紀錄")[0];
}

const WORKFLOW = "docs/AGENT-WORKFLOW.md";
const PODCAST_RULE = ".cursor/rules/podcast.mdc";
const ROUTING_FILES = [
  ".cursor/commands/agent-plan.md",
  ".cursor/commands/agent-action.md",
  ".claude/commands/agent-plan.md",
  ".claude/commands/agent-action.md",
  ".cursor/rules/agent-orchestration.mdc",
] as const;

function frontmatterValue(text: string, key: string): string {
  const match = text.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim() ?? "";
}

describe("agent docs routing contract", () => {
  it("canonical workflow defines risk tiers and avoids a fixed committee default", () => {
    const workflow = activeSection(WORKFLOW);
    for (const tier of ["L0", "L1", "L2", "L3"]) {
      expect(workflow, `workflow 須含 ${tier}`).toContain(tier);
    }
    expect(workflow).toContain("L2 至少安排一個未撰寫該 Plan 的 readonly 工程審");
    expect(workflow).toContain("UI 風險（Opus 設計審不可跳過）");
    expect(workflow).toContain("Handoff（explore → 實作");
    expect(workflow).toContain("已確認路徑");
    expect(workflow).toContain("不按每次 plan/action 重複探活");
    expect(workflow).not.toContain("固定三審委員會");
    expect(workflow).not.toContain("固定全表規則");
    expect(workflow).toContain("StoryPlayer");
    expect(workflow).toContain("prefers-reduced-motion");
    expect(workflow).toContain("CRITICAL-n");
    expect(workflow).toContain("只有使用者回覆 A 才改檔");
  });

  it("active model routing uses current slugs and no retired routes", () => {
    const workflow = activeSection(WORKFLOW);
    for (const slug of [
      "cursor-grok-4.5-high-fast",
      "gpt-5.6-luna-max-fast",
      "composer-2.5-fast",
      "claude-opus-5-thinking-high",
      "gpt-5.6-luna",
      "grok-4.6",
    ]) {
      expect(workflow, `workflow 須含 ${slug}`).toContain(slug);
    }

    for (const file of ROUTING_FILES) {
      const text = activeSection(file);
      expect(text, `${file} 不得使用 Fable`).not.toMatch(
        /Task[^\n]{0,120}claude-fable-5|model:\s*["']claude-fable-5/i,
      );
      expect(text, `${file} 不得使用淘汰 slug`).not.toMatch(
        /grok-build-0\.1|grok-4\.3|cursor-grok-4\.5-medium-fast|grok-4\.5-fast-(?:medium|high)/,
      );
    }
  });

  it("CLAUDE.md uses conditional routing", () => {
    const claude = readRepoFile("CLAUDE.md");
    expect(claude).toContain("docs/AGENT-WORKFLOW.md");
    expect(claude).not.toContain("When in doubt, invoke the skill");
    expect(claude).toContain("只有使用者明確要求");
  });

  it("global rules stay short while scenario rules are conditional", () => {
    const podcast = readRepoFile(PODCAST_RULE);
    expect(frontmatterValue(podcast, "alwaysApply")).toBe("true");
    expect(podcast.split("\n").length).toBeLessThanOrEqual(35);
    expect(podcast).toContain("不 commit、不 push");
    expect(podcast).toContain("每輪只跑一輪");
    expect(podcast).toContain("podcast-image-cost.mdc");
    expect(podcast).not.toContain("每個任務都遵守");
    expect(podcast).not.toContain("npm test");

    for (const file of [
      ".cursor/rules/podcast-technical.mdc",
      ".cursor/rules/podcast-verification.mdc",
      ".cursor/rules/podcast-image-cost.mdc",
    ]) {
      const text = readRepoFile(file);
      expect(text, `${file} 應按需載入`).toContain("alwaysApply: false");
      expect(text, `${file} 應有 glob`).toContain("globs:");
    }
    expect(readRepoFile(".cursor/rules/podcast-technical.mdc")).toContain(
      "Next.js 16",
    );
    expect(podcast).not.toContain("Next.js 15");
  });

  it("Claude 與 Cursor command adapters 共享 canonical workflow", () => {
    for (const file of ROUTING_FILES.slice(0, 4)) {
      const text = readRepoFile(file);
      expect(text, `${file} 應引用 canonical workflow`).toContain(
        "docs/AGENT-WORKFLOW.md",
      );
      expect(text, `${file} 應含 L2`).toContain("L2");
      expect(text, `${file} 應含 L3`).toContain("L3");
      expect(text, `${file} 不應複製固定三審`).not.toContain("固定三審");
    }
  });

  it("AUQ、Fable 與付費生圖安全防線仍存在", () => {
    const auq = readRepoFile(".cursor/rules/no-ask-user-questions.mdc");
    expect(frontmatterValue(auq, "alwaysApply")).toBe("true");
    for (const term of ["AskQuestion", "ask_user_questions", "get_answered_questions"]) {
      expect(auq).toContain(term);
    }

    const hooks = readRepoFile(".cursor/hooks.json");
    expect(hooks).toContain("beforeMCPExecution");
    expect(hooks).toContain("preToolUse");
    expect(hooks).toContain("block-auq.mjs");
    expect(hooks).toContain("block-fable.mjs");

    const podcast = readRepoFile(PODCAST_RULE);
    expect(podcast).toContain("禁止 AskQuestion／AUQ");
    expect(podcast).toContain("podcast-image-cost.mdc");
    expect(readRepoFile(".cursor/rules/podcast-image-cost.mdc")).toContain(
      "明確確認",
    );
  });

  it("failure records have a small active section and a historical archive", () => {
    const active = readRepoFile("docs/AGENT-FAILURES.md");
    expect(active).toContain("archive/AGENT-FAILURES-2026.md");
    expect(active).toContain("只有本次確實要呼叫外部模型時才讀");
    expect(active).toContain("不按每次 plan/action 重複探活");
    expect(active.split("\n").length).toBeLessThanOrEqual(100);
    expect(existsSync(join(ROOT, "docs/archive/AGENT-FAILURES-2026.md"))).toBe(true);
    expect(readRepoFile("docs/archive/AGENT-FAILURES-2026.md")).toContain(
      "Agent Model-Call 失敗案例簿",
    );
  });

  it("repository discovery boundary excludes dependency instructions", () => {
    const workflow = activeSection(WORKFLOW);
    expect(workflow).toContain("受版本控制的檔案");
    expect(workflow).toContain("node_modules");
    expect(workflow).toContain("SKILL.md");
    expect(workflow).toContain("AGENTS.md");
  });
});
