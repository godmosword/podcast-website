/**
 * D0 資產治理：四類 taxonomy（部署／staging／動態推導／孤兒）。
 * 不可只 grep 靜態字串——須含 storyCoverPath、getZoneArtSrcSet 等推導路徑。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import charactersJson from "../../data/characters.json";
import { getStories } from "../../data/content";
import {
  LANDING_CLAY_EXTERNAL,
  LANDING_SEGMENTS,
} from "../../data/landing-segments";
import { DUDU_EMOTIONS, emotionSrc } from "../../data/dudu-emotions";
import { MAP_ROAMERS } from "../../data/universe-roamers";
import { ZONE_MOTION } from "../../data/universe-zone-motion";
import { ZONE_IDS } from "../../data/universe-zones";
import {
  cloudPath,
  CLOUD_IDS,
  moonPath,
  moonWebpPath,
  seaTexturePath,
  sunPath,
  sunWebpPath,
} from "../../lib/universe/map-art-src";
import { pngToWebp } from "../../lib/universe/png-to-webp";
import {
  getZoneArtSrcSet,
  getZoneNightArtSrcSet,
} from "../../lib/universe/zone-art-src";
import { storyCoverPath } from "../../lib/story-utils";

/** PR／CI 警示：超過此大小的 tracked JPG 列入 largeFiles。 */
export const MAX_JPG_BYTES = 400 * 1024;

/** gitignore 對齊的 staging 目錄（相對 repo root）。 */
export const STAGING_DIRS = [
  "public/.illustrate-staging",
  "public/.landing-staging",
  "public/.roamer-staging",
  "public/.map-staging",
] as const;

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|svg|avif)$/i;

const SOURCE_SCAN_DIRS = ["app", "components", "data", "lib", "scripts"] as const;

const STATIC_PUBLIC_ASSETS = [
  "/hero-home.jpg",
  "/mascot.png",
  "/icon-192.png",
  "/icon-512.png",
  "/apple-touch-icon.png",
] as const;

export type AssetTaxonomy = "deployed" | "staging" | "dynamic" | "orphan";

export type LargeFileEntry = {
  path: string;
  bytes: number;
};

export type AuditAssetsReport = {
  deployed: {
    imageCount: number;
    jpgCount: number;
    storyIllustrationCount: number;
    largeJpgs: LargeFileEntry[];
  };
  staging: {
    imageCount: number;
    byDir: Record<string, number>;
  };
  dynamic: {
    referenceCount: number;
    paths: string[];
  };
  orphans: {
    count: number;
    paths: string[];
  };
};

/** URL 路徑 `/foo/bar.jpg` → 磁碟路徑 `public/foo/bar.jpg`（相對 root）。 */
export function publicUrlToDiskPath(urlPath: string): string {
  const normalized = urlPath.startsWith("/") ? urlPath.slice(1) : urlPath;
  return join("public", normalized);
}

/** 磁碟路徑 → 站內 URL（小寫副檔名保留原樣）。 */
export function diskPathToPublicUrl(diskPath: string, root: string): string {
  const rel = relative(join(root, "public"), diskPath).replaceAll("\\", "/");
  return `/${rel}`;
}

function isImageFile(name: string): boolean {
  return IMAGE_EXT.test(name);
}

function walkFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const child = join(dir, entry.name);
    if (entry.isDirectory()) return walkFiles(child);
    return [child];
  });
}

/** git tracked 的 public/ 圖片（部署資產）。 */
export function listDeployedImagePaths(root: string): string[] {
  let tracked: string[] = [];
  try {
    const out = execFileSync("git", ["ls-files", "public"], {
      cwd: root,
      encoding: "utf8",
    });
    tracked = out
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && isImageFile(line));
  } catch {
    tracked = walkFiles(join(root, "public"))
      .map((abs) => relative(root, abs).replaceAll("\\", "/"))
      .filter(isImageFile);
  }
  return tracked.sort();
}

/** staging／gitignore 目錄內圖片（存在才計）。 */
export function listStagingImagePaths(root: string): { path: string; dir: string }[] {
  const results: { path: string; dir: string }[] = [];
  for (const dir of STAGING_DIRS) {
    const abs = join(root, dir);
    for (const file of walkFiles(abs)) {
      if (!isImageFile(file)) continue;
      results.push({
        path: relative(root, file).replaceAll("\\", "/"),
        dir,
      });
    }
  }
  return results.sort((a, b) => a.path.localeCompare(b.path));
}

function parseSrcSetUrls(srcSet: string): string[] {
  return srcSet
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0] ?? "")
    .filter((url) => url.startsWith("/"));
}

function addSrcSetPaths(bucket: Set<string>, src: string, srcSet: string, webpSrc: string, webpSrcSet: string): void {
  bucket.add(src);
  bucket.add(webpSrc);
  for (const url of [...parseSrcSetUrls(srcSet), ...parseSrcSetUrls(webpSrcSet)]) {
    bucket.add(url);
  }
}

/** 由資料層與 resolver 推導的引用路徑（動態）。 */
export function collectDynamicReferencePaths(): string[] {
  const refs = new Set<string>(STATIC_PUBLIC_ASSETS);

  for (const story of getStories()) {
    for (let page = 1; page <= story.pageCount; page++) {
      refs.add(storyCoverPath(story.slug, page));
    }
    refs.add(storyCoverPath(story.slug));
  }

  for (const seg of LANDING_SEGMENTS) {
    refs.add(seg.heroImage);
    refs.add(seg.heroImagePortrait);
  }
  refs.add(LANDING_CLAY_EXTERNAL.image);

  for (const emotion of DUDU_EMOTIONS) {
    refs.add(emotionSrc(emotion));
  }

  for (const id of ZONE_IDS) {
    addSrcSetPaths(refs, ...Object.values(getZoneArtSrcSet(id)) as [string, string, string, string]);
    const night = getZoneNightArtSrcSet(id);
    if (night) {
      addSrcSetPaths(refs, night.src, night.srcSet, night.webpSrc, night.webpSrcSet);
    }
  }

  refs.add(seaTexturePath(false));
  refs.add(seaTexturePath(true));
  refs.add(pngToWebp(seaTexturePath(false)));
  refs.add(pngToWebp(seaTexturePath(true)));
  refs.add(sunPath());
  refs.add(sunWebpPath());
  refs.add(moonPath());
  refs.add(moonWebpPath());
  for (const cloudId of CLOUD_IDS) {
    refs.add(cloudPath(cloudId));
    refs.add(pngToWebp(cloudPath(cloudId)));
  }

  for (const roamer of MAP_ROAMERS) {
    refs.add(roamer.src);
    if (roamer.sprites) {
      for (const sprite of Object.values(roamer.sprites)) {
        if (sprite) refs.add(sprite);
      }
    }
  }

  for (const parts of Object.values(ZONE_MOTION)) {
    if (!parts) continue;
    for (const part of parts) {
      refs.add(part.src);
      if (part.srcNight) refs.add(part.srcNight);
    }
  }

  for (const row of charactersJson as { ref?: string }[]) {
    if (row.ref) refs.add(`/${row.ref.replace(/^\//, "")}`);
  }

  return [...refs].sort();
}

/** 掃描原始碼中的字面量 `/…圖檔` 路徑（補充動態推導未涵蓋者）。 */
export function collectStaticSourceReferencePaths(root: string): string[] {
  const pattern = /["'`](\/[^"'` ]+\.(?:jpe?g|png|webp|gif|svg|avif))["'`]/gi;
  const refs = new Set<string>();

  const walkSource = (dir: string): void => {
    if (!existsSync(dir)) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const child = join(dir, entry.name);
      if (entry.isDirectory()) {
        walkSource(child);
        continue;
      }
      if (!/\.(tsx?|css|json)$/.test(entry.name)) continue;
      const text = readFileSync(child, "utf8");
      for (const match of text.matchAll(pattern)) {
        refs.add(match[1]!);
      }
    }
  };

  for (const dir of SOURCE_SCAN_DIRS) {
    walkSource(join(root, dir));
  }

  return [...refs].sort();
}

function isStoryIllustrationPath(path: string): boolean {
  return /^public\/stories\/[^/]+\/\d+\.jpg$/i.test(path);
}

export function auditAssets(root: string): AuditAssetsReport {
  const deployedPaths = listDeployedImagePaths(root);
  const stagingEntries = listStagingImagePaths(root);
  const dynamicPaths = collectDynamicReferencePaths();
  const staticPaths = collectStaticSourceReferencePaths(root);
  const referenced = new Set([...dynamicPaths, ...staticPaths]);

  const deployedUrls = deployedPaths.map((p) => diskPathToPublicUrl(join(root, p), root));
  const orphans = deployedUrls.filter((url) => !referenced.has(url)).sort();

  const largeJpgs: LargeFileEntry[] = [];
  let jpgCount = 0;
  let storyIllustrationCount = 0;

  for (const rel of deployedPaths) {
    if (/\.jpe?g$/i.test(rel)) {
      jpgCount++;
      if (isStoryIllustrationPath(rel)) storyIllustrationCount++;
      const abs = join(root, rel);
      const bytes = statSync(abs).size;
      if (bytes > MAX_JPG_BYTES) {
        largeJpgs.push({ path: rel, bytes });
      }
    }
  }

  const stagingByDir: Record<string, number> = {};
  for (const entry of stagingEntries) {
    stagingByDir[entry.dir] = (stagingByDir[entry.dir] ?? 0) + 1;
  }

  return {
    deployed: {
      imageCount: deployedPaths.length,
      jpgCount,
      storyIllustrationCount,
      largeJpgs: largeJpgs.sort((a, b) => b.bytes - a.bytes),
    },
    staging: {
      imageCount: stagingEntries.length,
      byDir: stagingByDir,
    },
    dynamic: {
      referenceCount: dynamicPaths.length,
      paths: dynamicPaths,
    },
    orphans: {
      count: orphans.length,
      paths: orphans,
    },
  };
}

export function formatAuditReport(report: AuditAssetsReport): string {
  const lines = [
    "=== D0 資產稽核 ===",
    "",
    `[1] 部署資產（git tracked）: ${report.deployed.imageCount} 張圖`,
    `    JPG: ${report.deployed.jpgCount}（故事插圖 ${report.deployed.storyIllustrationCount}）`,
    `    超大 JPG (>${MAX_JPG_BYTES} bytes): ${report.deployed.largeJpgs.length}`,
    "",
    `[2] staging／gitignore: ${report.staging.imageCount} 張`,
    ...Object.entries(report.staging.byDir).map(([dir, n]) => `    ${dir}: ${n}`),
    "",
    `[3] 動態推導引用: ${report.dynamic.referenceCount} 條路徑`,
    "",
    `[4] 孤兒資產（tracked 但未引用）: ${report.orphans.count}`,
  ];

  if (report.deployed.largeJpgs.length > 0) {
    lines.push("", "— 超大 JPG —");
    for (const entry of report.deployed.largeJpgs.slice(0, 20)) {
      lines.push(`  ${entry.path} (${Math.round(entry.bytes / 1024)} KB)`);
    }
    if (report.deployed.largeJpgs.length > 20) {
      lines.push(`  …另有 ${report.deployed.largeJpgs.length - 20} 檔`);
    }
  }

  if (report.orphans.count > 0) {
    lines.push("", "— 孤兒（前 15）—");
    for (const path of report.orphans.paths.slice(0, 15)) {
      lines.push(`  ${path}`);
    }
    if (report.orphans.count > 15) {
      lines.push(`  …另有 ${report.orphans.count - 15} 條`);
    }
  }

  return lines.join("\n");
}
