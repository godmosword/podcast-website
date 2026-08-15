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
  it("Cursor active 路由使用 Luna、Grok High Fast Leader、Composer 對抗審／L1L2", () => {
    for (const file of CURSOR_ACTIVE_FILES) {
      const text = readRepoFile(file);
      expect(text, `${file} 須含 Luna slug`).toContain("gpt-5.6-luna-max-fast");
      expect(text, `${file} 須含 Grok High Fast Leader slug`).toContain(
        "cursor-grok-4.5-high-fast",
      );
      expect(text, `${file} 須含 Composer slug`).toContain("composer-2.5-fast");
      expect(text, `${file} 須含 Opus 5 設計審 slug`).toContain(
        "claude-opus-5-thinking-high",
      );
      expect(text, `${file} 不得再以 Opus 4.8 slug 當 active 路由`).not.toContain(
        "claude-opus-4-8-thinking-medium",
      );
      expect(text, `${file} 不得再以 medium-fast 當 active Grok 路由`).not.toContain(
        "cursor-grok-4.5-medium-fast",
      );
    }

    const workflow = readRepoFile(CURSOR_META);
    expect(workflow).toContain("gpt-5.6-luna-max-fast");
    expect(workflow).toContain("cursor-grok-4.5-high-fast");
    expect(workflow).toContain("composer-2.5-fast");
    expect(workflow).toContain("claude-opus-5-thinking-high");
    // SSOT 缺口回歸防護：對照表必須同時列 Cursor slug 與 grok CLI 備援 model id，
    // 否則 CLI 允許清單漂移時（2026-08-15）無處可查。
    expect(
      workflow.split("## 修訂紀錄")[0],
      "slug 對照表須列 grok CLI 備援 model id",
    ).toContain("grok-4.6");
    // 修訂紀錄可保留歷史 4.8；active 對照表列必須是 5
    const activeWorkflow = workflow.split("## 修訂紀錄")[0];
    expect(activeWorkflow).not.toContain("claude-opus-4-8-thinking-medium");
  });

  it("active 路由不得使用已淘汰的 Grok slug（fast-medium／fast-high 裸名）", () => {
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

  it("Fable 5：active 路由明令禁止，且無正向 Task 派工（Claude Code Leader＝Opus）", () => {
    const ACTIVE_ROUTING_FILES = [
      ".claude/commands/agent-plan.md",
      ".claude/commands/agent-action.md",
      ...CURSOR_ACTIVE_FILES,
      CURSOR_META,
    ];

    for (const file of ACTIVE_ROUTING_FILES) {
      const text = readRepoFile(file);
      // AGENT-WORKFLOW「修訂紀錄」為歷史；active 段須含禁令，且不得正向派工。
      const active =
        file === CURSOR_META
          ? text.split("## 修訂紀錄")[0]
          : text;
      expect(
        active,
        `${file} 須明令禁止 Fable 5／claude-fable-5`,
      ).toMatch(/禁止[^。\n]{0,80}(Fable\s*5|claude-fable-5)/i);
      expect(active, `${file} 不得 Task 正向派工 Fable slug`).not.toMatch(
        /Task[^\n]{0,120}claude-fable-5/i,
      );
      expect(active, `${file} 不得 model: 指定 Fable`).not.toMatch(
        /model:\s*["']claude-fable-5/i,
      );
    }

    for (const file of [
      ".claude/commands/agent-plan.md",
      ".claude/commands/agent-action.md",
    ]) {
      expect(readRepoFile(file)).toContain("claude-opus-5-thinking-high");
    }

    const hooks = readRepoFile(".cursor/hooks.json");
    expect(hooks, "hooks.json 須註冊 block-fable").toContain("block-fable.mjs");
    expect(hooks).toContain("subagentStart");
    expect(readRepoFile(".cursor/hooks/block-fable.mjs")).toContain(
      "shouldBlockFable",
    );
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

  it("AGENT-FAILURES 探活表使用 cursor-grok-4.5-high-fast 與 composer-2.5-fast", () => {
    const failures = readRepoFile(FAILURES);
    const probeSection =
      failures.match(/## 探活命令[\s\S]*?(?=## 已知案例)/)?.[0] ?? "";
    expect(probeSection.length).toBeGreaterThan(0);
    expect(probeSection).toContain("cursor-grok-4.5-high-fast");
    expect(probeSection).toContain("composer-2.5-fast");
    expect(probeSection).not.toContain("cursor-grok-4.5-medium-fast");
    expect(probeSection).not.toContain("grok-4.5-fast-medium");
    expect(probeSection).not.toContain("grok-4.5-fast-high");
    // Claude Code CLI 備援 model id：一律 -m grok-4.6。
    // 與 Cursor 的 cursor-grok-4.5-high-fast 是**兩套** id，勿混用；CLI 不吃 -fast 變體。
    // 2026-08-15 grok models 允許清單已無 grok-4.5（見 FAILURES 08-15）。
    // 原本這裡是 if(...) 條件式，slug 一漂移就整段靜默跳過；改為無條件斷言。
    expect(probeSection).toContain("-m grok-4.6");
    expect(probeSection).not.toContain("-m grok-4.5");
    expect(probeSection).not.toContain("-m grok-4.6-fast");
  });

  it("禁用 AUQ：規則、hook、podcast 與 FAILURES 對齊", () => {
    const rule = readRepoFile(".cursor/rules/no-ask-user-questions.mdc");
    expect(rule).toContain("alwaysApply: true");
    expect(rule).toContain("ask_user_questions");
    expect(rule).toContain("AskQuestion");

    const hooks = readRepoFile(".cursor/hooks.json");
    expect(hooks).toContain("beforeMCPExecution");
    expect(hooks).toContain("preToolUse");
    expect(hooks).toContain(".cursor/hooks/block-auq.mjs");
    expect(hooks).toContain("failClosed");

    const podcast = readRepoFile(PODCAST_RULE);
    expect(podcast).toContain("禁止 AskQuestion／AUQ");
    expect(podcast).toContain("no-ask-user-questions.mdc");

    const failures = readRepoFile(FAILURES);
    expect(failures).toContain("block-auq.mjs");
    expect(failures).toContain("ask_user_questions");

    const domain = readRepoFile("docs/AGENT-DOMAIN.md");
    expect(domain).toContain("AskQuestion／AUQ");
  });
});
