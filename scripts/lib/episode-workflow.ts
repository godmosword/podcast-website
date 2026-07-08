// ============================================================
// 全幕插圖集標準（範本：ep-9、ep-10）
// ============================================================
// MVP（pageCount=1）→ 校對字幕 → illustrate 全流程 → approve → verify → push
// ============================================================

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Story } from "../../data/content";
import { STORIES_DIR, subtitleSidecarPath } from "./transcribe-core";
import { scenesSidecarPath } from "./illustrate-core";
import {
  isSubtitleProofreadMarked,
  verifySubtitleProofread,
} from "./subtitle-proofread";

/** 已完成的黃金範本集（文件／測試對照用）。 */
export const REFERENCE_ILLUSTRATED_SLUGS = ["ep-9", "ep-10"] as const;

/** 已知的舊式多頁 placeholder 集（僅這些允許 legacy warn，其他多頁集缺 scenes 一律 error）。 */
export const LEGACY_PLACEHOLDER_SLUGS = [
  "ep-2",
  "ep-3",
  "ep-4",
  "ep-5",
  "ep-6",
] as const;

type WorkflowIssueLevel = "error" | "warn";

export type WorkflowIssue = {
  slug: string;
  level: WorkflowIssueLevel;
  code: string;
  message: string;
};

/** 檔案系統探針——測試時可注入 mock，不必依賴真實集數狀態。 */
export type WorkflowProbes = {
  hasSubtitles: (slug: string) => boolean;
  hasScenes: (slug: string) => boolean;
  imageCount: (slug: string) => number;
  sceneCount: (slug: string) => number;
  hasProofreadMarker: (slug: string) => boolean;
};

function illustrationJpgCount(slug: string): number {
  const dir = join(STORIES_DIR, slug);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => /^\d+\.jpg$/.test(f)).length;
}

function hasSubtitlesSidecar(slug: string): boolean {
  return existsSync(subtitleSidecarPath(slug));
}

function hasScenesSidecar(slug: string): boolean {
  return existsSync(scenesSidecarPath(slug));
}

/** scenes 側車的幕數；檔案缺失或格式不符回傳 0。 */
function scenesSidecarCount(slug: string): number {
  const p = scenesSidecarPath(slug);
  if (!existsSync(p)) return 0;
  try {
    const parsed: unknown = JSON.parse(readFileSync(p, "utf8"));
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      Array.isArray((parsed as { scenes?: unknown }).scenes)
    ) {
      return (parsed as { scenes: unknown[] }).scenes.length;
    }
    return 0;
  } catch {
    return 0;
  }
}

const defaultWorkflowProbes: WorkflowProbes = {
  hasSubtitles: hasSubtitlesSidecar,
  hasScenes: hasScenesSidecar,
  imageCount: illustrationJpgCount,
  sceneCount: scenesSidecarCount,
  hasProofreadMarker: isSubtitleProofreadMarked,
};

export type WorkflowJsonIssue = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type WorkflowEpisodeChecks = {
  subtitle_exists: boolean;
  subtitle_marked: boolean;
  scenes_exists: boolean;
  scenes_count: number;
  illustrations_count: number;
  pagecount_alignment: {
    expected: number;
    actual: number;
    matched: boolean;
  };
  scenes_alignment: {
    expected: number;
    actual: number;
    matched: boolean;
  };
  captions_alignment: boolean;
  caption_times_alignment: boolean;
  matches_reference_standard: boolean;
};

export type WorkflowEpisodeJsonReport = {
  slug: string;
  timestamp: string;
  passed: boolean;
  strict_passed: boolean;
  summary: string;
  errors: WorkflowJsonIssue[];
  warnings: WorkflowJsonIssue[];
  checks: WorkflowEpisodeChecks;
  recommendations: string[];
};

export type WorkflowJsonReport = {
  slug: "all";
  timestamp: string;
  strict: boolean;
  passed: boolean;
  strict_passed: boolean;
  summary: string;
  errors: WorkflowJsonIssue[];
  warnings: WorkflowJsonIssue[];
  checks: {
    total_episodes: number;
    total_errors: number;
    total_warnings: number;
    reference_standard: {
      slugs: string[];
      passed: boolean;
      errors: WorkflowJsonIssue[];
    };
  };
  recommendations: string[];
  episodes: WorkflowEpisodeJsonReport[];
};

type BuildWorkflowJsonReportOptions = {
  strict?: boolean;
  timestamp?: string;
  probes?: WorkflowProbes;
  referenceIssues?: WorkflowIssue[];
};

/** pageCount>1 的繪本版必備條件（對齊 ep-9／ep-10）。 */
export function verifyIllustratedEpisode(
  story: Story,
  probes: WorkflowProbes = defaultWorkflowProbes,
): WorkflowIssue[] {
  const { slug, pageCount } = story;
  const issues: WorkflowIssue[] = [];

  if (!probes.hasSubtitles(slug)) {
    issues.push({
      slug,
      level: "error",
      code: "missing-subtitles",
      message: "缺 data/subtitles/<slug>.json",
    });
  }

  if (!probes.hasScenes(slug)) {
    issues.push({
      slug,
      level: "error",
      code: "missing-scenes",
      message: "缺 data/scenes/<slug>.json",
    });
  } else {
    const scenes = probes.sceneCount(slug);
    if (scenes !== pageCount) {
      issues.push({
        slug,
        level: "error",
        code: "scene-count",
        message: `scenes 幕數 ${scenes} ≠ pageCount ${pageCount}`,
      });
    }
  }

  const images = probes.imageCount(slug);
  if (images !== pageCount) {
    issues.push({
      slug,
      level: "error",
      code: "image-count",
      message: `public 插圖 ${images} 張 ≠ pageCount ${pageCount}`,
    });
  }

  const times = story.captionTimes;
  if (!times || times.length !== pageCount) {
    issues.push({
      slug,
      level: "error",
      code: "caption-times",
      message: `captionTimes 長度 ${times?.length ?? 0} ≠ pageCount ${pageCount}`,
    });
  }

  const caps = story.captions;
  if (!caps || caps.length !== pageCount) {
    issues.push({
      slug,
      level: "error",
      code: "captions",
      message: `captions 長度 ${caps?.length ?? 0} ≠ pageCount ${pageCount}（每幕一句幕級字幕）`,
    });
  }

  return issues;
}

/** MVP 單圖集（GHA 同步後）：最低條件 + 永遠標出「待生圖」狀態，不靜默。 */
function verifyMvpEpisode(
  story: Story,
  probes: WorkflowProbes = defaultWorkflowProbes,
): WorkflowIssue[] {
  const { slug } = story;
  const issues: WorkflowIssue[] = [];

  if (story.pageCount !== 1) return issues;

  if (!probes.hasSubtitles(slug)) {
    issues.push({
      slug,
      level: "warn",
      code: "mvp-missing-subtitles",
      message: "MVP 集缺字幕側車檔",
    });
  }

  if (probes.imageCount(slug) < 1) {
    issues.push({
      slug,
      level: "error",
      code: "mvp-missing-cover",
      message: "缺 public/stories/<slug>/01.jpg",
    });
  }

  if (probes.hasScenes(slug)) {
    issues.push({
      slug,
      level: "warn",
      code: "illustrate-incomplete",
      message: `已切 ${probes.sceneCount(slug)} 幕場景但 pageCount=1：illustrate 未生圖或未 --approve（檢查 public/.illustrate-staging/<slug>/ 與 public/stories/<slug>/）`,
    });
  } else {
    issues.push({
      slug,
      level: "warn",
      code: "illustrate-pending",
      message: "MVP 單圖，待跑 illustrate 全流程（對齊 ep-9／ep-10）",
    });
  }

  const proofreadWarn = verifySubtitleProofread(slug, probes.hasScenes(slug));
  if (proofreadWarn) {
    issues.push({ slug, ...proofreadWarn });
  }

  return issues;
}

/** 單一狀態路由：MVP → legacy allowlist → 全幕標準檢查。 */
export function verifyStoryWorkflow(
  story: Story,
  probes: WorkflowProbes = defaultWorkflowProbes,
): WorkflowIssue[] {
  if (story.pageCount <= 1) {
    return verifyMvpEpisode(story, probes);
  }
  if (
    !probes.hasScenes(story.slug) &&
    (LEGACY_PLACEHOLDER_SLUGS as readonly string[]).includes(story.slug)
  ) {
    return [
      {
        slug: story.slug,
        level: "warn",
        code: "legacy-placeholder",
        message: `舊式 ${story.pageCount} 頁 placeholder，需依 ep-9／ep-10 workflow 重做 illustrate`,
      },
    ];
  }
  return verifyIllustratedEpisode(story, probes);
}

export function formatWorkflowReport(issues: WorkflowIssue[]): string {
  if (issues.length === 0) return "✓ 全部通過";
  const errors = issues.filter((i) => i.level === "error");
  const warns = issues.filter((i) => i.level === "warn");
  const lines: string[] = [];
  for (const i of errors) {
    lines.push(`✗ [${i.slug}] ${i.code}: ${i.message}`);
  }
  for (const i of warns) {
    lines.push(`⚠ [${i.slug}] ${i.code}: ${i.message}`);
  }
  lines.push("");
  lines.push(`錯誤 ${errors.length}、警告 ${warns.length}`);
  return lines.join("\n");
}

function normalizeIssueCode(code: string): string {
  return code
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function summarizeIssues(errors: number, warnings: number): string {
  return `有 ${errors} 個 error，${warnings} 個 warning`;
}

function uniqueIssues(issues: WorkflowIssue[]): WorkflowIssue[] {
  const seen = new Set<string>();
  const unique: WorkflowIssue[] = [];
  for (const issue of issues) {
    const key = `${issue.slug}\u0000${issue.level}\u0000${issue.code}\u0000${issue.message}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(issue);
  }
  return unique;
}

function issueDetails(
  issue: WorkflowIssue,
  storiesBySlug: Map<string, Story>,
  probes: WorkflowProbes,
): Record<string, unknown> {
  const story = storiesBySlug.get(issue.slug);
  const details: Record<string, unknown> = {
    slug: issue.slug,
    level: issue.level,
    source_code: issue.code,
  };

  if (!story) return details;

  details.pageCount = story.pageCount;

  switch (issue.code) {
    case "missing-subtitles":
    case "mvp-missing-subtitles":
      details.path = `data/subtitles/${issue.slug}.json`;
      break;
    case "missing-scenes":
      details.path = `data/scenes/${issue.slug}.json`;
      break;
    case "scene-count":
      details.expected = story.pageCount;
      details.actual = probes.sceneCount(issue.slug);
      details.path = `data/scenes/${issue.slug}.json`;
      break;
    case "image-count":
      details.expected = story.pageCount;
      details.actual = probes.imageCount(issue.slug);
      details.path = `public/stories/${issue.slug}/`;
      break;
    case "caption-times":
      details.expected = story.pageCount;
      details.actual = story.captionTimes?.length ?? 0;
      details.field = "captionTimes";
      break;
    case "captions":
      details.expected = story.pageCount;
      details.actual = story.captions?.length ?? 0;
      details.field = "captions";
      break;
    case "mvp-missing-cover":
      details.path = `public/stories/${issue.slug}/01.jpg`;
      break;
    case "illustrate-incomplete":
      details.expected = story.pageCount;
      details.actual = probes.sceneCount(issue.slug);
      details.path = `data/scenes/${issue.slug}.json`;
      break;
    case "legacy-placeholder":
      details.reference_slugs = [...REFERENCE_ILLUSTRATED_SLUGS];
      break;
  }

  return details;
}

function toJsonIssue(
  issue: WorkflowIssue,
  storiesBySlug: Map<string, Story>,
  probes: WorkflowProbes,
): WorkflowJsonIssue {
  return {
    code: normalizeIssueCode(issue.code),
    message: issue.message,
    details: issueDetails(issue, storiesBySlug, probes),
  };
}

function recommendationsForIssue(issue: WorkflowIssue): string[] {
  switch (issue.code) {
    case "missing-subtitles":
    case "mvp-missing-subtitles":
      return [`執行 npm run transcribe -- ${issue.slug}`];
    case "subtitle-unproofread":
      return [`執行 npm run proofread:subtitles -- ${issue.slug} --mark`];
    case "missing-scenes":
    case "scene-count":
    case "illustrate-pending":
    case "illustrate-incomplete":
    case "legacy-placeholder":
      return [`執行 npm run illustrate -- ${issue.slug} --segment-only`];
    case "image-count":
    case "mvp-missing-cover":
      return [`補齊 public/stories/${issue.slug}/ 的 illustration`];
    case "caption-times":
    case "captions":
      return [
        `重新 npm run illustrate -- ${issue.slug} --approve 以回寫 captions/captionTimes`,
      ];
    case "missing-story":
      return ["檢查 REFERENCE_ILLUSTRATED_SLUGS 與 data/content.ts"];
    default:
      return [];
  }
}

function buildRecommendations(issues: WorkflowIssue[]): string[] {
  return Array.from(new Set(issues.flatMap(recommendationsForIssue)));
}

function buildEpisodeChecks(
  story: Story,
  probes: WorkflowProbes,
  hasErrors: boolean,
): WorkflowEpisodeChecks {
  const subtitles = probes.hasSubtitles(story.slug);
  const scenes = probes.hasScenes(story.slug);
  const sceneCount = scenes ? probes.sceneCount(story.slug) : 0;
  const images = probes.imageCount(story.slug);
  const captionsLength = story.captions?.length ?? 0;
  const captionTimesLength = story.captionTimes?.length ?? 0;

  return {
    subtitle_exists: subtitles,
    subtitle_marked: probes.hasProofreadMarker(story.slug),
    scenes_exists: scenes,
    scenes_count: sceneCount,
    illustrations_count: images,
    pagecount_alignment: {
      expected: story.pageCount,
      actual: images,
      matched: images === story.pageCount,
    },
    scenes_alignment: {
      expected: story.pageCount,
      actual: sceneCount,
      matched: scenes && sceneCount === story.pageCount,
    },
    captions_alignment: captionsLength === story.pageCount,
    caption_times_alignment: captionTimesLength === story.pageCount,
    matches_reference_standard: story.pageCount > 1 && !hasErrors,
  };
}

function buildEpisodeJsonReport(
  story: Story,
  issues: WorkflowIssue[],
  timestamp: string,
  probes: WorkflowProbes,
): WorkflowEpisodeJsonReport {
  const storiesBySlug = new Map([[story.slug, story]]);
  const errors = issues.filter((i) => i.level === "error");
  const warnings = issues.filter((i) => i.level === "warn");

  return {
    slug: story.slug,
    timestamp,
    passed: errors.length === 0,
    strict_passed: errors.length === 0 && warnings.length === 0,
    summary: summarizeIssues(errors.length, warnings.length),
    errors: errors.map((i) => toJsonIssue(i, storiesBySlug, probes)),
    warnings: warnings.map((i) => toJsonIssue(i, storiesBySlug, probes)),
    checks: buildEpisodeChecks(story, probes, errors.length > 0),
    recommendations: buildRecommendations(issues),
  };
}

export function buildWorkflowJsonReport(
  stories: Story[],
  issues: WorkflowIssue[],
  options: BuildWorkflowJsonReportOptions = {},
): WorkflowJsonReport {
  const timestamp = options.timestamp ?? new Date().toISOString();
  const strict = options.strict ?? false;
  const probes = options.probes ?? defaultWorkflowProbes;
  const storiesBySlug = new Map(stories.map((story) => [story.slug, story]));
  const referenceIssues = options.referenceIssues ?? [];
  const aggregateIssues = uniqueIssues([...issues, ...referenceIssues]);
  const errors = aggregateIssues.filter((i) => i.level === "error");
  const warnings = aggregateIssues.filter((i) => i.level === "warn");
  const referenceErrors = uniqueIssues(referenceIssues).filter(
    (i) => i.level === "error",
  );
  const episodes = stories.map((story) =>
    buildEpisodeJsonReport(
      story,
      issues.filter((i) => i.slug === story.slug),
      timestamp,
      probes,
    ),
  );

  return {
    slug: "all",
    timestamp,
    strict,
    passed: errors.length === 0,
    strict_passed: errors.length === 0 && warnings.length === 0,
    summary: summarizeIssues(errors.length, warnings.length),
    errors: errors.map((i) => toJsonIssue(i, storiesBySlug, probes)),
    warnings: warnings.map((i) => toJsonIssue(i, storiesBySlug, probes)),
    checks: {
      total_episodes: stories.length,
      total_errors: errors.length,
      total_warnings: warnings.length,
      reference_standard: {
        slugs: [...REFERENCE_ILLUSTRATED_SLUGS],
        passed: referenceErrors.length === 0,
        errors: referenceErrors.map((i) => toJsonIssue(i, storiesBySlug, probes)),
      },
    },
    recommendations: buildRecommendations(aggregateIssues),
    episodes,
  };
}
