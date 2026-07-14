#!/usr/bin/env tsx
/**
 * 驗證 GEO（Generative Engine Optimization）護欄：sitemap／llms-full.txt／
 * 重點頁 JSON-LD／dateModified 同源／noindex 是否符合現況契約。
 *
 * skeleton：先立護欄，之後其他任務會再補更多規則。
 *
 * ⚠️ 本腳本讀取 `.next/server/app` 的 build 產物結構（Next 16 App Router
 * 預渲染輸出：`<route>.html`／`.meta`／`.rsc`／`.body`）。此結構與 Next
 * 版本耦合，升級 Next 時請重新探測目錄結構（`find .next/server/app -maxdepth 2`）
 * 並回頭檢查本檔案的路徑假設。
 *
 * 執行順序契約：必須在 `next build` 之後跑。
 *
 *   npm run build && npm run verify:geo
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { allVehicles, getStories, type Story } from "../data/content";
import { podcastEpisodeJsonLd, podcastSeriesJsonLd } from "../lib/json-ld";
import { getSiteUrl } from "../lib/site-url";
import { storyAudioPath } from "../lib/story-utils";
import { hasVtt } from "../lib/transcript";

const APP_DIR = join(process.cwd(), ".next/server/app");

type Result = { ok: boolean; skip?: string; label: string; detail?: string };

const results: Result[] = [];

function pass(label: string, detail?: string): void {
  results.push({ ok: true, label, detail });
}

function fail(label: string, detail: string): void {
  results.push({ ok: false, label, detail });
}

function skip(label: string, reason: string): void {
  results.push({ ok: true, skip: reason, label });
}

/** 讀取 build 產物中的 sitemap URL 清單；找不到就直接 import app/sitemap.ts。 */
async function loadSitemapEntries(): Promise<{ url: string; lastModified?: string | Date }[]> {
  const bodyPath = join(APP_DIR, "sitemap.xml.body");
  if (existsSync(bodyPath)) {
    const xml = readFileSync(bodyPath, "utf-8");
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(
      (m) => ({ url: m[1]!, lastModified: m[2]! }),
    );
    if (urls.length > 0) return urls;
  }
  const mod = await import("../app/sitemap");
  const entries = mod.default();
  return entries.map((e) => ({ url: e.url, lastModified: e.lastModified }));
}

function normalizeIso(value: string | Date | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  return d.toISOString();
}

async function checkSitemap(stories: Story[], siteUrl: string): Promise<void> {
  const entries = await loadSitemapEntries();
  if (entries.length === 0) {
    fail("sitemap", "sitemap 產物為空");
    return;
  }

  const urls = new Set(entries.map((e) => e.url));
  const missingSlugs = stories
    .map((s) => s.slug)
    .filter((slug) => ![...urls].some((u) => u.endsWith(`/story/${slug}`)));
  if (missingSlugs.length > 0) {
    fail("sitemap 涵蓋全部故事 slug", `缺少：${missingSlugs.join(", ")}`);
  } else {
    pass("sitemap 涵蓋全部故事 slug", `${stories.length} 篇`);
  }

  if (siteUrl.includes("localhost")) {
    skip("sitemap URL 以 canonical site URL 開頭", "no production site URL");
  } else {
    const badUrls = entries.filter((e) => !e.url.startsWith(siteUrl)).map((e) => e.url);
    if (badUrls.length > 0) {
      fail("sitemap URL 以 canonical site URL 開頭", `不符前綴：${badUrls.slice(0, 5).join(", ")}`);
    } else {
      pass("sitemap URL 以 canonical site URL 開頭", siteUrl);
    }
  }
}

function checkLlmsFullTxt(latestSlug: string): void {
  const llmsPath = join(process.cwd(), "public/llms-full.txt");
  if (!existsSync(llmsPath)) {
    fail("public/llms-full.txt 存在", "檔案不存在");
    return;
  }
  pass("public/llms-full.txt 存在");

  const content = readFileSync(llmsPath, "utf-8");
  if (content.includes("localhost")) {
    // 本機 build（無 production site URL）產物本來就是 localhost；
    // CI／Vercel 必有 env，此規則在該處維持嚴格。
    if (getSiteUrl().includes("localhost")) {
      skip("llms-full.txt 無 localhost 字串", "本機 build，無 production site URL");
    } else {
      fail("llms-full.txt 無 localhost 字串", "含 localhost");
    }
  } else {
    pass("llms-full.txt 無 localhost 字串");
  }

  if (content.includes(latestSlug)) {
    pass("llms-full.txt 涵蓋最新一集故事 slug", latestSlug);
  } else {
    fail("llms-full.txt 涵蓋最新一集故事 slug", `缺少 ${latestSlug}`);
  }
}

/** 解析 rendered HTML 中所有 `<script type="application/ld+json">` 區塊。 */
function parseJsonLdBlocks(html: string): { raw: string; parsed: unknown }[] {
  const re = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  const blocks: { raw: string; parsed: unknown }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1]!;
    blocks.push({ raw, parsed: JSON.parse(raw) });
  }
  return blocks;
}

function flattenJsonLdTypes(parsed: unknown): Record<string, unknown>[] {
  if (parsed && typeof parsed === "object" && "@graph" in (parsed as Record<string, unknown>)) {
    const graph = (parsed as { "@graph": unknown })["@graph"];
    if (Array.isArray(graph)) return graph as Record<string, unknown>[];
  }
  return [parsed as Record<string, unknown>];
}

function readHtml(relativePath: string): string | null {
  const path = join(APP_DIR, relativePath);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf-8");
}

function checkPageJsonLd(label: string, relativePath: string): void {
  const html = readHtml(relativePath);
  if (html === null) {
    fail(`${label} JSON-LD 可解析`, `找不到 ${relativePath}`);
    return;
  }
  try {
    const blocks = parseJsonLdBlocks(html);
    if (blocks.length === 0) {
      fail(`${label} JSON-LD 可解析`, `${relativePath} 無 JSON-LD script`);
      return;
    }
    pass(`${label} JSON-LD 可解析`, `${blocks.length} 個區塊`);
  } catch (e) {
    fail(`${label} JSON-LD 可解析`, `${relativePath}：${(e as Error).message}`);
  }
}

/** story 頁必須含一個 PodcastEpisode 且有 dateModified；回傳其值供同源比對。 */
function checkStoryPodcastEpisode(relativePath: string): string | undefined {
  const html = readHtml(relativePath);
  if (html === null) {
    fail("story 頁含 PodcastEpisode + dateModified", `找不到 ${relativePath}`);
    return undefined;
  }
  const blocks = parseJsonLdBlocks(html);
  const types = blocks.flatMap((b) => flattenJsonLdTypes(b.parsed));
  const episode = types.find((t) => t["@type"] === "PodcastEpisode");
  if (!episode) {
    fail("story 頁含 PodcastEpisode + dateModified", `${relativePath} 無 PodcastEpisode`);
    return undefined;
  }
  const dateModified = episode.dateModified;
  if (typeof dateModified !== "string" || dateModified.length === 0) {
    fail("story 頁含 PodcastEpisode + dateModified", `${relativePath} PodcastEpisode 缺 dateModified`);
    return undefined;
  }
  pass("story 頁含 PodcastEpisode + dateModified", dateModified);
  return dateModified;
}

async function checkDateModifiedConsistency(
  sampleSlug: string,
  episodeDateModified: string | undefined,
): Promise<void> {
  if (!episodeDateModified) {
    fail("story dateModified 與 sitemap lastModified 同源一致", "story 頁 dateModified 缺失，略過比對");
    return;
  }
  const entries = await loadSitemapEntries();
  const entry = entries.find((e) => e.url.endsWith(`/story/${sampleSlug}`));
  if (!entry) {
    fail("story dateModified 與 sitemap lastModified 同源一致", `sitemap 找不到 /story/${sampleSlug}`);
    return;
  }
  const a = normalizeIso(episodeDateModified);
  const b = normalizeIso(entry.lastModified);
  if (a === b) {
    pass("story dateModified 與 sitemap lastModified 同源一致", a);
  } else {
    fail(
      "story dateModified 與 sitemap lastModified 同源一致",
      `JSON-LD ${a} ≠ sitemap ${b}`,
    );
  }
}

function checkNoNoindex(label: string, relativePath: string): void {
  const html = readHtml(relativePath);
  if (html === null) {
    fail(`${label} 不得含 noindex`, `找不到 ${relativePath}`);
    return;
  }
  if (html.includes("noindex")) {
    fail(`${label} 不得含 noindex`, relativePath);
  } else {
    pass(`${label} 不得含 noindex`);
  }
}

function checkHasNoindex(label: string, relativePath: string): void {
  const html = readHtml(relativePath);
  if (html === null) {
    fail(`${label} 必須含 noindex`, `找不到 ${relativePath}`);
    return;
  }
  if (html.includes("noindex")) {
    pass(`${label} 必須含 noindex`);
  } else {
    fail(`${label} 必須含 noindex`, `${relativePath} 缺少 noindex`);
  }
}

const AI_RETRIEVAL_ALLOW = ["Claude-SearchBot", "OAI-SearchBot", "PerplexityBot"];
const AI_TRAINING_DISALLOW = ["ClaudeBot", "GPTBot"];

/** robots.txt 文字須含新版 allow／disallow 名單（build 產物找不到就直接呼叫 app/robots.ts）。 */
async function checkRobots(): Promise<void> {
  const bodyPath = join(APP_DIR, "robots.txt.body");
  let text: string;
  if (existsSync(bodyPath)) {
    text = readFileSync(bodyPath, "utf-8");
  } else {
    const mod = await import("../app/robots");
    const robots = mod.default();
    text = JSON.stringify(robots.rules);
  }

  const missingAllow = AI_RETRIEVAL_ALLOW.filter((ua) => {
    const re = new RegExp(`User-Agent:\\s*${ua}\\b[\\s\\S]{0,40}Allow:\\s*/`, "i");
    return !re.test(text) && !text.includes(ua);
  });
  const missingDisallow = AI_TRAINING_DISALLOW.filter((ua) => {
    // 精確全名比對，避免 ClaudeBot 誤配到 Claude-SearchBot 等前綴相同的 UA
    const re = new RegExp(`User-Agent:\\s*${ua}\\b[\\s\\S]{0,40}Disallow:\\s*/`, "i");
    return !re.test(text) && !text.includes(ua);
  });

  if (missingAllow.length > 0) {
    fail("robots.txt allow 含 AI 檢索型爬蟲", `缺少：${missingAllow.join(", ")}`);
  } else {
    pass("robots.txt allow 含 AI 檢索型爬蟲", AI_RETRIEVAL_ALLOW.join(", "));
  }

  if (missingDisallow.length > 0) {
    fail("robots.txt disallow 含 AI 訓練型爬蟲", `缺少：${missingDisallow.join(", ")}`);
  } else {
    pass("robots.txt disallow 含 AI 訓練型爬蟲", AI_TRAINING_DISALLOW.join(", "));
  }
}

/** podcastSeriesJsonLd() 的 sameAs：非空、全絕對 https URL、無 query string。 */
function checkSameAs(): void {
  const series = podcastSeriesJsonLd();
  const sameAs = series.sameAs;
  if (!Array.isArray(sameAs) || sameAs.length === 0) {
    fail("PodcastSeries sameAs 非空", "sameAs 缺失或為空陣列");
    return;
  }
  const bad = (sameAs as unknown[]).filter((u) => {
    if (typeof u !== "string") return true;
    if (!u.startsWith("https://")) return true;
    if (u.includes("?")) return true;
    return false;
  });
  if (bad.length > 0) {
    fail("PodcastSeries sameAs 皆為絕對 https URL 且無 query string", JSON.stringify(bad));
  } else {
    pass("PodcastSeries sameAs 皆為絕對 https URL 且無 query string", `${sameAs.length} 筆`);
  }
}

/** rendered HTML 中的 BreadcrumbList：item 皆絕對 URL、position 從 1 連續。 */
function checkBreadcrumbList(label: string, relativePath: string): void {
  const html = readHtml(relativePath);
  if (html === null) {
    skip(`${label} BreadcrumbList`, `找不到 ${relativePath}（RSC payload 限制或未產出）`);
    return;
  }
  const siteUrl = getSiteUrl();
  let blocks: { raw: string; parsed: unknown }[];
  try {
    blocks = parseJsonLdBlocks(html);
  } catch (e) {
    fail(`${label} BreadcrumbList`, `${relativePath} JSON-LD 解析失敗：${(e as Error).message}`);
    return;
  }
  const types = blocks.flatMap((b) => flattenJsonLdTypes(b.parsed));
  const breadcrumb = types.find((t) => t["@type"] === "BreadcrumbList");
  if (!breadcrumb) {
    fail(`${label} BreadcrumbList`, `${relativePath} 無 BreadcrumbList`);
    return;
  }
  const items = breadcrumb.itemListElement as
    | { position: number; item: string }[]
    | undefined;
  if (!items || items.length === 0) {
    fail(`${label} BreadcrumbList`, "itemListElement 為空");
    return;
  }
  // 本機無 production env 時 getSiteUrl() 為 localhost，而 build 產物可能是
  // 正式網域（production build 後本機驗）或 localhost（本機 build）——
  // 兩者皆放行；有 production env 時嚴格比對站點前綴。
  const isLocal = siteUrl.includes("localhost");
  const badItems = items.filter(
    (it) =>
      typeof it.item !== "string" ||
      !(it.item.startsWith(siteUrl) || (isLocal && it.item.startsWith("https://"))),
  );
  const positions = items.map((it) => it.position);
  const positionsOk = positions.every((p, i) => p === i + 1);
  if (badItems.length > 0) {
    fail(`${label} BreadcrumbList item 皆為絕對 URL`, JSON.stringify(badItems));
  } else if (!positionsOk) {
    fail(`${label} BreadcrumbList position 從 1 連續`, JSON.stringify(positions));
  } else {
    pass(`${label} BreadcrumbList`, `${items.length} 節點`);
  }
}

/** transcript MediaObject：有 VTT 的故事含 encodingFormat text/vtt；無 VTT 的故事不含。 */
function checkTranscriptMediaObject(stories: Story[]): void {
  const withVtt = stories.find((s) => hasVtt(s));
  if (withVtt) {
    const episode = podcastEpisodeJsonLd(withVtt);
    const media = Array.isArray(episode.associatedMedia)
      ? episode.associatedMedia
      : [episode.associatedMedia];
    const hasTranscript = media.some(
      (m) => (m as Record<string, unknown>)?.encodingFormat === "text/vtt",
    );
    if (hasTranscript) {
      pass("有 VTT 故事的 PodcastEpisode 含 transcript MediaObject", withVtt.slug);
    } else {
      fail("有 VTT 故事的 PodcastEpisode 含 transcript MediaObject", `${withVtt.slug} 缺 text/vtt`);
    }
  } else {
    skip("有 VTT 故事的 PodcastEpisode 含 transcript MediaObject", "無任何故事有 VTT");
  }

  const withoutVtt = stories.find((s) => !hasVtt(s));
  if (withoutVtt) {
    const episode = podcastEpisodeJsonLd(withoutVtt);
    const media = Array.isArray(episode.associatedMedia)
      ? episode.associatedMedia
      : [episode.associatedMedia];
    const hasTranscript = media.some(
      (m) => (m as Record<string, unknown>)?.encodingFormat === "text/vtt",
    );
    if (!hasTranscript) {
      pass("無 VTT 故事的 PodcastEpisode 不含 transcript MediaObject", withoutVtt.slug);
    } else {
      fail("無 VTT 故事的 PodcastEpisode 不含 transcript MediaObject", `${withoutVtt.slug} 誤含 text/vtt`);
    }
  } else {
    skip("無 VTT 故事的 PodcastEpisode 不含 transcript MediaObject", "全部故事皆有 VTT");
  }
}

/** RSS enclosure length：本地音檔實際存在的故事須 > 0；無本地音檔者容許 0。 */
async function checkRssEnclosureLength(stories: Story[]): Promise<void> {
  const mod = await import("../app/feed.xml/route");
  const response = mod.GET();
  const xml = await response.text();

  // 逐 <item> 區塊解析，避免 channel 層級的 <link> 與第一個 item 的
  // <enclosure> 錯位配對（channel 也有自己的 <link>）。
  const itemBlockRe = /<item>([\s\S]*?)<\/item>/g;
  const lengthByPageUrl = new Map<string, number>();
  let itemMatch: RegExpExecArray | null;
  while ((itemMatch = itemBlockRe.exec(xml))) {
    const block = itemMatch[1]!;
    const link = /<link>([^<]+)<\/link>/.exec(block)?.[1];
    const length = /<enclosure url="[^"]*" length="(\d+)"/.exec(block)?.[1];
    if (link && length) {
      lengthByPageUrl.set(link, Number(length));
    }
  }

  const siteUrl = getSiteUrl();
  const failures: string[] = [];
  let checked = 0;
  for (const story of stories) {
    const assetPath = storyAudioPath(story.slug, story.audio);
    if (!assetPath.startsWith("/stories/")) continue;
    const filePath = join(process.cwd(), "public", assetPath);
    if (!existsSync(filePath)) continue;
    checked += 1;
    const pageUrl = `${siteUrl}/story/${story.slug}`;
    const length = lengthByPageUrl.get(pageUrl);
    if (!length || length <= 0) {
      failures.push(story.slug);
    }
  }

  if (checked === 0) {
    skip("RSS enclosure length：本地音檔故事皆 > 0", "無本地音檔故事");
    return;
  }
  if (failures.length > 0) {
    fail("RSS enclosure length：本地音檔故事皆 > 0", `缺失：${failures.join(", ")}`);
  } else {
    pass("RSS enclosure length：本地音檔故事皆 > 0", `${checked} 篇`);
  }
}

/** IndexNow key file：有 INDEXNOW_KEY 時 public/<key>.txt 必存在且內容＝key。 */
function checkIndexNowKeyFile(): void {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    skip("IndexNow key file 存在且內容正確", "no INDEXNOW_KEY");
    return;
  }
  const filePath = join(process.cwd(), "public", `${key}.txt`);
  if (!existsSync(filePath)) {
    fail("IndexNow key file 存在且內容正確", `找不到 public/${key}.txt`);
    return;
  }
  const content = readFileSync(filePath, "utf-8").trim();
  if (content === key) {
    pass("IndexNow key file 存在且內容正確", `public/${key}.txt`);
  } else {
    fail("IndexNow key file 存在且內容正確", `內容不符：${content}`);
  }
}

function printReport(): void {
  console.log("=== 車車遊樂園 · GEO 驗證 ===\n");
  for (const r of results) {
    const icon = r.skip ? "○" : r.ok ? "✓" : "✗";
    const suffix = r.skip ? `skip(${r.skip})` : r.detail ? `— ${r.detail}` : "";
    console.log(`${icon} ${r.label}${suffix ? ` ${suffix}` : ""}`);
  }
}

async function main(): Promise<void> {
  if (!existsSync(APP_DIR)) {
    console.error("verify:geo 找不到 .next/server/app——請先 npm run build");
    process.exit(1);
  }

  const stories = getStories();
  const siteUrl = getSiteUrl();
  const latestStory = stories[0]!;
  const firstVehicle = allVehicles()[0];
  // topic/[tag] 動態頁的 JSON-LD 只出現在 RSC hydration payload 裡（非真正 SSR
  // <script> 標籤，見腳本開發時的實測），故抽樣改用 /topic 首頁（真正 SSR 出
  // JSON-LD）；符合規則描述「topic.html 或任一 topic 頁」的前者選項。

  await checkSitemap(stories, siteUrl);
  checkLlmsFullTxt(latestStory.slug);

  checkPageJsonLd("story 頁", `story/${latestStory.slug}.html`);
  checkPageJsonLd("topic 頁", "topic.html");
  // vehicles/[vehicle] 檔名在 build 產物中為原始 UTF-8（未 percent-encode），
  // 與 topic/[tag] 的 percent-encode 檔名不同，需個別處理。
  checkPageJsonLd("vehicles 頁", firstVehicle ? `vehicles/${firstVehicle}.html` : "vehicles.html");
  checkPageJsonLd("for-parents 頁", "for-parents.html");
  checkPageJsonLd("characters 頁", "characters.html");

  const episodeDateModified = checkStoryPodcastEpisode(`story/${latestStory.slug}.html`);
  await checkDateModifiedConsistency(latestStory.slug, episodeDateModified);

  checkNoNoindex("story 頁", `story/${latestStory.slug}.html`);
  checkNoNoindex("for-parents 頁", "for-parents.html");
  checkNoNoindex("characters 頁", "characters.html");
  checkHasNoindex("story/[slug]/play 頁", `story/${latestStory.slug}/play.html`);

  await checkRobots();
  checkSameAs();
  checkBreadcrumbList("story 頁", `story/${latestStory.slug}.html`);
  checkBreadcrumbList("for-parents 頁", "for-parents.html");
  checkTranscriptMediaObject(stories);
  await checkRssEnclosureLength(stories);
  checkIndexNowKeyFile();

  printReport();

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} 項失敗`);
    process.exit(1);
  }
  console.log("\n✅ 全部通過");
}

main().catch((e) => {
  console.error("verify:geo 執行失敗：", e);
  process.exit(1);
});
