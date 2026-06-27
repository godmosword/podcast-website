import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { Story } from "../../data/stories";
import type { TopicSymbol } from "../../lib/topic-visuals";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
export const BROWSE_INDEX_PATH = path.join(ROOT, "data/browse-index.json");

export type VehicleIndexEntry = {
  emoji: string;
  patterns: string[];
};

export type TopicIndexEntry = {
  symbol: TopicSymbol;
};

export type BrowseIndex = {
  vehicles: Record<string, VehicleIndexEntry>;
  topics: Record<string, TopicIndexEntry>;
};

const TOPIC_SYMBOL_HINTS: [RegExp, TopicSymbol][] = [
  [/勇|勇敢/, "star"],
  [/成長|長大|學會/, "sprout"],
  [/安全|規則/, "shield"],
  [/合作|分工|手足|雙胞胎/, "link"],
  [/情緒|感受|同理/, "heart"],
  [/守信|信用/, "check"],
  [/習慣|刷牙|洗手|衛生/, "habit"],
  [/冷靜|不慌|睡前/, "calm"],
  [/助人|幫助/, "help"],
  [/求助|幫忙/, "ask"],
  [/負責|責任/, "flag"],
  [/失敗|沒關係/, "retry"],
  [/創意/, "spark"],
  [/想像/, "dream"],
  [/解決|想辦法|問題/, "puzzle"],
];

const VEHICLE_EMOJI_HINTS: [RegExp, string][] = [
  [/怪獸卡車|Monster Truck/i, "🚚"],
  [/消防/, "🚒"],
  [/恐龍/, "🦕"],
  [/警/, "🚓"],
  [/巴士|公車/, "🚌"],
  [/救護/, "🚑"],
  [/挖土|鏟土/, "🚜"],
  [/清潔|垃圾/, "🚛"],
  [/賽車|跑車/, "🏎️"],
  [/無人機|空拍/, "🛸"],
  [/電動|充電/, "🔋"],
  [/高鐵|列車/, "🚄"],
  [/計程|小黃/, "🚕"],
  [/餐車|小吃|爆米花/, "🍿"],
  [/吊車|起重/, "🏗️"],
  [/捷運|MRT|地鐵/, "🚇"],
  [/消毒/, "🧴"],
];

const TOPIC_FALLBACK_SYMBOLS: TopicSymbol[] = [
  "star",
  "sprout",
  "shield",
  "link",
  "heart",
  "check",
  "habit",
  "calm",
];

let cache: BrowseIndex | null = null;
let cacheMtime = 0;

export function invalidateBrowseIndexCache(): void {
  cache = null;
  cacheMtime = 0;
}

export function readBrowseIndex(): BrowseIndex {
  const stat = fs.statSync(BROWSE_INDEX_PATH);
  if (!cache || stat.mtimeMs !== cacheMtime) {
    cache = JSON.parse(fs.readFileSync(BROWSE_INDEX_PATH, "utf8")) as BrowseIndex;
    cacheMtime = stat.mtimeMs;
  }
  return cache;
}

export function writeBrowseIndex(index: BrowseIndex): void {
  fs.writeFileSync(BROWSE_INDEX_PATH, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  invalidateBrowseIndexCache();
}

export function vehicleMatchRules(index = readBrowseIndex()): [RegExp, string][] {
  const rules: [RegExp, string][] = [];
  for (const [vehicle, entry] of Object.entries(index.vehicles)) {
    if (vehicle === "其他") continue;
    for (const pattern of entry.patterns) {
      rules.push([new RegExp(pattern, "i"), vehicle]);
    }
  }
  return rules;
}

export function emojiForVehicle(vehicle: string, index = readBrowseIndex()): string {
  return index.vehicles[vehicle]?.emoji ?? index.vehicles["其他"]?.emoji ?? "🚗";
}

export function topicSymbolFor(tag: string, index = readBrowseIndex()): TopicSymbol | undefined {
  return index.topics[tag]?.symbol;
}

function hashTag(tag: string): number {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0;
  return h;
}

export function suggestVehicleEntry(vehicle: string): VehicleIndexEntry {
  for (const [pattern, emoji] of VEHICLE_EMOJI_HINTS) {
    if (pattern.test(vehicle)) {
      return { emoji, patterns: [vehicle] };
    }
  }
  return { emoji: "🚗", patterns: [vehicle] };
}

export function suggestTopicEntry(tag: string): TopicIndexEntry {
  for (const [pattern, symbol] of TOPIC_SYMBOL_HINTS) {
    if (pattern.test(tag)) return { symbol };
  }
  return { symbol: TOPIC_FALLBACK_SYMBOLS[hashTag(tag) % TOPIC_FALLBACK_SYMBOLS.length]! };
}

export type BrowseIndexReconcileResult = {
  addedVehicles: string[];
  addedTopics: string[];
  index: BrowseIndex;
};

/** 依目錄中的車種／主題補齊找車車索引（缺項自動建議 emoji／symbol）。 */
export function reconcileBrowseIndex(stories: Story[]): BrowseIndexReconcileResult {
  const index = structuredClone(readBrowseIndex());
  const addedVehicles: string[] = [];
  const addedTopics: string[] = [];

  for (const story of stories) {
    const vehicle = story.vehicle?.trim();
    if (vehicle && vehicle !== "其他" && !index.vehicles[vehicle]) {
      index.vehicles[vehicle] = suggestVehicleEntry(vehicle);
      addedVehicles.push(vehicle);
    }
    for (const tag of story.tags ?? []) {
      const t = tag.trim();
      if (t && !index.topics[t]) {
        index.topics[t] = suggestTopicEntry(t);
        addedTopics.push(t);
      }
    }
  }

  addedVehicles.sort((a, b) => a.localeCompare(b, "zh-Hant"));
  addedTopics.sort((a, b) => a.localeCompare(b, "zh-Hant"));
  return { addedVehicles, addedTopics, index };
}

/** 確保每集 emoji 與 browse-index 中車種一致。 */
export function applyVehicleEmojis(stories: Story[], index = readBrowseIndex()): {
  stories: Story[];
  updatedSlugs: string[];
} {
  const updatedSlugs: string[] = [];
  const next = stories.map((story) => {
    const emoji = emojiForVehicle(story.vehicle, index);
    if (story.emoji === emoji) return story;
    updatedSlugs.push(story.slug);
    return { ...story, emoji };
  });
  return { stories: next, updatedSlugs };
}

export type BrowseIndexIssue = {
  slug?: string;
  level: "error" | "warn";
  code: string;
  message: string;
};

/** 驗證目錄車種／主題是否已登錄於找車車索引。 */
export function verifyBrowseIndex(stories: Story[]): BrowseIndexIssue[] {
  const index = readBrowseIndex();
  const issues: BrowseIndexIssue[] = [];

  for (const story of stories) {
    const vehicle = story.vehicle?.trim();
    if (vehicle && vehicle !== "其他" && !index.vehicles[vehicle]) {
      issues.push({
        slug: story.slug,
        level: "error",
        code: "missing-vehicle-index",
        message: `車種「${vehicle}」未登錄 data/browse-index.json`,
      });
    }
    if (vehicle && index.vehicles[vehicle] && story.emoji !== emojiForVehicle(vehicle, index)) {
      issues.push({
        slug: story.slug,
        level: "warn",
        code: "emoji-mismatch",
        message: `emoji ${story.emoji} 與索引 ${emojiForVehicle(vehicle, index)} 不一致（${vehicle}）`,
      });
    }
    for (const tag of story.tags ?? []) {
      if (!index.topics[tag]) {
        issues.push({
          slug: story.slug,
          level: "warn",
          code: "missing-topic-index",
          message: `主題「${tag}」未登錄 data/browse-index.json（找故事主題圖示將用 fallback）`,
        });
      }
    }
    if (story.vehicle === "其他") {
      const inferred = vehicleMatchRules(index).find(([re]) =>
        re.test(`${story.title} ${story.summary ?? ""}`),
      );
      if (inferred) {
        issues.push({
          slug: story.slug,
          level: "warn",
          code: "vehicle-still-other",
          message: `仍為「其他」，標題／摘要疑似可推斷為「${inferred[1]}」`,
        });
      }
    }
  }

  return issues;
}

export function formatBrowseIndexReport(issues: BrowseIndexIssue[]): string {
  if (issues.length === 0) return "✓ 找車車索引與目錄一致";
  const lines = issues.map((i) => {
    const prefix = i.slug ? `[${i.slug}] ` : "";
    const mark = i.level === "error" ? "✗" : "⚠";
    return `${mark} ${prefix}${i.code}: ${i.message}`;
  });
  const errors = issues.filter((i) => i.level === "error").length;
  const warns = issues.filter((i) => i.level === "warn").length;
  lines.push("", `錯誤 ${errors}、警告 ${warns}`);
  return lines.join("\n");
}
