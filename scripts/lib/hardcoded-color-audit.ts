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
  // 消消樂消除特效（彩虹車痕、碎糖、連鎖稱讚字）：疊在同一張淺色棋盤卡面上，
  // 糖果色是美術色、稱讚字墨色要對固定淺底維持對比，夜間同樣不反轉
  "components/games/CandyMatchFx.module.css",
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
  // 壽司屋店面（雨棚、木牆、燈籠、迴轉帶）：舞台美術色，同一張卡面日夜不反轉
  "components/games/DinoSushiShop.module.css",
  // 結算星星與小籤：消消樂、方塊轉轉共用，疊在固定淺色的結算卡面上（日夜不反轉）
  "components/games/ResultStars.module.css",
  // 著色畫布：底必須是純白，否則蠟筆顏色會被主題染色
  "components/coloring/ColoringPageShell.module.css",
  // 著色色票上的小圖案：深墨／淺色記號畫在固定色票色上（各色對比寫在 ColoringPalette.tsx 的 LIGHT_MARK 註解），
  // 色票本身日夜不換色，改吃主題 token 會在夜間變成深色塊上的深記號
  "components/coloring/ColoringPalette.module.css",
  // 真實世界地圖：類型剪影 #34302b／「其他」淺沙 #cfcac2 為固定美術色
  // （DESIGN.md §48）；另有遮罩用的 #000 與圖釘白環。
  "components/for-parents/PlayMap.module.css",
  // Landing／Hero 舞台美術
  "components/landing/LandingSegment.module.css",
  "components/landing/SiteNavBar.module.css",
  "components/landing/IntroOverlay.module.css",
  "components/landing/hero-world/HeroWorld.module.css",
  "components/landing/hero-parallax/HeroParallax.module.css",
] as const;

/**
 * TS／TSX 裡的固定美術色（SVG 填色、棋子、舞台、宇宙島、著色記號）。
 * 測試檔不掃。新增前先確認不是可以改吃 token 的介面色。
 */
const HARDCODED_COLOR_SOURCE_ALLOWLIST = [
  "app/global-error.tsx",
  "components/ShareButton.tsx",
  "components/StoryPlayer.tsx",
  "components/TopicIcon.tsx",
  "components/coloring/ColoringCanvas.tsx",
  "components/coloring/ColoringDoneSheet.tsx",
  "components/coloring/ColoringLeaveSheet.tsx",
  "components/coloring/ColoringPalette.tsx",
  "components/coloring/ColoringToolbarIcons.tsx",
  "components/decor/Wheel.tsx",
  "components/for-parents/scene-art/EnergyScene.tsx",
  "components/for-parents/scene-art/ExhibitScene.tsx",
  "components/for-parents/scene-art/FreeScene.tsx",
  "components/for-parents/scene-art/RainyScene.tsx",
  "components/games/BlockDropControls.tsx",
  "components/games/BlockDropHud.tsx",
  "components/games/BlockDropIcons.tsx",
  "components/games/BlockDropMap.tsx",
  "components/games/BlockDropOverlay.tsx",
  "components/games/BlockDropResult.tsx",
  "components/games/BlockDropView.tsx",
  "components/games/BlockDropWell.tsx",
  "components/games/CandyMatchBoard.tsx",
  "components/games/CandyMatchFx.tsx",
  "components/games/CandyMatchIcons.tsx",
  "components/games/CandyMatchMap.tsx",
  "components/games/CandyMatchPieceArt.tsx",
  "components/games/CandyMatchResult.tsx",
  "components/games/ClayIcons.tsx",
  "components/games/DinoSushiCustomerSeat.tsx",
  "components/games/DinoSushiGuestThanks.tsx",
  "components/games/DinoSushiOrderBubble.tsx",
  "components/games/DinoSushiTitle.tsx",
  "components/games/GameEndStation.tsx",
  "components/games/GamePlayChromeSlot.tsx",
  "components/games/ResultStars.tsx",
  "components/games/blockDropTheme.ts",
  "components/landing/hero-world/art-direction.ts",
  "components/ui/TapHand.tsx",
  "components/universe/MapBridgeLayer.tsx",
  "components/universe/MapDecorLayer.tsx",
  "components/universe/NightFireworks.tsx",
  "components/universe/UniverseMap.tsx",
  "components/universe/ZoneLandmarkArt.tsx",
  "components/universe/ZoneMotionPart.tsx",
] as const;

export { HARDCODED_COLOR_ALLOWLIST, HARDCODED_COLOR_SOURCE_ALLOWLIST };

/** D3 驗收頁：不得出現裸 hex（須改用 design token）。 */
const D3_TOKENIZED_CSS_FILES = [
  "app/characters/page.module.css",
  "components/about/AboutParentFaq.module.css",
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

function isScannedSource(name: string): boolean {
  if (name.endsWith(".d.ts")) return false;
  if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) return false;
  return name.endsWith(".ts") || name.endsWith(".tsx");
}

function listSources(dir: string, root: string, out: string[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      listSources(full, root, out);
      continue;
    }
    if (isScannedSource(entry)) out.push(relative(root, full));
  }
}

/** 去掉區塊與行註解，避免註解裡的色碼誤報。`https://` 不會被當成註解。 */
export function stripSourceNoise(source: string): string {
  const noBlock = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return noBlock.replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}

/** 移除註解與 var() fallback 內的 hex，避免誤報。 */
export function stripCssNoise(source: string): string {
  const noComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
  return noComments.replace(/var\([^)]*#[0-9a-fA-F]{3,8}[^)]*\)/gi, "var(--fallback)");
}

function findHexInStripped(stripped: string): HardcodedColorHit[] {
  const hits: HardcodedColorHit[] = [];
  stripped.split("\n").forEach((line, index) => {
    const matches = line.match(HEX_PATTERN);
    if (!matches) return;
    for (const value of matches) {
      hits.push({ file: "", line: index + 1, value });
    }
  });
  return hits;
}

export function findHardcodedHex(source: string): HardcodedColorHit[] {
  return findHexInStripped(stripCssNoise(source));
}

export function findHardcodedHexInSource(source: string): HardcodedColorHit[] {
  return findHexInStripped(stripSourceNoise(source));
}

export function auditHardcodedColors(repoRoot: string): HardcodedColorReport {
  const cssFiles: string[] = [];
  const sourceFiles: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    const abs = join(repoRoot, scanRoot);
    listCssModules(abs, repoRoot, cssFiles);
    listSources(abs, repoRoot, sourceFiles);
  }

  const cssAllow = new Set<string>(HARDCODED_COLOR_ALLOWLIST);
  const sourceAllow = new Set<string>(HARDCODED_COLOR_SOURCE_ALLOWLIST);
  const hits: HardcodedColorHit[] = [];
  const byFile: Record<string, HardcodedColorHit[]> = {};

  const take = (file: string, fileHits: HardcodedColorHit[]) => {
    if (fileHits.length === 0) return;
    byFile[file] = fileHits;
    hits.push(...fileHits);
  };

  for (const file of cssFiles.sort()) {
    if (cssAllow.has(file)) continue;
    const content = readFileSync(join(repoRoot, file), "utf8");
    take(file, findHardcodedHex(content).map((hit) => ({ ...hit, file })));
  }

  for (const file of sourceFiles.sort()) {
    if (sourceAllow.has(file)) continue;
    const content = readFileSync(join(repoRoot, file), "utf8");
    take(file, findHardcodedHexInSource(content).map((hit) => ({ ...hit, file })));
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
