#!/usr/bin/env npx tsx
/**
 * 把方格子作者「車車遊樂園」的新公開文收進 `data/parent-articles.ts`。
 *
 * 列表：`GET https://api.vocus.cc/api/contents`（作者頁 __NEXT_DATA__ 用的同一支查詢）。
 * 已收錄以 `sourceUrl` 比對。新文附加在 `PARENT_ARTICLES` 末端。
 *
 * 用法：
 *   npm run sync:vocus -- --dry-run
 *   npm run sync:vocus
 *   npm run sync:vocus -- --report /tmp/vocus-sync-report.json
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PARENT_ARTICLES, type ParentArticle, type ParentArticleBlock } from "../data/parent-articles";
import {
  appendParentArticleSource,
  articleFromVocusPost,
  parseContentsPage,
  selectPostsToAppend,
  vocusContentsUrl,
  type VocusListItem,
} from "./lib/vocus-articles";

const USER_AGENT =
  "podcast-website-vocus-sync/1.0 (low-frequency parent-article mirror; one creator)";

const PAGE_SIZE = 10;
const MAX_PAGES = 20;
const PAGE_DELAY_MS = 800;
const IMAGE_MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DATA_FILE = path.join(ROOT, "data", "parent-articles.ts");
const IMAGE_DIR = path.join(ROOT, "public", "parent-articles");

type AddedArticle = {
  title: string;
  slug: string;
  sourceUrl: string;
  publishedAt: string;
  blockCount: number;
  imageCount: number;
};

type SyncReport = {
  dryRun: boolean;
  listed: number;
  added: AddedArticle[];
  skippedExisting: number;
  skippedUnpublished: number;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`方格子列表 HTTP ${response.status}：${url}`);
  }
  return response.json() as Promise<unknown>;
}

async function listAllPosts(): Promise<{ listed: number; items: VocusListItem[] }> {
  const items: VocusListItem[] = [];
  let listed = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    if (page > 1) await sleep(PAGE_DELAY_MS);
    const payload = await fetchJson(vocusContentsUrl(page, PAGE_SIZE));
    const parsed = parseContentsPage(payload);
    listed = parsed.count;
    if (parsed.items.length === 0) break;
    items.push(...parsed.items);
    if (items.length >= parsed.count || parsed.items.length < PAGE_SIZE) break;
  }
  return { listed, items };
}

async function downloadWebp(
  url: string,
  destPath: string,
): Promise<{ width: number; height: number }> {
  const response = await fetch(url, {
    headers: {
      Accept: "image/*",
      "User-Agent": USER_AGENT,
    },
  });
  if (!response.ok) {
    throw new Error(`圖片 HTTP ${response.status}：${url}`);
  }
  const input = Buffer.from(await response.arrayBuffer());
  const meta = await sharp(input).metadata();
  let pipeline = sharp(input, { animated: false }).rotate();
  if ((meta.width ?? 0) > IMAGE_MAX_WIDTH) {
    pipeline = pipeline.resize({ width: IMAGE_MAX_WIDTH, withoutEnlargement: true });
  }
  const output = await pipeline.webp({ quality: WEBP_QUALITY, effort: 4 }).toBuffer();
  const saved = await sharp(output).metadata();
  const width = saved.width ?? 0;
  const height = saved.height ?? 0;
  if (width <= 0 || height <= 0) {
    throw new Error(`圖片沒有尺寸：${url}`);
  }
  await mkdir(path.dirname(destPath), { recursive: true });
  await writeFile(destPath, output);
  return { width, height };
}

async function materializeImages(
  article: ParentArticle,
  ogImageURL: string | null,
  dryRun: boolean,
): Promise<ParentArticle> {
  const locals = new Map<string, { src: string; width: number; height: number }>();
  let index = 0;
  const blocks: ParentArticleBlock[] = [];
  for (const block of article.blocks) {
    if (block.type !== "image") {
      blocks.push(block);
      continue;
    }
    if (!block.src.startsWith("https://")) {
      throw new Error(`不收下非 https 圖片：${block.src}`);
    }
    index += 1;
    const filename = `${article.slug}-${index}.webp`;
    const publicSrc = `/parent-articles/${filename}`;
    let saved = locals.get(block.src);
    if (!saved) {
      saved = dryRun
        ? { src: publicSrc, width: block.width || 1, height: block.height || 1 }
        : {
            src: publicSrc,
            ...(await downloadWebp(block.src, path.join(IMAGE_DIR, filename))),
          };
      locals.set(block.src, saved);
    }
    blocks.push({
      type: "image",
      src: saved.src,
      alt: block.alt,
      width: saved.width,
      height: saved.height,
    });
  }

  let coverImage = article.coverImage;
  let coverAlt = article.coverAlt;
  if (ogImageURL) {
    const filename = `${article.slug}-cover.webp`;
    if (!dryRun) {
      await downloadWebp(ogImageURL, path.join(IMAGE_DIR, filename));
    }
    coverImage = `/parent-articles/${filename}`;
    coverAlt = article.title;
  }

  return {
    ...article,
    ...(coverImage ? { coverImage } : {}),
    ...(coverAlt ? { coverAlt } : {}),
    blocks,
  };
}

function printReport(report: SyncReport): void {
  if (report.added.length === 0) {
    console.log(
      `沒有新文。列表 ${report.listed} 篇，已收錄略過 ${report.skippedExisting}，未公開略過 ${report.skippedUnpublished}。`,
    );
    return;
  }
  const mode = report.dryRun ? "dry-run，尚未寫入" : "已寫入";
  console.log(`${mode} ${report.added.length} 篇：`);
  for (const article of report.added) {
    console.log(
      `- ${article.publishedAt} ${article.title}\n  ${article.sourceUrl}\n  slug ${article.slug}，${article.blockCount} 個 blocks，${article.imageCount} 張圖`,
    );
  }
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes("--dry-run");
  const reportFlag = process.argv.indexOf("--report");
  const reportPath = reportFlag >= 0 ? process.argv[reportFlag + 1] : undefined;
  if (reportFlag >= 0 && !reportPath) {
    throw new Error("--report 需要檔案路徑");
  }

  const { listed, items } = await listAllPosts();
  const existingUrls = new Set(PARENT_ARTICLES.map((article) => article.sourceUrl));
  const { posts, skippedExisting, skippedUnpublished } = selectPostsToAppend(
    items,
    existingUrls,
  );
  const slugs = new Set(PARENT_ARTICLES.map((article) => article.slug));
  const built: ParentArticle[] = [];
  for (const post of posts) {
    const draft = articleFromVocusPost(post, slugs);
    if (draft.blocks.length === 0 || draft.excerpt.length === 0) {
      throw new Error(`「${draft.title}」沒有可收錄的段落，停止寫入`);
    }
    slugs.add(draft.slug);
    built.push(await materializeImages(draft, post.ogImageURL, dryRun));
  }

  if (!dryRun && built.length > 0) {
    const source = await readFile(DATA_FILE, "utf8");
    const next = appendParentArticleSource(source, built);
    if (next === source) {
      throw new Error("選到新文，但資料檔沒有變更");
    }
    await writeFile(DATA_FILE, next);
  }

  const report: SyncReport = {
    dryRun,
    listed,
    skippedExisting,
    skippedUnpublished,
    added: built.map((article) => ({
      title: article.title,
      slug: article.slug,
      sourceUrl: article.sourceUrl,
      publishedAt: article.publishedAt,
      blockCount: article.blocks.length,
      imageCount: article.blocks.filter((block) => block.type === "image").length,
    })),
  };
  printReport(report);
  if (reportPath) {
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
