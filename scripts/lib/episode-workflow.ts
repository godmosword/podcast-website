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
import { verifySubtitleProofread } from "./subtitle-proofread";

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
