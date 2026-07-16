import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), "utf8");
}

/** Cursor active 路由檔（歷史修訂紀錄不在此列負向檢查範圍外，但 active slug 必須一致） */
const CURSOR_ACTIVE_FILES = [
  ".cursor/commands/agent-plan.md",
  ".cursor/commands/agent-action.md",
  ".cursor/rules/agent-orchestration.mdc",
] as const;

const CURSOR_META = "docs/AGENT-WORKFLOW.md";
const FAILURES = "docs/AGENT-FAILURES.md";
const PODCAST_RULE = ".cursor/rules/podcast.mdc";

describe("agent docs routing contract", () => {
  it("Cursor active 路由使用 gpt-5.6-luna-max-fast 與 cursor-grok-4.5-medium-fast", () => {
    for (const file of CURSOR_ACTIVE_FILES) {
      const text = readRepoFile(file);
      expect(text, `${file} 須含 Luna slug`).toContain("gpt-5.6-luna-max-fast");
      expect(text, `${file} 須含 Grok Medium Fast slug`).toContain(
        "cursor-grok-4.5-medium-fast",
      );
    }

    const workflow = readRepoFile(CURSOR_META);
    expect(workflow).toContain("gpt-5.6-luna-max-fast");
    expect(workflow).toContain("cursor-grok-4.5-medium-fast");
  });

  it("active 路由不得使用已淘汰的 Grok slug（fast-medium／fast-high）", () => {
    for (const file of [...CURSOR_ACTIVE_FILES, CURSOR_META]) {
      const text = readRepoFile(file);
      expect(text, `${file} 不得含 medium slug`).not.toContain(
        "grok-4.5-fast-medium",
      );
      expect(text, `${file} 不得含 fast-high slug`).not.toContain(
        "grok-4.5-fast-high",
      );
    }
  });

  it("codex exec active 路由使用 gpt-5.6-luna（禁裸 gpt-5.6 與 Cursor 專用 luna-max-fast）", () => {
    const claudePlan = readRepoFile(".claude/commands/agent-plan.md");
    const claudeAction = readRepoFile(".claude/commands/agent-action.md");
    const failures = readRepoFile(FAILURES);

    // Cursor Task slug 永不進 codex exec（FAILURES 歷史列也不例外）
    for (const text of [claudePlan, claudeAction, failures]) {
      expect(text).not.toMatch(/codex exec -m gpt-5\.6-luna-max-fast/);
    }

    // Claude Code active 命令：codex 一律 gpt-5.6-luna；
    // 裸 gpt-5.6 於 ChatGPT 帳號回 400（見 FAILURES 07-13／07-16），不得回退
    for (const text of [claudePlan, claudeAction]) {
      expect(text).toContain("codex exec -m gpt-5.6-luna");
      expect(text).not.toMatch(/codex exec -m gpt-5\.6(?!-luna)/);
    }
  });

  it("podcast.mdc 註明 Agent Orchestration 優先於一般 commit 慣例", () => {
    const rule = readRepoFile(PODCAST_RULE);
    expect(rule).toContain("/agent-plan");
    expect(rule).toContain("/agent-action");
    expect(rule).toContain("commit／push 僅在使用者明確要求時");
  });

  it("AGENT-WORKFLOW 含 explore handoff 與 UI 風險 Opus 觸發規則", () => {
    const workflow = readRepoFile(CURSOR_META);
    expect(workflow).toContain("Handoff（explore → 實作");
    expect(workflow).toContain("已確認路徑");
    expect(workflow).toContain("UI 風險（Opus 設計審不可跳過）");
    expect(workflow).toContain("StoryPlayer");
    expect(workflow).toContain("prefers-reduced-motion");
  });

  it("agent-plan 含 Plan 工程審分離規則", () => {
    const plan = readRepoFile(".cursor/commands/agent-plan.md");
    expect(plan).toContain("Plan 工程審分離");
    expect(plan).toContain("你未撰寫此 Plan");
    expect(plan).toContain("≥3 點");
  });

  it("AGENT-FAILURES 探活表使用 cursor-grok-4.5-medium-fast 與 CLI grok-4.5", () => {
    const failures = readRepoFile(FAILURES);
    const probeSection =
      failures.match(/## 探活命令[\s\S]*?(?=## 已知案例)/)?.[0] ?? "";
    expect(probeSection.length).toBeGreaterThan(0);
    expect(probeSection).toContain("cursor-grok-4.5-medium-fast");
    expect(probeSection).not.toContain("grok-4.5-fast-medium");
    expect(probeSection).not.toContain("grok-4.5-fast-high");
    // Claude Code CLI 呼叫一律 -m grok-4.5（grok-4.5-fast 為無效 model id，見 07-13 案例）
    expect(probeSection).toContain("-m grok-4.5 ");
    expect(probeSection).not.toContain("-m grok-4.5-fast");
  });
});
