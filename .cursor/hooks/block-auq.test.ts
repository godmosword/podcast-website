import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { shouldBlockAuq } from "./block-auq.mjs";

const HOOK = join(process.cwd(), ".cursor/hooks/block-auq.mjs");

function runHook(payload: Record<string, unknown>): {
  permission: string;
  agent_message?: string;
} {
  const result = spawnSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: "utf8",
  });
  expect(result.status).toBe(0);
  return JSON.parse(result.stdout.trim()) as {
    permission: string;
    agent_message?: string;
  };
}

describe("block-auq hook", () => {
  it("shouldBlockAuq 辨識 AUQ／AskQuestion 相關 payload", () => {
    expect(shouldBlockAuq({ tool_name: "ask_user_questions" })).toBe(true);
    expect(shouldBlockAuq({ tool_name: "AskQuestion" })).toBe(true);
    expect(shouldBlockAuq({ tool_name: "get_answered_questions" })).toBe(true);
    expect(
      shouldBlockAuq({
        tool_name: "CallMcpTool",
        tool_input: {
          server: "user-ask-user-questions",
          toolName: "ask_user_questions",
        },
      }),
    ).toBe(true);
    expect(
      shouldBlockAuq({
        tool_name: "search_repo",
        command: "npx -y auq-mcp-server server",
      }),
    ).toBe(true);
    expect(shouldBlockAuq({ tool_name: "list_items_in_registries" })).toBe(
      false,
    );
  });

  it("stdin 執行：deny AUQ、allow 其他 MCP", () => {
    const denied = runHook({ tool_name: "ask_user_questions" });
    expect(denied.permission).toBe("deny");
    expect(denied.agent_message).toMatch(/禁止呼叫/);

    const allowed = runHook({ tool_name: "reply", command: "telegram" });
    expect(allowed.permission).toBe("allow");
  });
});
