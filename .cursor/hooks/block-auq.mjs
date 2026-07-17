#!/usr/bin/env node
/**
 * 阻擋 Ask User Questions（AUQ）／AskQuestion，避免阻塞式 MCP 卡住整輪 agent。
 * 用於 beforeMCPExecution 與 preToolUse。
 */
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

const DENY = {
  permission: "deny",
  user_message:
    "本專案已禁用 Ask User Questions（AUQ／AskQuestion），避免阻塞式卡住。",
  agent_message:
    "禁止呼叫 AskQuestion、ask_user_questions、get_answered_questions。改在聊天訊息用文字列出選項（A/B/C 或 1/2/3），等使用者直接回覆；勿再呼叫 AUQ MCP。",
};

/** @param {unknown} value */
function asString(value) {
  return typeof value === "string" ? value : "";
}

/** @param {Record<string, unknown>} input */
export function shouldBlockAuq(input) {
  const toolName = asString(
    input.tool_name ?? input.toolName ?? input.tool ?? "",
  ).toLowerCase();
  const command = asString(input.command ?? "").toLowerCase();
  const url = asString(input.url ?? "").toLowerCase();
  const toolInput = input.tool_input ?? input.arguments ?? input.toolInput;
  const toolInputText =
    typeof toolInput === "string"
      ? toolInput.toLowerCase()
      : JSON.stringify(toolInput ?? {}).toLowerCase();
  const blob = `${toolName}\n${command}\n${url}\n${toolInputText}\n${JSON.stringify(input).toLowerCase()}`;

  const patterns = [
    /\baskquestion\b/,
    /\bask_user_questions\b/,
    /\bget_answered_questions\b/,
    /\bauq-mcp/,
    /ask-user-questions/,
    /user-ask-user-questions/,
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

  if (shouldBlockAuq(/** @type {Record<string, unknown>} */ (input))) {
    process.stdout.write(`${JSON.stringify(DENY)}\n`);
    return;
  }

  process.stdout.write(`${JSON.stringify({ permission: "allow" })}\n`);
}

const entry = process.argv[1] ? pathToFileURL(process.argv[1]).href : "";
if (import.meta.url === entry) {
  main();
}
