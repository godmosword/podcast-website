/**
 * D3 Night 主題：掃描 CSS Modules 中的硬編 hex，標記須 token 化的頁面。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

/** 允許保留硬編色（播放器黑底、地圖海圖固定淺色等）。 */
const HARDCODED_COLOR_ALLOWLIST = [
  "components/StoryPlayer.module.css",
  "components/universe/UniverseMap.module.css",
  "components/universe/ZoneIsland.module.css",
  "components/universe/ZoneSheet.module.css",
  "components/landing/LandingSegment.module.css",
  "app/topic/page.module.css",
  "app/games/candy-kart/page.module.css",
] as const;

/** D3 驗收頁：不得出現裸 hex（須改用 design token）。 */
const D3_TOKENIZED_CSS_FILES = [
  "app/characters/page.module.css",
  "app/for-parents/page.module.css",
  "app/for-parents/dashboard/page.module.css",
  "app/stories/page.module.css",
  "app/story/[slug]/page.module.css",
  "app/games/page.module.css",
  "components/SiteFooter.module.css",
] as const;

const SCAN_ROOTS = ["app", "components"] as const;

export type HardcodedColorHit = {
  file: string;
  line: number;
  value: string;
};

export type HardcodedColorReport = {
  hits: HardcodedColorHit[];
  byFile: Record<string, HardcodedColorHit[]>;
};

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

/** 移除註解與 var() fallback 內的 hex，避免誤報。 */
export function stripCssNoise(source: string): string {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return noComments.replace(/var\([^)]*#[0-9a-fA-F]{3,8}[^)]*\)/gi, "var(--fallback)");
}

export function findHardcodedHex(source: string): HardcodedColorHit[] {
  const hits: HardcodedColorHit[] = [];
  const lines = stripCssNoise(source).split("\n");

  lines.forEach((line, index) => {
    const matches = line.match(HEX_PATTERN);
    if (!matches) return;
    for (const value of matches) {
      hits.push({ file: "", line: index + 1, value });
    }
  });

  return hits;
}

export function auditHardcodedColors(repoRoot: string): HardcodedColorReport {
  const files: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    const abs = join(repoRoot, scanRoot);
    listCssModules(abs, repoRoot, files);
  }

  const allow = new Set<string>(HARDCODED_COLOR_ALLOWLIST);
  const hits: HardcodedColorHit[] = [];
  const byFile: Record<string, HardcodedColorHit[]> = {};

  for (const file of files.sort()) {
    if (allow.has(file)) continue;
    const content = readFileSync(join(repoRoot, file), "utf8");
    const fileHits = findHardcodedHex(content).map((hit) => ({ ...hit, file }));
    if (fileHits.length === 0) continue;
    byFile[file] = fileHits;
    hits.push(...fileHits);
  }

  return { hits, byFile };
}

export function assertD3PagesTokenized(repoRoot: string): string[] {
  const violations: string[] = [];

  for (const file of D3_TOKENIZED_CSS_FILES) {
    const content = readFileSync(join(repoRoot, file), "utf8");
    const hits = findHardcodedHex(content);
    if (hits.length > 0) {
      violations.push(
        `${file}: ${hits.map((h) => `L${h.line} ${h.value}`).join(", ")}`,
      );
    }
  }

  return violations;
}

export function formatHardcodedColorReport(report: HardcodedColorReport): string {
  const files = Object.keys(report.byFile).sort();
  if (files.length === 0) {
    return "✓ 無 allowlist 外硬編 hex";
  }

  const lines = ["⚠ allowlist 外硬編 hex："];
  for (const file of files) {
    const fileHits = report.byFile[file] ?? [];
    const summary = fileHits.map((h) => `L${h.line} ${h.value}`).join(", ");
    lines.push(`  ${file}: ${summary}`);
  }
  return lines.join("\n");
}
