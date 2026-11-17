import { existsSync, readdirSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

/** 官網 build 要從工作目錄拿掉的固定路徑。實驗站 build 不呼叫。 */
export const OFFICIAL_PRUNE_FILES = [
  "app/studio/page.tsx",
  "app/studio/page.module.css",
  "scripts/illustrate.ts",
  "scripts/generate-landing-art.ts",
  "scripts/generate-character-portraits.ts",
  "scripts/generate-roamer-assets.ts",
  "scripts/generate-games-hub-hero.ts",
  "scripts/generate-dino-sushi-food.ts",
  "scripts/generate-story-covers.ts",
  "scripts/generate-orange-express-art.ts",
  "scripts/generate-dino-sushi-cover.ts",
  "scripts/generate-coloring-reference.ts",
  "scripts/generate-coloring-ai-lineart.ts",
  "scripts/generate-zone-night-art.ts",
  "scripts/generate-coloring-cover.ts",
  "scripts/generate-coloring-lineart.ts",
  "scripts/generate-map-art.ts",
  "scripts/generate-forest-zone-art.ts",
] as const;

/** prebuild 與站點必備腳本，prune 不得刪。 */
export const OFFICIAL_PRUNE_KEEP_FILES = [
  "scripts/generate-audio-lengths.ts",
  "scripts/generate-llms-full.ts",
  "scripts/generate-indexnow-key.ts",
  "app/studio/feedback/page.tsx",
  "app/studio/error.tsx",
] as const;

const STAGING_DIRS = [
  "public/.illustrate-staging",
  "public/.landing-staging",
  "public/.roamer-staging",
  "public/.map-staging",
  "public/.coloring-staging",
  "public/.games-staging",
];

/** 官網建置輸入不留 agent 指令。這些檔不會變成網頁，但也不該留在官網產物的來源裡。 */
const AGENT_PATHS = [".cursor", "AGENTS.md", "CLAUDE.md"];

function exists(root: string, relativePath: string): boolean {
  return existsSync(join(root, relativePath));
}

/** 回傳要刪的相對路徑。審核頁與 prebuild 腳本不在裡面。 */
export function pathsToPrune(root: string, approvedStories: readonly string[]): string[] {
  const approved = new Set(approvedStories);
  const paths: string[] = [];

  for (const file of OFFICIAL_PRUNE_FILES) {
    if (exists(root, file)) paths.push(file);
  }
  for (const dir of STAGING_DIRS) {
    if (exists(root, dir)) paths.push(dir);
  }
  for (const agentPath of AGENT_PATHS) {
    if (exists(root, agentPath)) paths.push(agentPath);
  }

  const storiesRoot = join(root, "public/stories");
  if (existsSync(storiesRoot)) {
    for (const name of readdirSync(storiesRoot)) {
      if (approved.has(name)) continue;
      if (!statSync(join(storiesRoot, name)).isDirectory()) continue;
      paths.push(`public/stories/${name}`);
    }
  }

  return paths;
}

/** 目錄裡沒被核准內容引用的檔。核准文章的封面與內文圖要放進 keep。 */
export function unreferencedFiles(
  root: string,
  directory: string,
  keep: ReadonlySet<string>,
): string[] {
  const abs = join(root, directory);
  if (!existsSync(abs)) return [];
  const paths: string[] = [];

  const walk = (current: string, relativeDir: string) => {
    for (const name of readdirSync(current)) {
      const absPath = join(current, name);
      const relativePath = `${relativeDir}/${name}`;
      if (statSync(absPath).isDirectory()) {
        walk(absPath, relativePath);
        continue;
      }
      if (!keep.has(relativePath)) paths.push(relativePath);
    }
  };

  walk(abs, directory);
  return paths;
}

export function applyPrune(root: string, relativePaths: readonly string[]): void {
  for (const relativePath of relativePaths) {
    rmSync(join(root, relativePath), { recursive: true, force: true });
  }
}
