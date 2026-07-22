/**
 * Apple sync 新集時自動補齊 catalog 完備測試所需的 sidecar：
 * story-zones / reflection-prompts / story-dates / episode-faqs。
 * 只在缺 key 時寫入，不覆寫人工條目；反思文案為 MVP stub，Phase 2 再 refinement。
 * FAQ 也是 MVP stub：先讓新集可被完整收錄與索引，再由人工把摘要改寫成劇情專屬問答。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { ZoneId } from "../../data/universe-zones";
import type { EpisodeFaq } from "../../data/episode-faqs";

const DEFAULT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

export type NewEpisodeSidecarInput = {
  slug: string;
  title: string;
  summary?: string;
};

export type UpsertCatalogSidecarsOptions = {
  root?: string;
  nowIso?: string;
  gitShortSha?: string;
  dryRun?: boolean;
};

export type UpsertCatalogSidecarsResult = {
  updatedSlugs: string[];
  episodeFaqStubSlugs: string[];
};

/** 對映原則對齊 data/story-zones.ts 註解。 */
const ZONE_RULES: [RegExp, ZoneId][] = [
  [/恐龍|阿酷|怪獸卡車/, "dino"],
  [/消防|警車|救護|出任務/, "rescue"],
  [/水上|漂漂河|海洋|未來/, "ocean"],
  [/森林|挖土/, "forest"],
];

export function inferZoneId(title: string, summary = ""): ZoneId {
  const blob = `${title}\n${summary}`;
  for (const [pattern, zoneId] of ZONE_RULES) {
    if (pattern.test(blob)) return zoneId;
  }
  return "car-park";
}

/** 從標題推導可過完備測試的 MVP stub（Phase 2 人工改寫）。 */
export function buildReflectionStub(title: string): {
  child: string;
  parentFollowUp: string;
} {
  const stem = titleStem(title);
  const child = `${stem}。聽完這個故事，你心裡最先想到什麼？`;
  const parentFollowUp =
    "先接住孩子的感覺，再一起聊聊故事裡學到的一件小事，不必急著給標準答案。";
  return { child, parentFollowUp };
}

function clipText(text: string, maxChars: number): string {
  return Array.from(text.replace(/\s+/g, " ").trim())
    .slice(0, maxChars)
    .join("")
    .trim();
}

function episodeLabel(slug: string): string {
  const match = /^ep-(\d+)$/.exec(slug);
  return match ? `第${match[1]}集` : slug;
}

/** 從 RSS title/summary 產生可上架、可驗證、待人工改寫的 FAQ MVP。 */
export function buildEpisodeFaqStub(
  slug: string,
  title: string,
  summary = "",
): EpisodeFaq {
  const stem = clipText(titleStem(title), 30) || "這個故事";
  const summaryPart = clipText(summary, 45);
  const answer = [
    `本集用「${stem}」帶孩子認識故事裡的任務與心情。`,
    summaryPart
      ? `故事摘要是：${summaryPart}。`
      : "故事會陪孩子一起觀察線索、想辦法並照顧身邊的夥伴。",
    "聽完可以和孩子聊聊：哪個選擇最有幫助？如果是你，會怎麼做？",
  ].join("");

  return {
    question: `${episodeLabel(slug)}「${stem}」這一集，故事裡最重要的發現是什麼？`,
    answer,
  };
}

function titleStem(title: string): string {
  const pipe = title.search(/[｜|]/);
  const head = (pipe >= 0 ? title.slice(0, pipe) : title).trim();
  return head || title.trim() || "這個故事";
}

export function resolveGitShortSha(root: string): string {
  try {
    return execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: root,
      encoding: "utf8",
    }).trim();
  } catch {
    return "0000000";
  }
}

function findRecordRange(
  source: string,
  recordDecl: RegExp,
): { braceStart: number; closeAt: number } {
  const declMatch = recordDecl.exec(source);
  if (!declMatch || declMatch.index === undefined) {
    throw new Error(`找不到 Record 宣告：${recordDecl}`);
  }

  const braceStart = source.indexOf(
    "{",
    declMatch.index + declMatch[0].length - 1,
  );
  if (braceStart < 0) {
    throw new Error(`找不到 Record 開括號：${recordDecl}`);
  }

  let depth = 0;
  let closeAt = -1;
  for (let i = braceStart; i < source.length; i++) {
    const ch = source[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        closeAt = i;
        break;
      }
    }
  }
  if (closeAt < 0) {
    throw new Error(`找不到 Record 閉括號：${recordDecl}`);
  }
  return { braceStart, closeAt };
}

function hasQuotedKeyInRecord(
  source: string,
  recordDecl: RegExp,
  key: string,
): boolean {
  const { braceStart, closeAt } = findRecordRange(source, recordDecl);
  const body = source.slice(braceStart, closeAt + 1);
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`"${escaped}"\\s*:`).test(body);
}

/**
 * 在指定 const/export const Record 的結尾 `};` 前插入一行／一塊。
 * 若 key 已存在於該 Record 則不改動（同一檔多個 Record 互不干擾）。
 */
function insertBeforeRecordClose(
  source: string,
  recordDecl: RegExp,
  key: string,
  entryText: string,
): { source: string; inserted: boolean } {
  if (hasQuotedKeyInRecord(source, recordDecl, key)) {
    return { source, inserted: false };
  }

  const { closeAt } = findRecordRange(source, recordDecl);
  const before = source.slice(0, closeAt);
  const needsNewline = !before.endsWith("\n");
  const insertion = `${needsNewline ? "\n" : ""}${entryText}`;
  return {
    source: before + insertion + source.slice(closeAt),
    inserted: true,
  };
}

function formatZoneEntry(slug: string, zoneId: ZoneId, title: string): string {
  const comment = titleStem(title).replace(/\s+/g, " ").slice(0, 40);
  return `  "${slug}": "${zoneId}", // ${comment}\n`;
}

function formatReflectionEntry(
  slug: string,
  prompt: { child: string; parentFollowUp: string },
): string {
  const child = JSON.stringify(prompt.child);
  const follow = JSON.stringify(prompt.parentFollowUp);
  return `  "${slug}": {\n    child: ${child},\n    parentFollowUp:\n      ${follow},\n  },\n`;
}

function formatDateEntry(slug: string, iso: string): string {
  return `  "${slug}": ${JSON.stringify(iso)},\n`;
}

function formatDateSourceEntry(slug: string, source: string): string {
  return `  "${slug}": ${JSON.stringify(source)},\n`;
}

function formatFaqEntry(slug: string, faq: EpisodeFaq): string {
  return `  "${slug}": {\n    question: ${JSON.stringify(faq.question)},\n    answer:\n      ${JSON.stringify(faq.answer)},\n  },\n`;
}

export function upsertCatalogSidecars(
  episodes: NewEpisodeSidecarInput[],
  options: UpsertCatalogSidecarsOptions = {},
): UpsertCatalogSidecarsResult {
  const root = options.root ?? DEFAULT_ROOT;
  const nowIso = options.nowIso ?? new Date().toISOString();
  const gitShortSha = options.gitShortSha ?? resolveGitShortSha(root);
  const dryRun = options.dryRun ?? false;

  const zonesPath = path.join(root, "data/story-zones.ts");
  const promptsPath = path.join(root, "data/reflection-prompts.ts");
  const datesPath = path.join(root, "data/story-dates.ts");
  const faqsPath = path.join(root, "data/episode-faqs.ts");

  let zonesSrc = fs.readFileSync(zonesPath, "utf8");
  let promptsSrc = fs.readFileSync(promptsPath, "utf8");
  let datesSrc = fs.readFileSync(datesPath, "utf8");
  let faqsSrc = fs.readFileSync(faqsPath, "utf8");

  const updatedSlugs: string[] = [];
  const episodeFaqStubSlugs: string[] = [];

  for (const ep of episodes) {
    let touched = false;
    const zoneId = inferZoneId(ep.title, ep.summary);
    const prompt = buildReflectionStub(ep.title);
    const dateSource = `${gitShortSha} sync Apple RSS MVP`;

    const zoneResult = insertBeforeRecordClose(
      zonesSrc,
      /const STORY_ZONES:\s*Record<[^>]+>\s*=\s*\{/,
      ep.slug,
      formatZoneEntry(ep.slug, zoneId, ep.title),
    );
    zonesSrc = zoneResult.source;
    touched ||= zoneResult.inserted;

    const promptResult = insertBeforeRecordClose(
      promptsSrc,
      /const REFLECTION_PROMPTS:\s*Record<[\s\S]*?>\s*=\s*\{/,
      ep.slug,
      formatReflectionEntry(ep.slug, prompt),
    );
    promptsSrc = promptResult.source;
    touched ||= promptResult.inserted;

    const datesResult = insertBeforeRecordClose(
      datesSrc,
      /export const storyModifiedDates:\s*Record<[^>]+>\s*=\s*\{/,
      ep.slug,
      formatDateEntry(ep.slug, nowIso),
    );
    datesSrc = datesResult.source;
    touched ||= datesResult.inserted;

    const sourceResult = insertBeforeRecordClose(
      datesSrc,
      /export const STORY_MODIFIED_DATE_SOURCE:\s*Record<[^>]+>\s*=\s*\{/,
      ep.slug,
      formatDateSourceEntry(ep.slug, dateSource),
    );
    datesSrc = sourceResult.source;
    touched ||= sourceResult.inserted;

    const faqResult = insertBeforeRecordClose(
      faqsSrc,
      /const EPISODE_FAQS:\s*Record<string,\s*EpisodeFaq>\s*=\s*\{/,
      ep.slug,
      formatFaqEntry(ep.slug, buildEpisodeFaqStub(ep.slug, ep.title, ep.summary)),
    );
    faqsSrc = faqResult.source;
    touched ||= faqResult.inserted;
    if (faqResult.inserted) episodeFaqStubSlugs.push(ep.slug);

    if (touched) updatedSlugs.push(ep.slug);
  }

  if (!dryRun && updatedSlugs.length > 0) {
    fs.writeFileSync(zonesPath, zonesSrc, "utf8");
    fs.writeFileSync(promptsPath, promptsSrc, "utf8");
    fs.writeFileSync(datesPath, datesSrc, "utf8");
    fs.writeFileSync(faqsPath, faqsSrc, "utf8");
  }

  return { updatedSlugs, episodeFaqStubSlugs };
}
