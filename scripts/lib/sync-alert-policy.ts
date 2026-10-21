/**
 * 同步告警的分類、連續失敗次數，以及 log 裡的 ##[error] 摘錄。
 * 同一個根因只留一張 Issue；連續失敗兩次才通知，避免 15 分鐘 cron 洗版。
 */

export const ALERT_AFTER_CONSECUTIVE = 2;

export const FAILURE_CATEGORIES = [
  "install",
  "rss",
  "validate",
  "commit",
  "whisper",
  "workflow",
  "stale-rss",
  "unknown",
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

export type StreakFile = {
  lastCategory: FailureCategory | null;
  consecutive: number;
};

export type FailureClassification = {
  category: FailureCategory;
  step: string;
};

const CATEGORY_LABEL_COLOR: Record<FailureCategory, string> = {
  install: "c5def5",
  rss: "fbca04",
  validate: "d93f0b",
  commit: "b60205",
  whisper: "5319e7",
  workflow: "1d1d1d",
  "stale-rss": "fbca04",
  unknown: "ededed",
};

export function emptyStreak(): StreakFile {
  return { lastCategory: null, consecutive: 0 };
}

export function parseStreak(raw: string): StreakFile {
  try {
    const parsed = JSON.parse(raw) as Partial<StreakFile>;
    const category = parsed.lastCategory;
    const known =
      category == null ||
      (FAILURE_CATEGORIES as readonly string[]).includes(category);
    const consecutive =
      typeof parsed.consecutive === "number" && parsed.consecutive > 0
        ? parsed.consecutive
        : 0;
    if (!known || category == null || consecutive === 0) return emptyStreak();
    return { lastCategory: category, consecutive };
  } catch {
    return emptyStreak();
  }
}

export function serializeStreak(streak: StreakFile): string {
  return `${JSON.stringify(streak)}\n`;
}

/** 同一分類連續失敗才累加；換成別的根因就從 1 重算。 */
export function recordFailure(
  previous: StreakFile,
  category: FailureCategory,
): { next: StreakFile; count: number } {
  const count =
    previous.lastCategory === category ? previous.consecutive + 1 : 1;
  return { next: { lastCategory: category, consecutive: count }, count };
}

export function shouldOpenAlert(count: number): boolean {
  return count >= ALERT_AFTER_CONSECUTIVE;
}

export function categoryLabel(category: FailureCategory): string {
  return `sync-cat-${category}`;
}

export function categoryLabelColor(category: FailureCategory): string {
  return CATEGORY_LABEL_COLOR[category];
}

/** GitHub label 最長 50 字，只留安全字元。 */
export function stepLabel(step: string): string {
  const slug = step
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 39);
  return `sync-step-${slug || "unknown"}`;
}

export function classifySyncFailure(input: {
  steps?: readonly string[];
  context?: string;
  logExcerpt?: string;
}): FailureClassification {
  const steps = (input.steps ?? []).map((step) => step.trim()).filter(Boolean);
  const text = [steps.join("\n"), input.context ?? "", input.logExcerpt ?? ""].join(
    "\n",
  );
  const step = steps[0] ?? "unknown";
  const has = (pattern: RegExp) => pattern.test(text);

  if (has(/workflow file|block scalar|actionlint|無法解析的 YAML/i)) {
    return { category: "workflow", step };
  }
  if (has(/npm ci|npm install|package-lock|EINTEGRITY|ERESOLVE/i)) {
    return { category: "install", step };
  }
  if (has(/whisper|transcribe|轉錄/i)) {
    return { category: "whisper", step };
  }
  if (has(/RSS fetch|iTunes lookup|Download failed|Cover download failed/i)) {
    return { category: "rss", step };
  }
  if (has(/GH013|protect-main-web|等待 sync PR merge|force-with-lease/i)) {
    return { category: "commit", step };
  }
  if (
    has(
      /sync-validate|verify:episodes|verify:browse-index|vitest|onTaskUpdate|npm test|quality|build-and-public-e2e/i,
    )
  ) {
    return { category: "validate", step };
  }
  if (has(/未上站|sync-stale-rss|\bSTALE\b/)) {
    return { category: "stale-rss", step };
  }
  if (has(/Vercel|git push|Commit and push|non-fast-forward/i)) {
    return { category: "commit", step };
  }
  return { category: "unknown", step };
}

/** 從 Actions log 抽出 ##[error]／::error::，過長就截斷。 */
export function extractErrorExcerpt(log: string, maxChars = 2_000): string {
  const lines = log.split(/\r?\n/);
  const picked: string[] = [];
  for (const line of lines) {
    const errorMark = line.indexOf("##[error]");
    const legacyMark = line.indexOf("::error::");
    if (errorMark >= 0) {
      picked.push(line.slice(errorMark).trim());
    } else if (legacyMark >= 0) {
      picked.push(`##[error]${line.slice(legacyMark + "::error::".length).trim()}`);
    }
  }
  let excerpt = "";
  for (const line of picked) {
    const next = excerpt ? `${excerpt}\n${line}` : line;
    if (next.length > maxChars) break;
    excerpt = next;
  }
  return excerpt;
}
