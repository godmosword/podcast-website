// ============================================================
// 全幕插圖集標準（範本：ep-9、ep-10）
// ============================================================
// MVP（pageCount=1）→ 校對字幕 → illustrate 全流程 → approve → verify → push
// ============================================================

import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import type { Story } from "../../data/content";
import { ROOT, STORIES_DIR, subtitleSidecarPath } from "./transcribe-core";
import { scenesSidecarPath } from "./illustrate-core";

/** 已完成的黃金範本集（文件／測試對照用）。 */
export const REFERENCE_ILLUSTRATED_SLUGS = ["ep-9", "ep-10"] as const;

export type WorkflowIssueLevel = "error" | "warn";

export type WorkflowIssue = {
  slug: string;
  level: WorkflowIssueLevel;
  code: string;
  message: string;
};

export function illustrationJpgCount(slug: string): number {
  const dir = join(STORIES_DIR, slug);
  if (!existsSync(dir)) return 0;
  return readdirSync(dir).filter((f) => /^\d+\.jpg$/.test(f)).length;
}

export function hasSubtitlesSidecar(slug: string): boolean {
  return existsSync(subtitleSidecarPath(slug));
}

export function hasScenesSidecar(slug: string): boolean {
  return existsSync(scenesSidecarPath(slug));
}

/** pageCount>1 的繪本版必備條件（對齊 ep-9／ep-10）。 */
export function verifyIllustratedEpisode(story: Story): WorkflowIssue[] {
  const { slug, pageCount } = story;
  const issues: WorkflowIssue[] = [];

  if (pageCount <= 1) {
    issues.push({
      slug,
      level: "warn",
      code: "mvp-only",
      message: "仍為 MVP 單圖（pageCount=1），需跑 illustrate 全流程",
    });
    return issues;
  }

  if (!hasSubtitlesSidecar(slug)) {
    issues.push({
      slug,
      level: "error",
      code: "missing-subtitles",
      message: "缺 data/subtitles/<slug>.json",
    });
  }

  if (!hasScenesSidecar(slug)) {
    issues.push({
      slug,
      level: "error",
      code: "missing-scenes",
      message: "缺 data/scenes/<slug>.json",
    });
  }

  const images = illustrationJpgCount(slug);
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

/** MVP 單圖集最低條件（GHA 同步後）。 */
export function verifyMvpEpisode(story: Story): WorkflowIssue[] {
  const { slug } = story;
  const issues: WorkflowIssue[] = [];

  if (story.pageCount !== 1) return issues;

  if (!hasSubtitlesSidecar(slug)) {
    issues.push({
      slug,
      level: "warn",
      code: "mvp-missing-subtitles",
      message: "MVP 集缺字幕側車檔",
    });
  }

  if (illustrationJpgCount(slug) < 1) {
    issues.push({
      slug,
      level: "error",
      code: "mvp-missing-cover",
      message: "缺 public/stories/<slug>/01.jpg",
    });
  }

  return issues;
}

export function verifyStoryWorkflow(story: Story): WorkflowIssue[] {
  if (story.pageCount <= 1) {
    return verifyMvpEpisode(story);
  }
  if (!hasScenesSidecar(story.slug)) {
    return [
      {
        slug: story.slug,
        level: "warn",
        code: "legacy-placeholder",
        message: `舊式 ${story.pageCount} 頁 placeholder，需依 ep-9／ep-10 workflow 重做 illustrate`,
      },
    ];
  }
  return verifyIllustratedEpisode(story);
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

export const ILLUSTRATE_WORKFLOW_STEPS = [
  "校對 data/subtitles/<slug>.json（Bonbon／馬米等人名）",
  "npm run illustrate -- <slug> --segment-only  # 審 data/scenes/<slug>.json",
  "npm run illustrate -- <slug>                 # 生圖 → staging + contact.html",
  "審 public/.illustrate-staging/<slug>/contact.html",
  "npm run illustrate -- <slug> --approve       # public + pageCount/captionTimes/captions",
  "npm run verify:episodes                      # 對照 ep-9／ep-10 標準",
  "npm run sync:apple && npm run build",
  "commit：public/stories/、scenes/、subtitles/、synced/defaults、characters",
] as const;
