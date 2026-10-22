/**
 * 同步產物驗證。只查 sync 會寫進倉裡的東西，不跑全站 npm test／build。
 *
 * error 擋下 commit；warn 寫進 Job Summary，不讓待生圖或 MVP 缺字幕把新集卡住。
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { getStories, type Story } from "../../data/content";
import { storyCoverPath } from "../../lib/story-utils";
import { getStoryBlurDataUrl } from "../../lib/story-image-blur";
import {
  verifyBrowseIndex,
  type BrowseIndexIssue,
} from "./browse-index";
import {
  REFERENCE_ILLUSTRATED_SLUGS,
  verifyStoryWorkflow,
  type WorkflowIssue,
} from "./episode-workflow";

export type SyncValidateIssue = {
  level: "error" | "warn";
  code: string;
  message: string;
  slug?: string;
};

const storyJsonSchema = z
  .object({
    slug: z.string().min(1),
    ep: z.number().int().positive(),
    title: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    duration: z.string().min(1).optional(),
    vehicle: z.string().min(1),
    emoji: z.string().min(1),
    color: z.string().min(1),
    audio: z.string().min(1),
    pageCount: z.number().int().positive(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    captions: z.array(z.string()).optional(),
    captionTimes: z.array(z.number()).optional(),
  })
  .passthrough();

export const appleSyncedSchema = z.array(storyJsonSchema);

export const appleSyncStateSchema = z
  .object({
    seenGuids: z.array(z.string().min(1)),
    lastRun: z.string().nullable(),
    guidBySlug: z.record(z.string(), z.string().min(1)).optional(),
  })
  .passthrough();

const browseVehicleSchema = z
  .object({
    emoji: z.string().min(1),
    patterns: z.array(z.string()),
  })
  .passthrough();

const browseTopicSchema = z
  .object({
    symbol: z.string().min(1),
  })
  .passthrough();

export const browseIndexSchema = z
  .object({
    vehicles: z.record(z.string(), browseVehicleSchema),
    topics: z.record(z.string(), browseTopicSchema),
  })
  .passthrough();

export type SyncValidateReport = {
  errors: SyncValidateIssue[];
  warnings: SyncValidateIssue[];
};

function schemaIssues(label: string, error: z.ZodError): SyncValidateIssue[] {
  return error.issues.map((issue) => ({
    level: "error" as const,
    code: "schema",
    message: `${label}：${issue.path.join(".") || "(root)"} ${issue.message}`,
  }));
}

function duplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) dupes.add(value);
    seen.add(value);
  }
  return [...dupes];
}

export function validateParsedSync(input: {
  synced: unknown;
  state: unknown;
  browseIndex: unknown;
  stories: readonly Story[];
  coverExists?: (slug: string) => boolean;
  blurExists?: (slug: string) => boolean;
  workflowIssues?: readonly WorkflowIssue[];
  browseIssues?: readonly BrowseIndexIssue[];
  /** 倉庫驗證才核對 ep-9／ep-10 範本；純 fixture 不碰磁碟。 */
  includeReference?: boolean;
}): SyncValidateReport {
  const errors: SyncValidateIssue[] = [];
  const warnings: SyncValidateIssue[] = [];

  const synced = appleSyncedSchema.safeParse(input.synced);
  if (!synced.success) errors.push(...schemaIssues("apple-synced.json", synced.error));

  const state = appleSyncStateSchema.safeParse(input.state);
  if (!state.success) errors.push(...schemaIssues("apple-sync-state.json", state.error));

  const browse = browseIndexSchema.safeParse(input.browseIndex);
  if (!browse.success) {
    errors.push(...schemaIssues("browse-index.json", browse.error));
  }

  const slugDupes = duplicates(input.stories.map((story) => story.slug));
  for (const slug of slugDupes) {
    errors.push({
      level: "error",
      code: "duplicate-slug",
      slug,
      message: `slug 重複：${slug}`,
    });
  }

  const epKeys = input.stories.map((story) => String(story.ep));
  for (const ep of duplicates(epKeys)) {
    errors.push({
      level: "error",
      code: "duplicate-ep",
      message: `集數編號重複：${ep}`,
    });
  }

  if (state.success) {
    for (const guid of duplicates(state.data.seenGuids)) {
      errors.push({
        level: "error",
        code: "duplicate-guid",
        message: `seenGuids 重複：${guid}`,
      });
    }
    const guidValues = Object.values(state.data.guidBySlug ?? {});
    for (const guid of duplicates(guidValues)) {
      errors.push({
        level: "error",
        code: "duplicate-guid",
        message: `guidBySlug 指到同一個 guid：${guid}`,
      });
    }
    const known = new Set(input.stories.map((story) => story.slug));
    for (const slug of Object.keys(state.data.guidBySlug ?? {})) {
      if (!known.has(slug)) {
        warnings.push({
          level: "warn",
          code: "orphan-guid",
          slug,
          message: `guidBySlug 的 ${slug} 不在目錄裡`,
        });
      }
    }
  }

  const coverExists = input.coverExists ?? (() => true);
  const blurExists = input.blurExists ?? (() => true);
  for (const story of input.stories) {
    if (!coverExists(story.slug)) {
      errors.push({
        level: "error",
        code: "missing-cover",
        slug: story.slug,
        message: `${story.slug} 缺封面 ${storyCoverPath(story.slug)}`,
      });
    }
    if (!blurExists(story.slug)) {
      errors.push({
        level: "error",
        code: "missing-blur",
        slug: story.slug,
        message: `${story.slug} 缺封面 blur`,
      });
    }
  }

  const workflowIssues =
    input.workflowIssues ??
    input.stories.flatMap((story) => verifyStoryWorkflow(story));
  for (const issue of workflowIssues) {
    const target = issue.level === "error" ? errors : warnings;
    target.push({
      level: issue.level,
      code: issue.code,
      slug: issue.slug,
      message: issue.message,
    });
  }

  if (input.includeReference) {
    for (const slug of REFERENCE_ILLUSTRATED_SLUGS) {
      const story = input.stories.find((item) => item.slug === slug);
      if (!story) {
        errors.push({
          level: "error",
          code: "missing-story",
          slug,
          message: "範本集不在目錄中",
        });
        continue;
      }
      for (const issue of verifyStoryWorkflow(story)) {
        if (issue.level !== "error") continue;
        if (errors.some((item) => item.slug === slug && item.code === issue.code)) {
          continue;
        }
        errors.push({
          level: "error",
          code: issue.code,
          slug,
          message: `範本集 ${issue.message}`,
        });
      }
    }
  }

  const browseIssues = input.browseIssues ?? verifyBrowseIndex([...input.stories]);
  for (const issue of browseIssues) {
    const target = issue.level === "error" ? errors : warnings;
    target.push({
      level: issue.level,
      code: issue.code,
      slug: issue.slug,
      message: issue.message,
    });
  }

  return { errors, warnings };
}

export function formatSyncValidateReport(report: SyncValidateReport): string {
  const lines: string[] = [];
  if (report.errors.length === 0 && report.warnings.length === 0) {
    return "sync-validate：通過，沒有警告。";
  }
  for (const issue of report.errors) {
    const where = issue.slug ? `${issue.slug} ` : "";
    lines.push(`✗ ${where}${issue.code}: ${issue.message}`);
  }
  for (const issue of report.warnings) {
    const where = issue.slug ? `${issue.slug} ` : "";
    lines.push(`⚠ ${where}${issue.code}: ${issue.message}`);
  }
  lines.push("");
  lines.push(`錯誤 ${report.errors.length}、警告 ${report.warnings.length}`);
  return lines.join("\n");
}

export function jobSummaryMarkdown(report: SyncValidateReport): string {
  const warnLines =
    report.warnings.length === 0
      ? ["沒有警告。"]
      : report.warnings.map((issue) => {
          const where = issue.slug ? `\`${issue.slug}\` ` : "";
          return `- ${where}${issue.code}：${issue.message}`;
        });
  const errorLines =
    report.errors.length === 0
      ? []
      : [
          "",
          "### 錯誤",
          ...report.errors.map((issue) => {
            const where = issue.slug ? `\`${issue.slug}\` ` : "";
            return `- ${where}${issue.code}：${issue.message}`;
          }),
        ];
  return ["### sync-validate", "", ...warnLines, ...errorLines, ""].join("\n");
}

export function appendJobSummary(
  markdown: string,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const summaryPath = env.GITHUB_STEP_SUMMARY;
  if (!summaryPath) return;
  appendFileSync(summaryPath, `${markdown}\n`, "utf8");
}

function readJson(filePath: string): unknown {
  return JSON.parse(readFileSync(filePath, "utf8")) as unknown;
}

export function validateSyncRepo(root = process.cwd()): SyncValidateReport {
  const stories = getStories();
  const workflowIssues = stories.flatMap((story) => verifyStoryWorkflow(story));
  const browseIssues = verifyBrowseIndex(stories);
  return validateParsedSync({
    synced: readJson(path.join(root, "data/apple-synced.json")),
    state: readJson(path.join(root, "data/apple-sync-state.json")),
    browseIndex: readJson(path.join(root, "data/browse-index.json")),
    stories,
    coverExists: (slug) =>
      existsSync(path.join(root, "public", storyCoverPath(slug).replace(/^\//, ""))),
    blurExists: (slug) =>
      getStoryBlurDataUrl(storyCoverPath(slug))?.startsWith("data:image/") === true,
    workflowIssues,
    browseIssues,
    includeReference: true,
  });
}
