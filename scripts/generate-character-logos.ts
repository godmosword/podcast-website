#!/usr/bin/env tsx
/**
 * 角色 Logo 產圖 CLI（Phase 5）。
 *
 *   npm run generate:character-logos -- --pilot --dry-run
 *   npm run generate:character-logos -- --tier 1 --dry-run
 *   npm run generate:character-logos -- --slug xiao-hong --candidates 4 --dry-run
 *   npm run generate:character-logos -- --slug xiao-hong --candidates 4
 *   npm run generate:character-logos -- --approve --slug xiao-hong --pick 2
 *
 * 紅線：CI 不放 OPENAI_API_KEY；未 --approve 不上線；不動 public/characters/*.jpg；
 * 禁止黏土定裝前綴。未回填 Pilot 參數前拒絕 --tier 2 生圖。
 */
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { getImageModel } from "./lib/illustrate-core";
import { ROOT } from "./lib/transcribe-core";
import {
  LOGO_NATIVE_SIZE,
  approveLogoFromStaging,
  assertGenerationAllowed,
  buildLogoJobs,
  formatDryRunReport,
  generateJobsToStaging,
  logoPathsFor,
  parseLogoCliArgs,
  type LogoQuality,
} from "./lib/generate-character-logos-core";

function requireKey(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("缺 OPENAI_API_KEY（.env.local）；本腳本僅限本機執行。");
  }
}

async function generateLogoPng(
  prompt: string,
  quality: LogoQuality,
): Promise<Buffer> {
  requireKey();
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();
  const res = await client.images.generate({
    model: getImageModel(),
    prompt,
    size: LOGO_NATIVE_SIZE,
    quality,
  });
  const b64 = res.data?.[0]?.b64_json;
  if (!b64) throw new Error("圖像模型未回傳影像");
  return Buffer.from(b64, "base64");
}

async function main(): Promise<void> {
  const args = parseLogoCliArgs(process.argv.slice(2));
  const jobs = buildLogoJobs(args);
  const model = getImageModel();

  if (args.mode === "dry-run") {
    process.stdout.write(`${formatDryRunReport({ args, jobs, model })}\n`);
    return;
  }

  if (args.mode === "approve") {
    if (args.selection.kind !== "slug") {
      throw new Error("--approve 必須搭配單一 --slug");
    }
    const slug = args.selection.slugs[0]!;
    const written = await approveLogoFromStaging({
      paths: logoPathsFor(ROOT),
      slug,
      pick: args.pick,
    });
    process.stdout.write(
      `已上線 ${slug}：\n${written.map((path) => `  ${path.replace(`${ROOT}/`, "")}`).join("\n")}\n` +
        "接著打開 /studio/logo-audit 驗 32px。\n",
    );
    return;
  }

  assertGenerationAllowed(args);
  process.stderr.write(
    `生圖 ${jobs.length} 角 × 候選，共 ${jobs.reduce((sum, job) => sum + job.candidates, 0)} 張（${model} ${LOGO_NATIVE_SIZE} ${args.quality}）…\n`,
  );
  const written = await generateJobsToStaging({
    paths: logoPathsFor(ROOT),
    jobs,
    args,
    model,
    generatePng: (prompt) => generateLogoPng(prompt, args.quality),
  });
  process.stdout.write(
    `staging ${written.length} 張。審 public/.logo-staging/<slug>/contact.html 後：\n` +
      "  npm run generate:character-logos -- --approve --slug <slug> --pick N\n",
  );
}

const isDirectRun =
  process.argv[1] !== undefined &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
