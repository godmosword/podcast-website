#!/usr/bin/env node
/**
 * 阻擋 Fable 5（claude-fable-5-*）被 /agent-plan、/agent-action 經 Task／subagent 派工。
 * 用於 preToolUse 與 subagentStart。
 *
 * 只檢查 model／slug 欄位，不掃 prompt 全文——避免「禁止 Fable」說明文字誤擋。
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
 * 從 payload 抽出「模型指派」字串（頂層 + tool_input／arguments 的 model 欄）。
 * @param {Record<string, unknown>} input
 * @returns {string[]}
 */
export function extractModelAssignmentStrings(input) {
  /** @type {string[]} */
  const out = [];
  const push = (v) => {
    const s = asString(v).trim();
    if (s) out.push(s);
  };

  push(input.model);
  push(input.subagent_model);
  push(input.agent_model);
  push(input.modelId);
  push(input.model_slug);

  const nested = input.tool_input ?? input.arguments ?? input.toolInput;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    const n = /** @type {Record<string, unknown>} */ (nested);
    push(n.model);
    push(n.subagent_model);
    push(n.agent_model);
    push(n.modelId);
    push(n.model_slug);
  }

  return out;
}

const FABLE_MODEL_RE = /claude-fable-5|fable\s*5|\bfable-5\b/i;

/**
 * 是否為 Fable 5 相關派工（僅 model slug／顯示名欄位）。
 * @param {Record<string, unknown>} input
 */
export function shouldBlockFable(input) {
  return extractModelAssignmentStrings(input).some((s) =>
    FABLE_MODEL_RE.test(s),
  );
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
