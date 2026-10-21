/**
 * 故事封面 blur placeholder。
 * 已有的項目保留，只補缺的封面；封面檔不在就回報，不靜默略過、不寫入半成品。
 * CLI：`npm run generate:story-blurs`。Apple sync 在新集落地後也呼叫這裡（#251）。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { storyCoverPath } from "../../lib/story-utils";

const BLUR_WIDTH = 12;

export const STORY_IMAGE_BLURS_PATH = "data/story-image-blurs.json";

export type StoryCoverBlurTarget = {
  slug: string;
};

export type StoryCoverBlurResult = {
  /** 本輪新增的封面路徑（`/stories/<slug>/01.jpg`）。dry-run 只列出、不寫檔。 */
  added: string[];
  /** 缺封面檔、無法產生 blur 的路徑。有任何一筆就不會寫入 manifest。 */
  missingFiles: string[];
};

export async function blurDataUrlForJpg(absPath: string): Promise<string> {
  const buf = await sharp(absPath)
    .resize(BLUR_WIDTH, undefined, { withoutEnlargement: true })
    .blur(2)
    .jpeg({ quality: 45 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString("base64")}`;
}

function readManifest(outPath: string): Record<string, string> {
  if (!existsSync(outPath)) return {};
  return JSON.parse(readFileSync(outPath, "utf8")) as Record<string, string>;
}

/**
 * 為 `stories` 裡還沒有 blur 的封面補上 data URL。
 * 呼叫端要傳「寫入後的目錄」（含本輪新集）；不要用已快取的 `getStories()`。
 */
export async function ensureStoryCoverBlurs(options: {
  root: string;
  stories: readonly StoryCoverBlurTarget[];
  dryRun?: boolean;
}): Promise<StoryCoverBlurResult> {
  const outPath = join(options.root, STORY_IMAGE_BLURS_PATH);
  const existing = readManifest(outPath);
  const added: Record<string, string> = {};
  const missingFiles: string[] = [];

  for (const story of options.stories) {
    const src = storyCoverPath(story.slug);
    if (existing[src] || added[src]) continue;
    const abs = join(options.root, "public", src.slice(1));
    if (!existsSync(abs)) {
      missingFiles.push(src);
      continue;
    }
    if (!options.dryRun) {
      added[src] = await blurDataUrlForJpg(abs);
    } else {
      added[src] = "";
    }
  }

  const addedPaths = Object.keys(added);
  if (!options.dryRun && addedPaths.length > 0 && missingFiles.length === 0) {
    const manifest = { ...added, ...existing };
    writeFileSync(outPath, `${JSON.stringify(manifest, null, 2)}\n`);
  }

  return { added: addedPaths, missingFiles };
}
