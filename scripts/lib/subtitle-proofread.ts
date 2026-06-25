// ============================================================
// 字幕校對 — 新集上架 workflow 閘門
// ============================================================
// Whisper 產出為草稿；在 illustrate / approve（更新幕級字幕到站上）
// 之前必須完成校對並 --mark。
// ============================================================

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getStory } from "../../data/content";
import { readCharacters } from "./illustrate-core";
import {
  ROOT,
  subtitleSidecarPath,
} from "./transcribe-core";

export type SubtitleSegment = { t: number; text: string };

type ProofreadIssue = {
  index: number;
  t: number;
  text: string;
  code: string;
  message: string;
  /** 建議替換（若有） */
  suggestion?: string;
};

export type ProofreadReport = {
  slug: string;
  segmentCount: number;
  issues: ProofreadIssue[];
  autoFixCount: number;
};

type ProofreadMarker = {
  slug: string;
  proofreadAt: string;
  segmentCount: number;
  /** lint 通過後標記；若 --force 則可能 >0 */
  issueCountAtMark: number;
};

const PROOFREAD_DIR = join(ROOT, "data", "subtitles", "_proofread");

/** 品牌／主持人：Whisper 高頻誤聽 → canonical */
const BRAND_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /Bon\s*Bon/gi, replacement: "Bonbon" },
  { pattern: /bonbon/g, replacement: "Bonbon" },
  { pattern: /(?<![小])寶寶/g, replacement: "Bonbon" },
  { pattern: /宝贝/g, replacement: "Bonbon" },
  { pattern: /媽咪/g, replacement: "馬米" },
  { pattern: /妈咪/g, replacement: "馬米" },
  { pattern: /马米/g, replacement: "馬米" },
];

/** 幻覺鳴謝／廣告句（transcribe-core 已濾一輪，仍可能漏） */
const PHANTOM_PATTERNS: RegExp[] = [
  /字幕\s*[:：]/,
  /請訂閱/,
  /感谢观看/,
  /謝謝收看/,
  /订阅频道/,
  /訂閱頻道/,
];

/** 常見同音誤字（需人工語境判斷時只 lint、不自動改） */
const HOMOPHONE_LINT: Array<{ pattern: RegExp; code: string; message: string }> =
  [
    {
      pattern: /全部都按了下來/,
      code: "homophone-an",
      message: "「按了下來」可能是「暗了下來」（燈光變暗）",
    },
    {
      pattern: /喜歡吃雞/,
      code: "homophone-stimulus",
      message: "「喜歡吃雞」可能是「喜歡刺激」",
    },
    {
      pattern: /需要按摩/,
      code: "homophone-comfort",
      message: "「需要按摩」可能是「需要安慰」",
    },
    {
      pattern: /不小心買車/,
      code: "homophone-drive",
      message: "「買車」可能是「開太快／飆車」類口語誤聽",
    },
    { pattern: /小蔥/, code: "wrong-char-name", message: "「小蔥」應為「小衝」（賽車角色）" },
    { pattern: /菜車/, code: "wrong-vehicle", message: "「菜車」應為「賽車」或角色名「小衝賽車」" },
    { pattern: /貫車/, code: "homophone-truck", message: "「貫車」可能是「貨車」" },
    { pattern: /他太擠了/, code: "homophone-hurry", message: "「太擠了」可能是「太急了」" },
  ];

function proofreadMarkerPath(slug: string): string {
  return join(PROOFREAD_DIR, `${slug}.json`);
}

function hasProofreadMarker(slug: string): boolean {
  return existsSync(proofreadMarkerPath(slug));
}

function readProofreadMarker(slug: string): ProofreadMarker | null {
  const p = proofreadMarkerPath(slug);
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8")) as ProofreadMarker;
  } catch {
    return null;
  }
}

export function writeProofreadMarker(
  slug: string,
  segmentCount: number,
  issueCountAtMark: number,
): string {
  mkdirSync(PROOFREAD_DIR, { recursive: true });
  const marker: ProofreadMarker = {
    slug,
    proofreadAt: new Date().toISOString(),
    segmentCount,
    issueCountAtMark,
  };
  const p = proofreadMarkerPath(slug);
  writeFileSync(p, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
  return p;
}

export function readSubtitleSegments(slug: string): SubtitleSegment[] {
  const p = subtitleSidecarPath(slug);
  if (!existsSync(p)) {
    throw new Error(`找不到字幕側車檔 ${p}；請先 npm run transcribe -- ${slug}`);
  }
  const raw: unknown = JSON.parse(readFileSync(p, "utf8"));
  if (!Array.isArray(raw)) throw new Error(`字幕格式錯誤：${p}`);
  return raw as SubtitleSegment[];
}

/** 載入該集 canonical 角色名（供日後擴充比對）。 */
function episodeCharacterHints(_slug: string): {
  canonicalNames: string[];
} {
  const story = getStory(_slug);
  const canonicalNames: string[] = [];

  if (story?.vehicle && story.vehicle !== "其他") {
    canonicalNames.push(story.vehicle);
  }

  for (const c of readCharacters()) {
    if (c.firstSeen === _slug) {
      canonicalNames.push(c.name, ...c.aliases);
    }
  }

  return { canonicalNames: [...new Set(canonicalNames)] };
}

function lintSegment(
  seg: SubtitleSegment,
  index: number,
  _hints: ReturnType<typeof episodeCharacterHints>,
): ProofreadIssue[] {
  const issues: ProofreadIssue[] = [];
  const { text, t } = seg;

  for (const { pattern, code, message } of HOMOPHONE_LINT) {
    if (pattern.test(text)) {
      issues.push({ index, t, text, code, message });
    }
  }

  for (const phantom of PHANTOM_PATTERNS) {
    if (phantom.test(text)) {
      issues.push({
        index,
        t,
        text,
        code: "phantom-credit",
        message: "疑似 Whisper 幻覺鳴謝／訂閱句，應刪除或改寫",
      });
    }
  }

  if (/(?<![小])寶寶|媽咪|宝贝|妈咪|Bon\s+Bon/i.test(text)) {
    issues.push({
      index,
      t,
      text,
      code: "brand-name",
      message: "主持人名誤聽：應為 Bonbon／馬米（可 npm run proofread:subtitles -- <slug> --fix）",
    });
  }

  return issues;
}

export function lintSubtitles(slug: string, segments?: SubtitleSegment[]): ProofreadReport {
  const subs = segments ?? readSubtitleSegments(slug);
  const hints = episodeCharacterHints(slug);
  const issues: ProofreadIssue[] = [];
  subs.forEach((seg, index) => {
    issues.push(...lintSegment(seg, index, hints));
  });
  return { slug, segmentCount: subs.length, issues, autoFixCount: 0 };
}

/** 僅套用高信心自動修正（品牌名、空白）。 */
export function applySafeAutoFixes(segments: SubtitleSegment[]): {
  segments: SubtitleSegment[];
  fixCount: number;
} {
  let fixCount = 0;
  const out = segments.map((seg) => {
    let text = seg.text.replace(/\s{2,}/g, " ").trim();
    for (const { pattern, replacement } of BRAND_REPLACEMENTS) {
      const next = text.replace(pattern, replacement);
      if (next !== text) {
        fixCount++;
        text = next;
      }
    }
    return text === seg.text ? seg : { ...seg, text };
  });
  return { segments: out, fixCount };
}

export function writeSubtitleSegments(slug: string, segments: SubtitleSegment[]): string {
  const p = subtitleSidecarPath(slug);
  writeFileSync(p, `${JSON.stringify(segments, null, 2)}\n`, "utf8");
  return p;
}

export function formatProofreadReport(report: ProofreadReport): string {
  if (report.issues.length === 0) {
    return `✓ ${report.slug}：${report.segmentCount} 句字幕，lint 通過`;
  }
  const lines = [`✗ ${report.slug}：${report.issues.length} 項待校對（共 ${report.segmentCount} 句）`];
  for (const i of report.issues.slice(0, 30)) {
    const at = `${Math.floor(i.t / 60)}:${String(Math.floor(i.t % 60)).padStart(2, "0")}`;
    lines.push(`  [${at}] #${i.index} ${i.code}: ${i.message}`);
    lines.push(`    「${i.text}」`);
  }
  if (report.issues.length > 30) {
    lines.push(`  … 另有 ${report.issues.length - 30} 項`);
  }
  return lines.join("\n");
}

/**
 * illustrate / approve 前閘門：新集須先 npm run proofread:subtitles -- <slug> --mark
 * 已全幕上線（pageCount>1）的舊集免強制（歷史資料 grandfather）。
 */
export function assertSubtitleProofread(slug: string, operation: "illustrate" | "approve"): void {
  if (!existsSync(subtitleSidecarPath(slug))) return;

  if (hasProofreadMarker(slug)) {
    const marker = readProofreadMarker(slug)!;
    const subs = readSubtitleSegments(slug);
    if (subs.length !== marker.segmentCount) {
      throw new Error(
        `${slug}：字幕已校對標記（${marker.segmentCount} 句），但側車檔現有 ${subs.length} 句。` +
          `請重新 npm run proofread:subtitles -- ${slug} --mark`,
      );
    }
    return;
  }

  const story = getStory(slug);
  if (operation === "approve" && story && story.pageCount > 1) {
    return;
  }

  if (!/^ep-\d+$/.test(slug)) return;

  throw new Error(
    `${slug}：字幕尚未校對標記。` +
      `流程：npm run transcribe → npm run proofread:subtitles -- ${slug} [--fix] → 人工修 JSON →` +
      ` npm run proofread:subtitles -- ${slug} --mark → npm run illustrate …` +
      `（見 docs/SUBTITLE-PROOFREAD.md）`,
  );
}

/** verify:episodes 用：MVP 或有 scenes 但未 mark → warn */
export function verifySubtitleProofread(slug: string, hasScenes: boolean): {
  level: "warn";
  code: string;
  message: string;
} | null {
  if (!/^ep-\d+$/.test(slug)) return null;
  if (!existsSync(subtitleSidecarPath(slug))) return null;
  if (hasProofreadMarker(slug)) return null;

  const story = getStory(slug);
  if (story && story.pageCount > 1) return null;

  if (story?.pageCount === 1 || hasScenes) {
    return {
      level: "warn",
      code: "subtitle-unproofread",
      message:
        "字幕為 Whisper 草稿，尚未 proofread --mark；illustrate 前請校對（docs/SUBTITLE-PROOFREAD.md）",
    };
  }
  return null;
}
