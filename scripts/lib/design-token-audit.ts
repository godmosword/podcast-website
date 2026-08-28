/**
 * 設計 token 採用率稽核：量測 app/ 與 components/ 下 CSS Modules
 * 的字級、圓角、色彩、間距。本模組只量測，不當閘門。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const SCAN_ROOTS = ["app", "components"] as const;

const COLOR_PROPERTIES = new Set([
  "color",
  "background",
  "background-color",
  "border-color",
  "fill",
  "stroke",
]);

const SPACING_EXACT = new Set(["gap", "row-gap", "column-gap"]);

const SKIP_KEYWORDS = new Set([
  "inherit",
  "initial",
  "unset",
  "revert",
  "revert-layer",
  "none",
  "transparent",
  "currentcolor",
  "auto",
]);

const FONT_SIZE_KEYWORDS = new Set([
  ...SKIP_KEYWORDS,
  "smaller",
  "larger",
  "xx-small",
  "x-small",
  "small",
  "medium",
  "large",
  "x-large",
  "xx-large",
  "xxx-large",
]);

const NAMED_COLORS = new Set([
  "black",
  "silver",
  "gray",
  "grey",
  "white",
  "maroon",
  "red",
  "purple",
  "fuchsia",
  "green",
  "lime",
  "olive",
  "yellow",
  "navy",
  "blue",
  "teal",
  "aqua",
  "orange",
  "pink",
  "brown",
  "gold",
  "cyan",
  "magenta",
  "indigo",
  "violet",
  "beige",
  "ivory",
  "coral",
  "salmon",
  "khaki",
  "azure",
  "snow",
]);

export const FONT_SIZE_TOKEN_STEPS = [
  { name: "--fs-h1", rem: 1.85 },
  { name: "--fs-h2", rem: 1.35 },
  { name: "--fs-h3", rem: 1.25 },
  { name: "--fs-h3-compact", rem: 1.15 },
  { name: "--fs-meta", rem: 0.78 },
] as const;

export const NEAR_TOKEN_DELTA_REM = 0.06;

export type DimensionStat = {
  token: number;
  bare: number;
};

export type FileStat = {
  file: string;
  fontSize: DimensionStat;
  radius: DimensionStat;
  color: DimensionStat;
  spacing: DimensionStat;
  bareTotal: number;
};

export type FontSizeNearest = {
  name: string;
  rem: number;
  delta: number;
};

export type FontSizeBucket = {
  value: string;
  count: number;
  nearest: FontSizeNearest | null;
};

export type CssAudit = {
  fontSize: DimensionStat;
  radius: DimensionStat;
  color: DimensionStat;
  spacing: DimensionStat;
  /** rem 單位間距宣告數（政策豁免，不進 spacing 採用率分母） */
  spacingRem: number;
  fontSizes: FontSizeBucket[];
  remBareOccurrences: number;
};

export type VarFallbackMismatch = {
  token: string;
  defined: string;
  fallback: string;
  file?: string;
};

export type DesignTokenReport = CssAudit & {
  fileCount: number;
  files: FileStat[];
  fallbackMismatches: VarFallbackMismatch[];
};

function emptyStat(): DimensionStat {
  return { token: 0, bare: 0 };
}

function emptyAudit(): CssAudit {
  return {
    fontSize: emptyStat(),
    radius: emptyStat(),
    color: emptyStat(),
    spacing: emptyStat(),
    spacingRem: 0,
    fontSizes: [],
    remBareOccurrences: 0,
  };
}

export function adoptionPercent(stat: DimensionStat): number | null {
  const total = stat.token + stat.bare;
  if (total === 0) return null;
  return Math.round((100 * stat.token) / total);
}

function listCssModules(dir: string, root: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      listCssModules(full, root, out);
      continue;
    }
    if (entry.endsWith(".module.css")) {
      out.push(relative(root, full));
    }
  }
}

export function listCssModulePaths(repoRoot: string): string[] {
  const files: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    listCssModules(join(repoRoot, scanRoot), repoRoot, files);
  }
  return files.sort();
}

function isIdentChar(ch: string | undefined): boolean {
  return ch != null && /[A-Za-z0-9_-]/.test(ch);
}

function replaceFunctionCalls(
  source: string,
  name: string,
  replacement: string,
): string {
  const needle = `${name}(`;
  let out = "";
  let i = 0;
  while (i < source.length) {
    const idx = source.indexOf(needle, i);
    if (idx === -1) {
      out += source.slice(i);
      break;
    }
    if (isIdentChar(source[idx - 1])) {
      out += source.slice(i, idx + needle.length);
      i = idx + needle.length;
      continue;
    }
    out += source.slice(i, idx) + replacement;
    i = idx + needle.length;
    let depth = 1;
    let quote: string | null = null;
    while (i < source.length && depth > 0) {
      const ch = source[i];
      if (quote) {
        if (ch === "\\") {
          i += 2;
          continue;
        }
        if (ch === quote) quote = null;
        i += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        i += 1;
        continue;
      }
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      i += 1;
    }
  }
  return out;
}

function normalizeCssValue(value: string): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * 解析 CSS 自訂屬性。同一個名字出現多次時保留第一次
 * （:root 優先於後續的 night 主題覆寫）。
 */
export function parseCssCustomProperties(source: string): Map<string, string> {
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, " ");
  const defs = new Map<string, string>();
  const re = /(--[A-Za-z0-9-]+)\s*:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(stripped)) !== null) {
    const name = match[1];
    const value = match[2]?.replace(/\s+/g, " ").trim();
    if (!name || !value || defs.has(name)) continue;
    defs.set(name, value);
  }
  return defs;
}

function splitVarArgs(inner: string): { token: string; fallback: string | null } {
  let depth = 0;
  let quote: string | null = null;
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (quote) {
      if (ch === "\\") {
        i += 1;
        continue;
      }
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    else if (ch === "," && depth === 0) {
      const token = inner.slice(0, i).trim();
      const fallback = inner.slice(i + 1).trim();
      return { token, fallback: fallback.length > 0 ? fallback : null };
    }
  }
  return { token: inner.trim(), fallback: null };
}

type VarCall = { token: string; fallback: string | null };

function extractVarCalls(source: string): VarCall[] {
  const calls: VarCall[] = [];
  const needle = "var(";
  let i = 0;
  while (i < source.length) {
    const idx = source.indexOf(needle, i);
    if (idx === -1) break;
    if (isIdentChar(source[idx - 1])) {
      i = idx + needle.length;
      continue;
    }
    let depth = 1;
    let quote: string | null = null;
    let j = idx + needle.length;
    while (j < source.length && depth > 0) {
      const ch = source[j];
      if (quote) {
        if (ch === "\\") {
          j += 2;
          continue;
        }
        if (ch === quote) quote = null;
        j += 1;
        continue;
      }
      if (ch === '"' || ch === "'") {
        quote = ch;
        j += 1;
        continue;
      }
      if (ch === "(") depth += 1;
      else if (ch === ")") depth -= 1;
      j += 1;
    }
    const inner = source.slice(idx + needle.length, depth === 0 ? j - 1 : j);
    calls.push(splitVarArgs(inner));
    i = idx + needle.length;
  }
  return calls;
}

/**
 * `var(--token, fallback)` 的 fallback 與 globals 定義不符。
 * 未出現在 definitions 的名字（元件區域變數）略過。
 */
export function findVarFallbackMismatches(
  source: string,
  definitions: Map<string, string>,
): VarFallbackMismatch[] {
  const stripped = source.replace(/\/\*[\s\S]*?\*\//g, " ");
  const hits: VarFallbackMismatch[] = [];
  for (const call of extractVarCalls(stripped)) {
    if (!call.fallback) continue;
    const defined = definitions.get(call.token);
    if (defined == null) continue;
    if (normalizeCssValue(defined) === normalizeCssValue(call.fallback)) continue;
    hits.push({
      token: call.token,
      defined,
      fallback: call.fallback,
    });
  }
  return hits;
}

export function formatFallbackMismatchWarnings(
  hits: VarFallbackMismatch[],
): string {
  if (hits.length === 0) return "";
  const lines: string[] = [
    "## 警告：var() fallback 與 globals.css 不符",
    "",
    "token 有定義時 fallback 不會生效，但會誤導讀者，也會騙過採用率統計。",
    "",
    `| 檔案 | token | globals 定義 | fallback |`,
    `|---|---|---|---|`,
  ];
  for (const hit of hits) {
    const file = hit.file ? `\`${hit.file}\`` : "—";
    lines.push(
      `| ${file} | \`${hit.token}\` | \`${hit.defined}\` | \`${hit.fallback}\` |`,
    );
  }
  lines.push("");
  return `\n${lines.join("\n")}`;
}

/** 移除註解、url() 內容、var() 本體（含 fallback）、@media 條件。 */
export function stripDesignCssNoise(source: string): string {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, " ");
  const noUrls = replaceFunctionCalls(noComments, "url", "url()");
  const noVars = replaceFunctionCalls(noUrls, "var", "var(--token)");
  return noVars.replace(/@(media|supports|container)[^{]*\{/gi, "@$1{");
}

function normalizeValue(value: string): string {
  return value.replace(/!important/gi, "").replace(/\s+/g, " ").trim();
}

function extractDeclarations(css: string): { property: string; value: string }[] {
  const decls: { property: string; value: string }[] = [];
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*:\s*([^;{}]+?)\s*(;|(?=}))/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css)) !== null) {
    const property = match[1]?.toLowerCase();
    const value = match[2] ? normalizeValue(match[2]) : "";
    if (!property || !value) continue;
    decls.push({ property, value });
  }
  return decls;
}

function containsRemUnit(value: string): boolean {
  return /-?[\d.]+rem\b/i.test(value);
}

function containsVar(value: string): boolean {
  return /var\(/i.test(value);
}

function isZeroLike(part: string): boolean {
  return /^0(px|rem|em|vh|vw|dvh|svh|lvh|%)?$/i.test(part);
}

function isPercent(part: string): boolean {
  return /^-?[\d.]+%$/.test(part);
}

function isSkippedSpacing(value: string): boolean {
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return true;
  return parts.every(
    (part) =>
      SKIP_KEYWORDS.has(part.toLowerCase()) ||
      isZeroLike(part) ||
      isPercent(part),
  );
}

function isBareColor(value: string): boolean {
  if (/#([0-9a-fA-F]{3,8})\b/.test(value)) return true;
  if (
    /\b(rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color-mix|color)\s*\(/i.test(
      value,
    )
  ) {
    return true;
  }
  if (
    /\b(linear-gradient|radial-gradient|conic-gradient|repeating-linear-gradient|repeating-radial-gradient)\s*\(/i.test(
      value,
    )
  ) {
    return true;
  }
  return NAMED_COLORS.has(value.toLowerCase());
}

function isSpacingProperty(property: string): boolean {
  return (
    property.startsWith("margin") ||
    property.startsWith("padding") ||
    SPACING_EXACT.has(property)
  );
}

function isLengthFontSize(value: string): boolean {
  if (FONT_SIZE_KEYWORDS.has(value.toLowerCase())) return false;
  return true;
}

export function nearestFontSizeToken(value: string): FontSizeNearest | null {
  const simpleRem = value.match(/^(-?[\d.]+)rem$/i);
  const simplePx = value.match(/^(-?[\d.]+)px$/i);
  let rem: number | null = null;
  if (simpleRem) rem = Number(simpleRem[1]);
  else if (simplePx) rem = Number(simplePx[1]) / 16;
  if (rem == null || !Number.isFinite(rem)) return null;

  let best: FontSizeNearest | null = null;
  for (const step of FONT_SIZE_TOKEN_STEPS) {
    const delta = rem - step.rem;
    if (
      best == null ||
      Math.abs(delta) < Math.abs(best.delta) ||
      (Math.abs(delta) === Math.abs(best.delta) && step.rem < best.rem)
    ) {
      best = { name: step.name, rem: step.rem, delta };
    }
  }
  return best;
}

function roundDelta(delta: number): number {
  return Math.round(delta * 1000) / 1000;
}

function classify(
  property: string,
  value: string,
  audit: CssAudit,
  fontSizeCounts: Map<string, number>,
): void {
  if (property === "font-size") {
    if (!isLengthFontSize(value)) return;
    if (containsVar(value)) {
      audit.fontSize.token += 1;
      return;
    }
    audit.fontSize.bare += 1;
    fontSizeCounts.set(value, (fontSizeCounts.get(value) ?? 0) + 1);
    if (/^[\d.]+rem$/i.test(value)) audit.remBareOccurrences += 1;
    return;
  }

  if (property === "border-radius") {
    if (SKIP_KEYWORDS.has(value.toLowerCase()) || isZeroLike(value)) return;
    if (containsVar(value)) audit.radius.token += 1;
    else audit.radius.bare += 1;
    return;
  }

  if (COLOR_PROPERTIES.has(property)) {
    if (SKIP_KEYWORDS.has(value.toLowerCase())) return;
    if (containsVar(value)) {
      audit.color.token += 1;
      return;
    }
    if (isBareColor(value)) audit.color.bare += 1;
    return;
  }

  if (isSpacingProperty(property)) {
    if (isSkippedSpacing(value)) return;
    // rem 隨根字級縮放，--space-* 是 px；依 DESIGN.md 不進採用率分母。
    if (containsRemUnit(value)) {
      audit.spacingRem += 1;
      return;
    }
    if (containsVar(value)) audit.spacing.token += 1;
    else audit.spacing.bare += 1;
  }
}

function bucketsFromCounts(counts: Map<string, number>): FontSizeBucket[] {
  return [...counts.entries()]
    .map(([value, count]) => {
      const nearest = nearestFontSizeToken(value);
      return {
        value,
        count,
        nearest: nearest
          ? { ...nearest, delta: roundDelta(nearest.delta) }
          : null,
      };
    })
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export function auditCssSource(source: string): CssAudit {
  const audit = emptyAudit();
  const fontSizeCounts = new Map<string, number>();
  const decls = extractDeclarations(stripDesignCssNoise(source));
  for (const decl of decls) {
    classify(decl.property, decl.value, audit, fontSizeCounts);
  }
  audit.fontSizes = bucketsFromCounts(fontSizeCounts);
  return audit;
}

function addStat(target: DimensionStat, extra: DimensionStat): void {
  target.token += extra.token;
  target.bare += extra.bare;
}

export function auditDesignTokens(repoRoot: string): DesignTokenReport {
  const files = listCssModulePaths(repoRoot);
  const totals = emptyAudit();
  const fileStats: FileStat[] = [];
  const fontSizeCounts = new Map<string, number>();
  const globalsSource = readFileSync(join(repoRoot, "app/globals.css"), "utf8");
  const tokenDefinitions = parseCssCustomProperties(globalsSource);
  const fallbackMismatches: VarFallbackMismatch[] = [];

  for (const file of files) {
    const source = readFileSync(join(repoRoot, file), "utf8");
    const local = auditCssSource(source);
    for (const hit of findVarFallbackMismatches(source, tokenDefinitions)) {
      fallbackMismatches.push({ ...hit, file });
    }
    addStat(totals.fontSize, local.fontSize);
    addStat(totals.radius, local.radius);
    addStat(totals.color, local.color);
    addStat(totals.spacing, local.spacing);
    totals.spacingRem += local.spacingRem;
    totals.remBareOccurrences += local.remBareOccurrences;
    for (const bucket of local.fontSizes) {
      fontSizeCounts.set(
        bucket.value,
        (fontSizeCounts.get(bucket.value) ?? 0) + bucket.count,
      );
    }
    fileStats.push({
      file,
      fontSize: local.fontSize,
      radius: local.radius,
      color: local.color,
      spacing: local.spacing,
      bareTotal:
        local.fontSize.bare +
        local.radius.bare +
        local.color.bare +
        local.spacing.bare,
    });
  }

  fileStats.sort(
    (a, b) => b.bareTotal - a.bareTotal || a.file.localeCompare(b.file),
  );

  return {
    fileCount: files.length,
    fontSize: totals.fontSize,
    radius: totals.radius,
    color: totals.color,
    spacing: totals.spacing,
    spacingRem: totals.spacingRem,
    remBareOccurrences: totals.remBareOccurrences,
    fontSizes: bucketsFromCounts(fontSizeCounts),
    files: fileStats,
    fallbackMismatches,
  };
}

function formatStat(stat: DimensionStat): string {
  const pct = adoptionPercent(stat);
  const pctLabel = pct == null ? "—" : `${pct}%`;
  return `${stat.token} token / ${stat.bare} 裸值 → ${pctLabel}`;
}

function formatFileDim(stat: DimensionStat): string {
  const total = stat.token + stat.bare;
  if (total === 0) return "—";
  const pct = adoptionPercent(stat);
  return `${pct}% (${stat.token}/${total})`;
}

function formatDelta(nearest: FontSizeNearest): string {
  const abs = Math.abs(nearest.delta).toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  const signed = nearest.delta >= 0 ? `+${abs}` : `-${abs}`;
  return `${nearest.name} (${nearest.rem}) ${signed}`;
}

export function remNearTokenOccurrences(report: DesignTokenReport): number {
  let n = 0;
  for (const bucket of report.fontSizes) {
    if (!/^[\d.]+rem$/i.test(bucket.value) || bucket.nearest == null) continue;
    if (Math.abs(bucket.nearest.delta) <= NEAR_TOKEN_DELTA_REM) {
      n += bucket.count;
    }
  }
  return n;
}

export function formatDesignTokenReport(report: DesignTokenReport): string {
  const near = remNearTokenOccurrences(report);
  const remTotal = report.remBareOccurrences;
  const nearPct =
    remTotal === 0 ? "—" : `${Math.round((100 * near) / remTotal)}%`;

  const lines: string[] = [
    "# 設計 token 採用率",
    "",
    `CSS modules：${report.fileCount}`,
    "",
    "## 全站摘要",
    "",
    `| 維度 | token | 裸值 | 採用率 |`,
    `|---|---:|---:|---:|`,
    `| font-size | ${report.fontSize.token} | ${report.fontSize.bare} | ${adoptionPercent(report.fontSize) ?? "—"}% |`,
    `| border-radius | ${report.radius.token} | ${report.radius.bare} | ${adoptionPercent(report.radius) ?? "—"}% |`,
    `| color | ${report.color.token} | ${report.color.bare} | ${adoptionPercent(report.color) ?? "—"}% |`,
    `| spacing | ${report.spacing.token} | ${report.spacing.bare} | ${adoptionPercent(report.spacing) ?? "—"}% |`,
    "",
    `font-size：${formatStat(report.fontSize)}`,
    `border-radius：${formatStat(report.radius)}`,
    `color：${formatStat(report.color)}`,
    `spacing：${formatStat(report.spacing)}`,
    `另有 ${report.spacingRem} 處 rem 間距（政策豁免，見 DESIGN.md）`,
    "",
    "## 各檔案明細（依裸值總數降序）",
    "",
    `| 檔案 | font-size | radius | color | spacing | 裸值合計 |`,
    `|---|---:|---:|---:|---:|---:|`,
  ];

  for (const file of report.files) {
    lines.push(
      `| \`${file.file}\` | ${formatFileDim(file.fontSize)} | ${formatFileDim(file.radius)} | ${formatFileDim(file.color)} | ${formatFileDim(file.spacing)} | ${file.bareTotal} |`,
    );
  }

  lines.push(
    "",
    "## 裸字級專表",
    "",
    `共 ${report.fontSizes.length} 種。rem 裸值出現 ${remTotal} 次；落在現有 5 token ±${NEAR_TOKEN_DELTA_REM}rem 內 ${near} 次（${nearPct}）。`,
    "",
    `| 次數 | 值 | 最近 token |`,
    `|---:|---|---|`,
  );

  for (const bucket of report.fontSizes) {
    const nearest = bucket.nearest ? formatDelta(bucket.nearest) : "—";
    lines.push(`| ${bucket.count} | \`${bucket.value}\` | ${nearest} |`);
  }

  lines.push("");
  return `${lines.join("\n")}${formatFallbackMismatchWarnings(report.fallbackMismatches)}`;
}

export function designTokenReportToJson(report: DesignTokenReport): string {
  return `${JSON.stringify(
    {
      fileCount: report.fileCount,
      summary: {
        fontSize: {
          ...report.fontSize,
          adoptionPercent: adoptionPercent(report.fontSize),
        },
        radius: {
          ...report.radius,
          adoptionPercent: adoptionPercent(report.radius),
        },
        color: {
          ...report.color,
          adoptionPercent: adoptionPercent(report.color),
        },
        spacing: {
          ...report.spacing,
          adoptionPercent: adoptionPercent(report.spacing),
        },
      },
      spacingRem: report.spacingRem,
      remBareOccurrences: report.remBareOccurrences,
      remNearTokenOccurrences: remNearTokenOccurrences(report),
      uniqueBareFontSizes: report.fontSizes.length,
      files: report.files.map((file) => ({
        file: file.file,
        fontSize: file.fontSize,
        radius: file.radius,
        color: file.color,
        spacing: file.spacing,
        bareTotal: file.bareTotal,
      })),
      fontSizes: report.fontSizes,
      fallbackMismatches: report.fallbackMismatches,
    },
    null,
    2,
  )}\n`;
}
