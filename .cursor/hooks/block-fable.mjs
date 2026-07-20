#!/usr/bin/env node
/**
 * 阻擋 Fable 5（claude-fable-5-*）被 /agent-plan、/agent-action 經 Task／subagent 派工。
 * 用於 preToolUse 與 subagentStart。
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DENY = {
  permission: "deny",
  user_message:
    "本專案已禁用 Fable 5（claude-fable-5-*），不得經 agent-plan／agent-action 派工。",
  agent_message:
    "禁止呼叫 Fable 5／claude-fable-5-thinking-medium。改用對照表：設計審／Claude Code Leader → claude-opus-4-8-thinking-medium；Cursor Leader → cursor-grok-4.5-high-fast；L1／L2 → composer-2.5-fast。見 docs/AGENT-WORKFLOW.md § 模型 slug 對照表。",
};

/** @param {unknown} value */
function asString(value) {
  return typeof value === "string" ? value : "";
}

/**
 * 是否為 Fable 5 相關派工（model slug／顯示名）。
 * @param {Record<string, unknown>} input
 */
export function shouldBlockFable(input) {
  const toolName = asString(
    input.tool_name ?? input.toolName ?? input.tool ?? "",
  ).toLowerCase();
  const model = asString(
    input.model ?? input.subagent_model ?? input.agent_model ?? "",
  ).toLowerCase();
  const command = asString(input.command ?? "").toLowerCase();
  const toolInput = input.tool_input ?? input.arguments ?? input.toolInput;
  const toolInputText =
    typeof toolInput === "string"
      ? toolInput.toLowerCase()
      : JSON.stringify(toolInput ?? {}).toLowerCase();
  const blob = `${toolName}\n${model}\n${command}\n${toolInputText}\n${JSON.stringify(input).toLowerCase()}`;

  // slug 與顯示名；避免誤擋「fable」無關英文字時以 claude-fable / fable 5 為準
  const patterns = [
    /claude-fable-5/,
    /fable\s*5/,
    /\bfable-5\b/,
  ];

  return patterns.some((re) => re.test(blob));
}

function main() {
  let input = {};
  try {
    const raw = readFileSync(0, "utf8").trim();
    input = raw ? JSON.parse(raw) : {};
  } catch {
    process.stdout.write(`${JSON.stringify({ permission: "allow" })}\n`);
    return;
  }

  if (shouldBlockFable(/** @type {Record<string, unknown>} */ (input))) {
    process.stdout.write(`${JSON.stringify(DENY)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify({ permission: "allow" })}\n`);
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  main();
}
