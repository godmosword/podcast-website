/**
 * D3 Night 主題：掃描 CSS Modules 中的硬編 hex，標記須 token 化的頁面。
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

/** 允許保留硬編色（播放器黑底、地圖海圖固定淺色等）。 */
/**
 * 固定美術色 allowlist。
 *
 * DESIGN.md §230：「遊戲載入器、地圖木牌、播放器黑底等固定美術色可保留為
 * component-local／allowlist 色，不跨元件複製同一組 hex」；§110：這些色
 * 「不吃主題 token，**皆不反轉**——夜間只調整強度，不換語意色」。
 *
 * 這份清單就是那條政策的機器可讀版本。**新增前請先確認該檔真的是美術色**
 * （畫布、舞台、遮罩、已實測對比的固定前景），而不是懶得換 token。
 */
const HARDCODED_COLOR_ALLOWLIST = [
  // 播放器黑底（DESIGN.md §110 明列）
  "components/StoryPlayer.module.css",
  // 宇宙地圖場景與木牌：印刷淺色，夜間刻意不反轉（DESIGN.md §103）
  "components/universe/UniverseMap.module.css",
  "components/universe/ZoneIsland.module.css",
  "components/universe/ZoneSheet.module.css",
  "components/universe/HotspotLayer.module.css",
  "components/universe/ZoneNightLights.module.css",
  // 遊戲畫布與載入器（DESIGN.md §230）
  "components/games/CandyMatchView.module.css",
  // 消消樂局內／地圖／棋盤：同一張淺色糖果卡面（原為 CandyMatchView inline style），
  // 卡面夜間不反轉，墨色必須固定才維持對比；改吃主題 token 會在夜間變成淺字疊淺底
  "components/games/CandyMatchPlay.module.css",
  "components/games/CandyMatchMap.module.css",
  "components/games/CandyMatchBoard.module.css",
  "components/games/GameLoadOverlay.module.css",
  "components/games/GameEndStation.module.css",
  // 方塊轉轉標題頁、地圖、任務列：同一張馬卡龍奶油卡面（原為 inline style，見 blockDropTheme），夜間不反轉
  "components/games/BlockDropTitle.module.css",
  "components/games/BlockDropMap.module.css",
  "components/games/BlockDropTaskBar.module.css",
  // 多多壽司屋：廚房、托盤、砧板與結算同一張奶油卡面＋天藍多多舞台（程式畫的黏土美術），
  // 卡面夜間不反轉，墨色、CTA 與焦點環都釘在日間值，改吃主題 token 會在夜間變成淺字疊淺底
  "components/games/DinoSushiView.module.css",
  "components/games/DinoSushiKitchen.module.css",
  // 結算星星與小籤：消消樂、方塊轉轉共用，疊在固定淺色的結算卡面上（日夜不反轉）
  "components/games/ResultStars.module.css",
  // 著色畫布：底必須是純白，否則蠟筆顏色會被主題染色
  "components/coloring/ColoringPageShell.module.css",
  // 真實世界地圖：類型剪影 #34302b／「其他」淺沙 #cfcac2 為固定美術色
  // （DESIGN.md §48）；另有遮罩用的 #000 與圖釘白環。
  "components/for-parents/PlayMap.module.css",
  // 縣市色塊圖白字：註解內已記實測 5.77:1，是刻意的固定前景
  "components/for-parents/PlayMapCityWall.module.css",
  // Landing／Hero 舞台美術
  "components/landing/LandingSegment.module.css",
  "components/landing/SiteNavBar.module.css",
  "components/landing/IntroOverlay.module.css",
  "components/landing/hero-world/HeroWorld.module.css",
  "components/landing/hero-parallax/HeroParallax.module.css",
] as const;

export { HARDCODED_COLOR_ALLOWLIST };

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
