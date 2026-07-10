import type { Story } from "@/data/content";

/** REUSE-2 規劃中的家長共讀指引形狀（尚未寫入 Story）。 */
export type ParentGuide = {
  /** 「這集可以聊什麼」2–3 句 */
  summary: string;
  /** 1–2 個延伸到現實的提問或小活動 */
  prompts: string[];
};

/** `familyActivity` 允許出現的通路（契約文件同步）。 */
export const FAMILY_ACTIVITY_CHANNELS = [
  "story-page-card",
  "rss-show-note",
  "faq-json-ld-one-item",
  "llms-full",
] as const;

/** `reflectionPrompt` 允許出現的通路。 */
export const REFLECTION_PROMPT_CHANNELS = [
  "story-player",
  "story-end-screen",
  "story-page-reflection-prompt",
  "story-parent-extension-merge",
] as const;

/** `parentGuide` 規劃中的通路（REUSE-2）。 */
export const PARENT_GUIDE_CHANNELS = [
  "story-page-show-notes-details",
  "optional-rss-excerpt",
  "optional-llms-excerpt",
] as const;

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

/** 檢查兩段文案是否逐字相同（契約：禁止重複維護）。 */
export function hasDuplicateGuideText(left: string, right: string): boolean {
  const a = normalizeText(left);
  const b = normalizeText(right);
  return a.length > 0 && a === b;
}

/** 單集 familyActivity 與 reflectionPrompt 不得逐字重複。 */
export function assertFamilyActivityReflectionDistinct(story: Story): void {
  const activity = story.familyActivity;
  const reflection = story.reflectionPrompt;
  if (!activity || !reflection) return;

  const pairs: Array<[string, string]> = [
    [activity.question, reflection.child],
    [activity.question, reflection.parentFollowUp],
  ];

  if (activity.activity) {
    pairs.push(
      [activity.activity, reflection.child],
      [activity.activity, reflection.parentFollowUp],
    );
  }

  for (const [left, right] of pairs) {
    if (hasDuplicateGuideText(left, right)) {
      throw new Error(
        `${story.slug}: familyActivity 與 reflectionPrompt 文案逐字重複`,
      );
    }
  }
}

/** REUSE-2：parentGuide 與 familyActivity 不得逐字重複。 */
export function assertParentGuideDistinctFromFamilyActivity(
  story: Story,
  parentGuide: ParentGuide,
): void {
  const activity = story.familyActivity;
  if (!activity) return;

  const activityTexts = [activity.question, activity.activity].filter(
    (text): text is string => Boolean(text?.trim()),
  );
  const guideTexts = [parentGuide.summary, ...parentGuide.prompts];

  for (const activityText of activityTexts) {
    for (const guideText of guideTexts) {
      if (hasDuplicateGuideText(activityText, guideText)) {
        throw new Error(
          `${story.slug}: parentGuide 與 familyActivity 文案逐字重複`,
        );
      }
    }
  }
}
