import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  extractModelAssignmentStrings,
  shouldBlockFable,
} from "./block-fable.mjs";

const HOOK = join(process.cwd(), ".cursor/hooks/block-fable.mjs");

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

describe("block-fable hook", () => {
  it("shouldBlockFable 辨識 Fable 5 slug／顯示名（僅 model 欄）", () => {
    expect(
      shouldBlockFable({ model: "claude-fable-5-thinking-medium" }),
    ).toBe(true);
    expect(shouldBlockFable({ model: "Fable 5 Thinking Medium" })).toBe(true);
    expect(
      shouldBlockFable({
        tool_name: "Task",
        tool_input: { model: "claude-fable-5-thinking-medium" },
      }),
    ).toBe(true);
    expect(
      shouldBlockFable({
        tool_name: "CallDynamicTool",
        arguments: { model: "claude-fable-5-thinking-medium" },
      }),
    ).toBe(true);
    expect(shouldBlockFable({ model: "claude-opus-4-8-thinking-medium" })).toBe(
      false,
    );
    expect(shouldBlockFable({ model: "composer-2.5-fast" })).toBe(false);
    expect(shouldBlockFable({ tool_name: "Shell", command: "npm test" })).toBe(
      false,
    );
  });

  it("prompt 提及禁令文字不誤擋（model 為 Composer）", () => {
    expect(
      shouldBlockFable({
        tool_name: "Task",
        model: "composer-2.5-fast",
        tool_input: {
          model: "composer-2.5-fast",
          prompt:
            "Do NOT call Fable 5 or claude-fable-5-thinking-medium. Use Opus.",
        },
      }),
    ).toBe(false);
    expect(
      extractModelAssignmentStrings({
        model: "composer-2.5-fast",
        tool_input: {
          model: "composer-2.5-fast",
          prompt: "禁止呼叫 Fable 5",
        },
      }),
    ).toEqual(["composer-2.5-fast", "composer-2.5-fast"]);
  });

  it("stdin 執行：deny Fable、allow 其他 model", () => {
    const denied = runHook({
      tool_name: "Task",
      model: "claude-fable-5-thinking-medium",
    });
    expect(denied.permission).toBe("deny");
    expect(denied.agent_message).toMatch(/禁止呼叫 Fable 5/);

    const allowed = runHook({
      tool_name: "Task",
      model: "composer-2.5-fast",
      tool_input: {
        model: "composer-2.5-fast",
        prompt: "Mentioning Fable 5 ban in prompt must not deny",
      },
    });
    expect(allowed.permission).toBe("allow");
  });
});
