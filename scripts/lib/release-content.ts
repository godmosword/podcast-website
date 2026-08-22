import type { Story } from "../../data/content";
import type { WorkflowIssue } from "./episode-workflow";

export type ReleaseIssueKind = "release-blocker" | "accepted-warning";

export type ReleaseIssue = WorkflowIssue & {
  kind: ReleaseIssueKind;
};

export type ReleaseContentReport = {
  blockers: ReleaseIssue[];
  acceptedWarnings: ReleaseIssue[];
};

/**
 * Apple sync 後的 MVP 單圖是已知、可追蹤的上架策略，不應被誤當成工程錯誤。
 * 其他 warning 仍需在正式內容發布前明確處理；尤其未校對字幕不能進 production。
 */
export function classifyReleaseIssues(
  stories: Story[],
  issues: WorkflowIssue[],
): ReleaseContentReport {
  const storiesBySlug = new Map(stories.map((story) => [story.slug, story]));
  const blockers: ReleaseIssue[] = [];
  const acceptedWarnings: ReleaseIssue[] = [];

  for (const issue of issues) {
    const story = storiesBySlug.get(issue.slug);
    const isAcceptedMvpIllustrationWarning =
      issue.level === "warn" &&
      issue.code === "illustrate-pending" &&
      story?.pageCount === 1;

    const classified: ReleaseIssue = {
      ...issue,
      kind: isAcceptedMvpIllustrationWarning
        ? "accepted-warning"
        : "release-blocker",
    };

    if (classified.kind === "accepted-warning") acceptedWarnings.push(classified);
    else blockers.push(classified);
  }

  return { blockers, acceptedWarnings };
}
