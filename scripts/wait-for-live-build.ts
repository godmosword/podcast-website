/**
 * 等正式網域換上這次 push 的 commit。
 *
 *   npx tsx scripts/wait-for-live-build.ts --base-url=https://carcarplayground.com \
 *     --sha=$GITHUB_SHA --branch=$GITHUB_REF_NAME [--timeout-seconds=1500] [--interval-seconds=20]
 *
 * 在 GITHUB_OUTPUT 寫 ready=true|false：
 * - true：網域已在跑這個 commit，後面可以跑上線檢查與 IndexNow。
 * - false：這個分支不負責正式網域（例如移網域後 main 的 push），正常略過。
 * 逾時以 exit 1 結束：負責網域的分支 push 了，網域卻一直沒換。
 * 常見原因是部署失敗，或在 Vercel 回滾之後，正式網域的自動指派被關掉了。
 */
import { appendFileSync } from "node:fs";
import {
  decideLiveBuild,
  expectedEditionForBranch,
  parseBuildInfo,
  type LiveProbe,
} from "./lib/live-build";

const FETCH_TIMEOUT_MS = 15_000;
const DEFAULT_TIMEOUT_SECONDS = 1500;
const DEFAULT_INTERVAL_SECONDS = 20;
/** job 本身 40 分鐘就會被砍，更長的等待沒有意義，也避開 Node timer 上限。 */
const MAX_SECONDS = 3600;

function arg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .slice(2)
    .find((value) => value.startsWith(prefix))
    ?.slice(prefix.length);
}

function positiveSeconds(name: string, fallback: number): number {
  const raw = arg(name);
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0 || value > MAX_SECONDS) {
    throw new Error(`--${name} 要是 1–${MAX_SECONDS} 的整數秒，收到 ${raw}`);
  }
  return value;
}

function writeOutput(ready: boolean): void {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) {
    // 在 Actions 裡缺輸出檔，後面的步驟會因為讀不到 ready 而默默略過，寧可直接失敗。
    if (process.env.GITHUB_ACTIONS === "true") throw new Error("缺少 GITHUB_OUTPUT");
    return;
  }
  appendFileSync(outputPath, `ready=${ready}\n`, "utf8");
}

/** 同時寫 stdout 與 GitHub Job Summary。 */
function report(line: string): void {
  console.log(line);
  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  try {
    appendFileSync(summaryPath, `${line}\n`, "utf8");
  } catch {
    // Job Summary 寫不進去不影響判斷
  }
}

async function probe(baseUrl: string): Promise<LiveProbe> {
  try {
    const response = await fetch(`${baseUrl}/build-info.json?t=${Date.now()}`, {
      headers: { "Cache-Control": "no-cache" },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) return { kind: "unavailable", reason: `HTTP ${response.status}` };
    const info = parseBuildInfo(await response.json());
    return info
      ? { kind: "ok", info }
      : { kind: "unavailable", reason: "build-info.json 格式不對" };
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "unavailable", reason };
  }
}

function describeProbe(result: LiveProbe): string {
  if (result.kind !== "ok") return `讀不到（${result.reason}）`;
  const commit = result.info.commit?.slice(0, 8) ?? "沒有 commit";
  return `${result.info.edition} @ ${commit}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const baseUrl = arg("base-url")?.replace(/\/+$/, "");
  const sha = arg("sha")?.trim();
  const branch = arg("branch")?.trim() ?? "";
  if (!baseUrl || !sha) {
    throw new Error("用法：--base-url=<https://…> --sha=<commit> --branch=<分支>");
  }
  const timeoutMs = positiveSeconds("timeout-seconds", DEFAULT_TIMEOUT_SECONDS) * 1000;
  const intervalMs = positiveSeconds("interval-seconds", DEFAULT_INTERVAL_SECONDS) * 1000;

  const expected = expectedEditionForBranch(branch);
  if (!expected) {
    report(`略過：${branch || "（沒有分支名稱）"} 不負責正式網域。`);
    writeOutput(false);
    return;
  }

  const deadline = Date.now() + timeoutMs;
  let last: LiveProbe = { kind: "unavailable", reason: "還沒查" };
  while (Date.now() < deadline) {
    last = await probe(baseUrl);
    const decision = decideLiveBuild(last, expected, sha);
    if (decision === "ready") {
      report(`${baseUrl} 已換上 ${sha.slice(0, 8)}（${expected}）。`);
      writeOutput(true);
      return;
    }
    if (decision === "not-owner") {
      report(`略過：${baseUrl} 目前是 ${describeProbe(last)}，不歸 ${branch}（${expected}）管。`);
      writeOutput(false);
      return;
    }
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    console.log(`等待中：${describeProbe(last)}`);
    await sleep(Math.min(intervalMs, remaining));
  }

  report(
    `⚠ ${timeoutMs / 1000} 秒內 ${baseUrl} 沒換上 ${sha.slice(0, 8)}，最後看到 ${describeProbe(last)}。` +
      "請檢查 Vercel 部署是否失敗，或回滾後正式網域的自動指派是否被關掉。",
  );
  writeOutput(false);
  process.exitCode = 1;
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`wait-for-live-build：${message}`);
  process.exitCode = 1;
});
