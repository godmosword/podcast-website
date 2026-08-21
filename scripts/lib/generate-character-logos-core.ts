/**
 * 角色 Logo 產圖管線核心（Phase 5）。
 *
 * 只負責計畫、staging、approve 與重試契約。真正呼叫圖像 API 由 CLI 注入，
 * 單元測試不得連網。禁止黏土定裝前綴、禁止寫入 public/characters/*.jpg。
 */
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import {
  PILOT_SLUGS,
  TIER1_SLUGS,
  familyBackgroundHex,
  getCharacterLogo,
  getCharacterLogos,
  type CharacterLogo,
  type CharacterLogoStatus,
} from "@/data/character-logos";
import { auditEntry, trackLabel } from "@/lib/character-logo-contrast";
import { CLAY_STYLE_PREFIX } from "./illustrate-core";
import {
  buildLogoPrompt,
  parseSharedPromptBlocks,
} from "../generate-logo-prompts";

export const LOGO_STAGING_DIR = "public/.logo-staging";
export const LOGO_PUBLIC_DIR = "public/characters/logo";
export const LOGO_NATIVE_SIZE = "1024x1024" as const;
export const LOGO_OUTPUT_PX = [512, 128, 32] as const;
export const MAX_ATTEMPTS_PER_IMAGE = 2;
/** Pilot 回填 SPEC 眼睛比／圓角比／特徵佔比後才翻 true。 */
export const LOGO_PILOT_PARAMS_LOCKED = false;

export const COST_USD_PER_IMAGE = {
  medium: 0.053,
  high: 0.211,
} as const;

export type LogoQuality = keyof typeof COST_USD_PER_IMAGE;
export type LogoCliMode = "dry-run" | "generate" | "approve";
export type LogoSelection =
  | { kind: "pilot" }
  | { kind: "tier"; tier: 1 | 2 }
  | { kind: "slug"; slugs: string[] };

export type LogoCliArgs = {
  mode: LogoCliMode;
  selection: LogoSelection;
  quality: LogoQuality;
  candidates?: number;
  pick?: number;
};

export type LogoJob = {
  slug: string;
  name: string;
  candidates: number;
  prompt: string;
};

export type LogoCandidate = {
  index: number;
  file: string;
};

export type LogoStagingManifest = {
  slug: string;
  name: string;
  model: string;
  quality: LogoQuality;
  size: typeof LOGO_NATIVE_SIZE;
  createdAt: string;
  candidates: LogoCandidate[];
};

export type LogoPaths = {
  repoRoot: string;
  stagingRoot: string;
  publicLogoDir: string;
  rosterPath: string;
  sharedPromptPath: string;
};

export function logoPathsFor(repoRoot: string): LogoPaths {
  return {
    repoRoot,
    stagingRoot: join(repoRoot, LOGO_STAGING_DIR),
    publicLogoDir: join(repoRoot, LOGO_PUBLIC_DIR),
    rosterPath: join(repoRoot, "data/character-logos.json"),
    sharedPromptPath: join(repoRoot, "docs/logo-prompts/_shared.md"),
  };
}

export function remainingTier1Slugs(): string[] {
  const pilots = new Set<string>(PILOT_SLUGS);
  return TIER1_SLUGS.filter((slug) => !pilots.has(slug));
}

export function defaultCandidateCount(selection: LogoSelection): number {
  if (selection.kind === "pilot") return 4;
  if (selection.kind === "tier" && selection.tier === 1) return 2;
  return 1;
}

function flagValue(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index === -1) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) {
    throw new Error(`${name} 需要值`);
  }
  return value;
}

function parsePositiveInt(
  raw: string,
  flag: string,
  min: number,
  max: number,
): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${flag} 必須是 ${min}–${max} 的整數`);
  }
  return value;
}

export function parseLogoCliArgs(argv: string[]): LogoCliArgs {
  const hasPilot = argv.includes("--pilot");
  const hasTier = argv.includes("--tier");
  const hasSlug = argv.includes("--slug");
  const selectors = [hasPilot, hasTier, hasSlug].filter(Boolean).length;
  if (selectors === 0) {
    throw new Error("請指定 --pilot、--tier 或 --slug（拒絕預設生 35 張）");
  }
  if (selectors > 1) {
    throw new Error("--pilot／--tier／--slug 只能選一種");
  }

  const dryRun = argv.includes("--dry-run");
  const approve = argv.includes("--approve");
  if (dryRun && approve) {
    throw new Error("--dry-run 與 --approve 不能同時使用");
  }
  if (approve && !hasSlug) {
    throw new Error("--approve 必須搭配單一 --slug");
  }

  let selection: LogoSelection;
  if (hasPilot) {
    selection = { kind: "pilot" };
  } else if (hasTier) {
    const raw = flagValue(argv, "--tier");
    if (raw !== "1" && raw !== "2") {
      throw new Error("--tier 只能是 1 或 2");
    }
    selection = { kind: "tier", tier: Number(raw) as 1 | 2 };
  } else {
    const raw = flagValue(argv, "--slug");
    const slugs = (raw ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (slugs.length === 0) {
      throw new Error("--slug 需要至少一個角色 id");
    }
    if (approve && slugs.length !== 1) {
      throw new Error("--approve 必須搭配單一 --slug");
    }
    selection = { kind: "slug", slugs };
  }

  const qualityRaw = flagValue(argv, "--quality");
  let quality: LogoQuality;
  if (qualityRaw) {
    if (qualityRaw !== "medium" && qualityRaw !== "high") {
      throw new Error("--quality 只能是 medium 或 high");
    }
    quality = qualityRaw;
  } else {
    quality = selection.kind === "pilot" ? "high" : "medium";
  }

  const candidatesRaw = flagValue(argv, "--candidates");
  const pickRaw = flagValue(argv, "--pick");

  return {
    mode: dryRun ? "dry-run" : approve ? "approve" : "generate",
    selection,
    quality,
    ...(candidatesRaw
      ? { candidates: parsePositiveInt(candidatesRaw, "--candidates", 1, 6) }
      : {}),
    ...(pickRaw ? { pick: parsePositiveInt(pickRaw, "--pick", 1, 6) } : {}),
  };
}

export function contrastFailureLines(
  targets: readonly Pick<
    CharacterLogo,
    "slug" | "ipColorPrimary" | "ipColorSecondary" | "family"
  >[],
): string[] {
  return targets.flatMap((logo) => {
    const audit = auditEntry(logo, familyBackgroundHex(logo.family));
    if (audit.passes) return [];
    return [
      `${logo.slug} sil=${audit.silhouette.toFixed(2)} face=${audit.face.toFixed(2)} margin=${audit.margin.toFixed(2)} hueDist=${audit.hueDist.toFixed(1)} track=${trackLabel(audit)}`,
    ];
  });
}

/** 色彩驗證未過不得生圖。 */
export function assertLogoContrastForTargets(
  targets: readonly Pick<
    CharacterLogo,
    "slug" | "ipColorPrimary" | "ipColorSecondary" | "family"
  >[],
): void {
  const failed = contrastFailureLines(targets);
  if (failed.length === 0) return;
  throw new Error(`色彩驗證未過，不得生圖：\n${failed.join("\n")}`);
}

export function assertGenerationAllowed(args: LogoCliArgs): void {
  if (args.mode === "dry-run") return;
  if (
    args.selection.kind === "tier" &&
    args.selection.tier === 2 &&
    !LOGO_PILOT_PARAMS_LOCKED
  ) {
    throw new Error("未回填 Pilot 系統參數前不得開 Tier 2 量產");
  }
  const slugs = resolveSlugs(args.selection);
  const targets = slugs.map((slug) => {
    const logo = getCharacterLogo(slug);
    if (!logo) throw new Error(`未知 slug：${slug}`);
    return logo;
  });
  assertLogoContrastForTargets(targets);
}

function resolveSlugs(selection: LogoSelection): string[] {
  if (selection.kind === "pilot") return [...PILOT_SLUGS];
  if (selection.kind === "tier") {
    if (selection.tier === 1) return remainingTier1Slugs();
    return getCharacterLogos()
      .filter((logo) => logo.tier === 2)
      .map((logo) => logo.slug);
  }
  return selection.slugs;
}

function loadPrompt(logo: CharacterLogo, sharedPromptPath?: string): string {
  const sharedPath =
    sharedPromptPath ?? join(process.cwd(), "docs/logo-prompts/_shared.md");
  const blocks = parseSharedPromptBlocks(readFileSync(sharedPath, "utf8"));
  return buildLogoPrompt(logo, blocks);
}

export function assertPromptIsNotClay(prompt: string): void {
  if (prompt.includes(CLAY_STYLE_PREFIX)) {
    throw new Error("Logo prompt 禁止使用 CLAY_STYLE_PREFIX");
  }
  if (
    /claymation|plasticine stop-motion|CLAY_STYLE_PREFIX/i.test(prompt) &&
    !/Forbid:/.test(prompt)
  ) {
    throw new Error("Logo prompt 疑似黏土定裝前綴");
  }
}

export function buildLogoJobs(
  args: LogoCliArgs,
  options: { sharedPromptPath?: string } = {},
): LogoJob[] {
  const slugs = resolveSlugs(args.selection);
  const candidates = args.candidates ?? defaultCandidateCount(args.selection);
  return slugs.map((slug) => {
    const logo = getCharacterLogo(slug);
    if (!logo) {
      throw new Error(`未知 slug：${slug}`);
    }
    const prompt = loadPrompt(logo, options.sharedPromptPath);
    assertPromptIsNotClay(prompt);
    return {
      slug: logo.slug,
      name: logo.name,
      candidates,
      prompt,
    };
  });
}

export function estimateLogoCostUsd(
  imageCalls: number,
  quality: LogoQuality,
): number {
  return imageCalls * COST_USD_PER_IMAGE[quality];
}

export function formatDryRunReport(input: {
  args: LogoCliArgs;
  jobs: LogoJob[];
  model: string;
}): string {
  const calls = input.jobs.reduce((sum, job) => sum + job.candidates, 0);
  const lines = [
    `【dry-run】不呼叫 API。模型 ${input.model}、尺寸 ${LOGO_NATIVE_SIZE}、quality ${input.args.quality}。`,
    `影像呼叫次數：${calls}（不含 timeout 重試）`,
    `估價：約 US$${estimateLogoCostUsd(calls, input.args.quality).toFixed(2)}（${input.args.quality} 單價 ${COST_USD_PER_IMAGE[input.args.quality]}）`,
    "",
  ];
  for (const job of input.jobs) {
    lines.push(`  ${job.slug}  ${job.name}  ×${job.candidates}`);
  }
  lines.push("");
  lines.push("通過後才准許生圖：拿掉 --dry-run。審圖後：");
  lines.push(
    "  npm run generate:character-logos -- --approve --slug <slug> --pick N",
  );
  lines.push("禁止黏土定裝前綴；不動 public/characters/*.jpg。");
  const sample = input.jobs[0]?.prompt.slice(0, 180);
  if (sample) {
    lines.push("", `prompt 範例：\n${sample}…`);
  }
  return lines.join("\n");
}

export function candidateFileName(index: number): string {
  return `${String(index).padStart(2, "0")}.png`;
}

export function selectApproveCandidate(
  candidates: readonly LogoCandidate[],
  pick?: number,
): LogoCandidate {
  if (pick !== undefined) {
    const found = candidates.find((item) => item.index === pick);
    if (!found) {
      throw new Error(
        `沒有候選 ${pick}。可用：${candidates.map((item) => item.index).join(", ")}`,
      );
    }
    return found;
  }
  if (candidates.length === 1) {
    return candidates[0]!;
  }
  throw new Error("多張候選必須加 --pick N");
}

export function assertLogoPublicPath(targetPath: string): void {
  const normalized = targetPath.replaceAll("\\", "/");
  if (/\/characters\/[^/]+\.jpe?g$/i.test(normalized)) {
    throw new Error("禁止寫入定裝照 public/characters/*.jpg");
  }
  if (!normalized.includes("/characters/logo/")) {
    throw new Error("logo 產物必須寫入 public/characters/logo/");
  }
}

export function updateCharacterLogoStatus(
  rosterPath: string,
  slug: string,
  status: CharacterLogoStatus,
): void {
  const roster = JSON.parse(readFileSync(rosterPath, "utf8")) as Array<
    Record<string, unknown>
  >;
  const entry = roster.find((item) => item.slug === slug);
  if (!entry) {
    throw new Error(`character-logos.json 沒有 ${slug}`);
  }
  entry.status = status;
  writeFileSync(rosterPath, `${JSON.stringify(roster, null, 2)}\n`);
}

export function buildContactHtml(input: {
  slug: string;
  name: string;
  candidateCount: number;
}): string {
  const cards = Array.from({ length: input.candidateCount }, (_, offset) => {
    const file = candidateFileName(offset + 1);
    return `<figure>
  <img src="./${file}" alt="${input.name} 候選 ${offset + 1}" width="256" height="256" />
  <img src="./${file}" alt="" width="32" height="32" class="px32" />
  <figcaption>${file} · --pick ${offset + 1}</figcaption>
</figure>`;
  });
  return `<!doctype html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8" />
  <title>${input.name} logo 候選</title>
  <style>
    body { font-family: sans-serif; margin: 1.5rem; }
    .row { display: flex; flex-wrap: wrap; gap: 1rem; }
    figure { margin: 0; }
    .px32 { width: 32px; height: 32px; image-rendering: auto; }
  </style>
</head>
<body>
  <h1>${input.name}（${input.slug}）</h1>
  <p>硬性驗收 32px。審完：<code>npm run generate:character-logos -- --approve --slug ${input.slug} --pick N</code></p>
  <div class="row">
${cards.join("\n")}
  </div>
</body>
</html>
`;
}

export function isRetryableImageError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as {
    status?: number;
    statusCode?: number;
    code?: string;
    message?: string;
    cause?: { code?: string };
  };
  const status = record.status ?? record.statusCode;
  if (typeof status === "number" && status >= 500) return true;
  const code = record.code ?? record.cause?.code;
  if (code === "ETIMEDOUT" || code === "ECONNRESET" || code === "ENOTFOUND") {
    return true;
  }
  return (
    typeof record.message === "string" &&
    /timeout|timed out|ECONNRESET|\b50[023]\b/i.test(record.message)
  );
}

export async function withOneRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (!isRetryableImageError(error)) throw error;
    return await fn();
  }
}

export async function writeStagingMaster(
  input: Buffer,
  destPath: string,
): Promise<void> {
  const { default: sharp } = await import("sharp");
  // 保留模型原生邊長，不為湊 1536 重採樣。
  await sharp(input).png().toFile(destPath);
}

export async function writeApprovedWebpPyramid(
  input: Buffer,
  destDir: string,
  slug: string,
): Promise<string[]> {
  const { default: sharp } = await import("sharp");
  const written: string[] = [];
  for (const px of LOGO_OUTPUT_PX) {
    const dest = join(destDir, `${slug}-${px}.webp`);
    assertLogoPublicPath(dest);
    await sharp(input)
      .resize(px, px, { fit: "cover" })
      .webp({ quality: 90 })
      .toFile(dest);
    written.push(dest);
  }
  return written;
}

export function writeLogoManifest(
  destPath: string,
  manifest: LogoStagingManifest,
): void {
  writeFileSync(destPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

export function readLogoManifest(srcPath: string): LogoStagingManifest {
  return JSON.parse(readFileSync(srcPath, "utf8")) as LogoStagingManifest;
}

export async function generateJobsToStaging(input: {
  paths: LogoPaths;
  jobs: readonly LogoJob[];
  args: LogoCliArgs;
  model: string;
  generatePng: (prompt: string) => Promise<Buffer>;
  now?: string;
}): Promise<string[]> {
  assertGenerationAllowed(input.args);
  const written: string[] = [];
  for (const job of input.jobs) {
    const dir = join(input.paths.stagingRoot, job.slug);
    mkdirSync(dir, { recursive: true });
    const candidates: LogoCandidate[] = [];
    for (let index = 1; index <= job.candidates; index += 1) {
      const file = candidateFileName(index);
      const dest = join(dir, file);
      const png = await withOneRetry(() => input.generatePng(job.prompt));
      await writeStagingMaster(png, dest);
      candidates.push({ index, file });
      written.push(dest);
    }
    writeLogoManifest(join(dir, "manifest.json"), {
      slug: job.slug,
      name: job.name,
      model: input.model,
      quality: input.args.quality,
      size: LOGO_NATIVE_SIZE,
      createdAt: input.now ?? new Date().toISOString(),
      candidates,
    });
    writeFileSync(
      join(dir, "contact.html"),
      buildContactHtml({
        slug: job.slug,
        name: job.name,
        candidateCount: job.candidates,
      }),
    );
  }
  return written;
}

export async function approveLogoFromStaging(input: {
  paths: LogoPaths;
  slug: string;
  pick?: number;
  status?: CharacterLogoStatus;
}): Promise<string[]> {
  const dir = join(input.paths.stagingRoot, input.slug);
  const manifestPath = join(dir, "manifest.json");
  if (!existsSync(manifestPath)) {
    throw new Error(`找不到 staging：${manifestPath}。請先生圖再 --approve。`);
  }
  const manifest = readLogoManifest(manifestPath);
  const candidate = selectApproveCandidate(manifest.candidates, input.pick);
  const masterPath = join(dir, candidate.file);
  if (!existsSync(masterPath)) {
    throw new Error(`找不到候選檔 ${masterPath}`);
  }
  mkdirSync(input.paths.publicLogoDir, { recursive: true });
  const written = await writeApprovedWebpPyramid(
    readFileSync(masterPath),
    input.paths.publicLogoDir,
    input.slug,
  );
  updateCharacterLogoStatus(
    input.paths.rosterPath,
    input.slug,
    input.status ?? "accepted",
  );
  return written;
}
