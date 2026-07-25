#!/usr/bin/env tsx
/**
 * 驗證 GEO（Generative Engine Optimization）護欄：sitemap／llms-full.txt／
 * 全量故事／聚合頁／靜態頁 JSON-LD／dateModified 同源／robots 精確 UA／noindex。
 *
 * ⚠️ 本腳本讀取 `.next/server/app` 的 build 產物結構（Next App Router
 * 預渲染輸出：`<route>.html`／`.meta`／`.rsc`／`.body`）。升級 Next 時請
 * 重新探測目錄結構並回頭檢查路徑假設。
 *
 * 執行順序契約：必須在 `next build` 之後跑。
 *
 *   npm run build && npm run verify:geo
 *
 * robots 結構化規則另可由 vitest（`lib/robots-policy.test.ts`）覆蓋，無需 build。
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allTags,
  allVehicles,
  getStories,
  getStoriesByTag,
  getStoriesByVehicle,
  type Story,
} from "../data/content";
import { storyDateModified } from "../data/story-dates";
import { episodeFaqCoverage, listEpisodeFaqSlugs } from "../data/episode-faqs";
import { universe } from "../data/universe";
import { podcastSeriesJsonLd } from "../lib/json-ld";
import {
  AI_RETRIEVAL_CRAWLERS,
  AI_TRAINING_CRAWLERS,
  verifyRobotsPolicy,
} from "../lib/robots-policy";
import { getSiteUrl } from "../lib/site-url";
import { storyDefinitionSummary } from "../lib/story-geo";
import { storiesCatalogSummary } from "../lib/stories-geo";
import { storyAudioPath } from "../lib/story-utils";
import { topicDefinitionSummary } from "../lib/topic-geo";
import { topicIndexDefinitionSummary } from "../lib/topic-index-geo";
import { vehicleDefinitionSummary } from "../lib/vehicle-geo";
import {
  hasSceneCaptions,
  validateFullTranscript,
} from "../lib/transcript";

const APP_DIR = join(process.cwd(), ".next/server/app");

type Result = { ok: boolean; skip?: string; warn?: boolean; label: string; detail?: string };

type CoverageStats = {
  storiesTotal: number;
  storiesChecked: number;
  storyJsonLdValid: number;
  uniqueFaqCoverage: number;
  fullTranscriptCoverage: number;
  sceneCaptionOnly: number;
  topicPagesChecked: number;
  topicPagesTotal: number;
  vehiclePagesChecked: number;
  vehiclePagesTotal: number;
  missingFullTranscriptSlugs: string[];
  missingUniqueFaqSlugs: string[];
};

const results: Result[] = [];
const coverage: CoverageStats = {
  storiesTotal: 0,
  storiesChecked: 0,
  storyJsonLdValid: 0,
  uniqueFaqCoverage: 0,
  fullTranscriptCoverage: 0,
  sceneCaptionOnly: 0,
  topicPagesChecked: 0,
  topicPagesTotal: 0,
  vehiclePagesChecked: 0,
  vehiclePagesTotal: 0,
  missingFullTranscriptSlugs: [],
  missingUniqueFaqSlugs: [],
};

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

function pathnameFromUrl(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

function canonicalMatchesPath(canonicalHref: string, expectedPath: string): boolean {
  const path = pathnameFromUrl(canonicalHref);
  return path === expectedPath || path === decodeURIComponent(expectedPath);
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

  const openZones = universe.zones.filter((z) => z.status === "open");
  const missingOpenZones = openZones.filter(
    (z) => ![...urls].some((u) => u.endsWith(`/adventures/${z.id}`)),
  );
  const closedInSitemap = universe.zones
    .filter((z) => z.status !== "open")
    .filter((z) => [...urls].some((u) => u.endsWith(`/adventures/${z.id}`)));
  if (missingOpenZones.length > 0 || closedInSitemap.length > 0) {
    fail(
      "sitemap 涵蓋開放島且排除非開放島",
      [
        missingOpenZones.length
          ? `缺少開放島：${missingOpenZones.map((z) => z.id).join(", ")}`
          : "",
        closedInSitemap.length
          ? `不應出現：${closedInSitemap.map((z) => z.id).join(", ")}`
          : "",
      ]
        .filter(Boolean)
        .join("；"),
    );
  } else {
    pass("sitemap 涵蓋開放島且排除非開放島", `${openZones.length} 座開放島`);
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

/** 以場景檔的實際秒數驗證字幕 cue 不會落在音檔之外。 */
function sceneAudioDuration(slug: string): number | undefined {
  const path = join(process.cwd(), "data", "scenes", `${slug}.json`);
  if (!existsSync(path)) return undefined;
  try {
    const value = (JSON.parse(readFileSync(path, "utf-8")) as { audioDuration?: unknown })
      .audioDuration;
    return typeof value === "number" && Number.isFinite(value) && value > 0
      ? value
      : undefined;
  } catch {
    return undefined;
  }
}

function extractCanonicalHref(html: string): string | null {
  const m = html.match(/<link rel="canonical" href="([^"]+)"/);
  return m?.[1] ?? null;
}

function htmlHasNoindex(html: string): boolean {
  return html.includes("noindex");
}

function isNextErrorShell(html: string): boolean {
  return html.includes('id="__next_error__"');
}

function htmlContainsStoryCount(html: string, count: number): boolean {
  if (html.includes(`${count} 則故事`)) return true;
  return html.includes(`${count}<!-- --> 則故事`);
}

function episodeHasTranscriptMedia(episode: Record<string, unknown>): boolean {
  const media = episode.associatedMedia;
  const list = Array.isArray(media) ? media : media ? [media] : [];
  return list.some(
    (item) =>
      item &&
      typeof item === "object" &&
      (item as Record<string, unknown>).encodingFormat === "text/vtt",
  );
}

function urlPathMatchesStory(url: unknown, slug: string): boolean {
  if (typeof url !== "string") return false;
  return pathnameFromUrl(url).endsWith(`/story/${slug}`);
}

function visibleTextPresent(html: string, text: string, minChars = 24): boolean {
  const needle = Array.from(text.trim()).slice(0, minChars).join("");
  if (needle.length < 8) return html.includes(text.trim());
  return html.includes(needle);
}

function checkStoryPage(
  story: Story,
  sitemapByStory: Map<string, { url: string; lastModified?: string | Date }>,
): void {
  const rel = `story/${story.slug}.html`;
  const html = readHtml(rel);
  if (html === null) {
    fail(`story/${story.slug}`, "HTML 不存在");
    return;
  }
  if (isNextErrorShell(html)) {
    fail(`story/${story.slug}`, "build 產物為 Next error 頁——請重新 npm run build");
    return;
  }
  coverage.storiesChecked += 1;

  let blocks: { raw: string; parsed: unknown }[];
  try {
    blocks = parseJsonLdBlocks(html);
  } catch (e) {
    fail(`story/${story.slug} JSON-LD`, `解析失敗：${(e as Error).message}`);
    return;
  }

  if (blocks.length === 0) {
    fail(`story/${story.slug} JSON-LD`, "無 JSON-LD script");
    return;
  }

  const types = blocks.flatMap((b) => flattenJsonLdTypes(b.parsed));
  const episode = types.find((t) => t["@type"] === "PodcastEpisode");
  if (!episode) {
    fail(`story/${story.slug} PodcastEpisode`, "JSON-LD 缺 PodcastEpisode");
    return;
  }

  const faq = types.find((t) => t["@type"] === "FAQPage");
  if (!faq) {
    fail(`story/${story.slug} FAQPage`, "JSON-LD 缺 FAQPage");
    return;
  }

  coverage.storyJsonLdValid += 1;

  if (episode.name !== story.title) {
    fail(`story/${story.slug} name`, `JSON-LD「${String(episode.name)}」≠ 資料層 title`);
  }
  if (!urlPathMatchesStory(episode.url, story.slug)) {
    fail(`story/${story.slug} url`, `JSON-LD url 不符 /story/${story.slug}`);
  }
  if (episode.episodeNumber !== story.ep) {
    fail(
      `story/${story.slug} episodeNumber`,
      `JSON-LD ${String(episode.episodeNumber)} ≠ 資料層 ep ${story.ep}`,
    );
  }
  if (typeof episode.datePublished !== "string" || episode.datePublished.length === 0) {
    fail(`story/${story.slug} datePublished`, "PodcastEpisode 缺 datePublished");
  } else if (episode.datePublished !== story.date) {
    fail(
      `story/${story.slug} datePublished`,
      `JSON-LD ${episode.datePublished} ≠ 資料層 ${story.date}`,
    );
  }

  const expectedModified = normalizeIso(storyDateModified(story));
  const episodeModified =
    typeof episode.dateModified === "string" ? normalizeIso(episode.dateModified) : "";
  if (!episodeModified) {
    fail(`story/${story.slug} dateModified`, "PodcastEpisode 缺 dateModified");
  } else if (episodeModified !== expectedModified) {
    fail(
      `story/${story.slug} dateModified`,
      `JSON-LD ${episodeModified} ≠ 資料層 ${expectedModified}`,
    );
  }

  const sitemapEntry = sitemapByStory.get(story.slug);
  if (!sitemapEntry) {
    fail(`story/${story.slug} sitemap`, "sitemap 缺此 slug");
  } else if (episodeModified && normalizeIso(sitemapEntry.lastModified) !== episodeModified) {
    fail(
      `story/${story.slug} dateModified 同源`,
      `JSON-LD ${episodeModified} ≠ sitemap ${normalizeIso(sitemapEntry.lastModified)}`,
    );
  }

  const canonical = extractCanonicalHref(html);
  const expectedCanonicalPath = `/story/${story.slug}`;
  if (!canonical) {
    fail(`story/${story.slug} canonical`, "缺少 rel=canonical");
  } else if (!canonicalMatchesPath(canonical, expectedCanonicalPath)) {
    fail(`story/${story.slug} canonical`, `canonical 應為 ${expectedCanonicalPath}，實際 ${canonical}`);
  }

  if (htmlHasNoindex(html)) {
    fail(`story/${story.slug} noindex`, "故事詳情頁不得 noindex");
  }

  const definitionSummary = storyDefinitionSummary(story);
  if (!visibleTextPresent(html, definitionSummary)) {
    fail(`story/${story.slug} definitionSummary`, "HTML 缺 answer-first 摘要");
  }

  const transcriptValidation = validateFullTranscript(story, {
    audioDuration: sceneAudioDuration(story.slug),
  });
  const fullTranscript = transcriptValidation.ok;
  const sceneCaptions = hasSceneCaptions(story);
  const hasTranscriptLd = episodeHasTranscriptMedia(episode);
  const vttPath = `/story/${story.slug}/transcript.vtt`;

  if (fullTranscript) {
    coverage.fullTranscriptCoverage += 1;
    if (!hasTranscriptLd) {
      fail(`story/${story.slug} transcript JSON-LD`, "有完整逐字稿但缺 text/vtt MediaObject");
    } else {
      const media = episode.associatedMedia;
      const list = Array.isArray(media) ? media : media ? [media] : [];
      const vttObj = list.find(
        (item) =>
          item &&
          typeof item === "object" &&
          (item as Record<string, unknown>).encodingFormat === "text/vtt",
      ) as Record<string, unknown> | undefined;
      const contentUrl = vttObj?.contentUrl;
      if (typeof contentUrl !== "string" || !contentUrl.includes(`${vttPath}`)) {
        fail(`story/${story.slug} transcript URL`, `VTT contentUrl 應含 ${vttPath}`);
      }
    }
    if (!html.includes("transcript.vtt")) {
      fail(`story/${story.slug} transcript 連結`, "HTML 缺 transcript.vtt 宣告");
    }
  } else {
    coverage.missingFullTranscriptSlugs.push(story.slug);
    const validationDetail = transcriptValidation.issues
      .map((issue) => issue.message)
      .join("；");
    fail(
      `story/${story.slug} 完整逐字稿覆蓋`,
      validationDetail || "字幕側車未通過完整性驗證",
    );
    if (hasTranscriptLd) {
      fail(
        `story/${story.slug} transcript 契約`,
        "無完整逐字稿（subtitles）但 JSON-LD 宣告 text/vtt — 可能誤用場景字幕",
      );
    }
    if (html.includes("下載完整逐字稿")) {
      fail(
        `story/${story.slug} transcript 文案`,
        "無完整逐字稿但頁面出現「下載完整逐字稿」",
      );
    }
  }

  if (sceneCaptions && !fullTranscript) {
    coverage.sceneCaptionOnly += 1;
  }

  const breadcrumb = types.find((t) => t["@type"] === "BreadcrumbList");
  if (!breadcrumb) {
    fail(`story/${story.slug} BreadcrumbList`, "JSON-LD 缺 BreadcrumbList");
  }
}

function checkCollectionPage(options: {
  label: string;
  relativePath: string;
  canonicalPath: string;
  sitemapUrls: Set<string>;
  siteUrl: string;
  expectedTitleFragment: string;
  expectedDescriptionFragment: string;
  expectedStoryCount: number;
  sitemapSuffix: string;
}): boolean {
  const html = readHtml(options.relativePath);
  if (html === null) {
    fail(`${options.label} HTML`, `找不到 ${options.relativePath}`);
    return false;
  }
  if (isNextErrorShell(html)) {
    fail(
      `${options.label} HTML`,
      "build 產物為 Next error 頁——請重新 npm run build",
    );
    return false;
  }

  const resultStart = results.length;

  const sitemapUrl = [...options.sitemapUrls].find((u) => u.endsWith(options.sitemapSuffix));
  if (!sitemapUrl) {
    fail(`${options.label} sitemap`, `缺少 URL 結尾 ${options.sitemapSuffix}`);
  }

  const canonical = extractCanonicalHref(html);
  if (!canonical) {
    fail(`${options.label} canonical`, "缺少 rel=canonical");
  } else if (!canonicalMatchesPath(canonical, options.canonicalPath)) {
    fail(`${options.label} canonical`, `應為 ${options.canonicalPath}，實際 ${canonical}`);
  }

  if (htmlHasNoindex(html)) {
    fail(`${options.label} noindex`, "不得 noindex");
  }

  try {
    const blocks = parseJsonLdBlocks(html);
    if (blocks.length === 0) {
      fail(`${options.label} JSON-LD`, "無 JSON-LD script");
    }
  } catch (e) {
    fail(`${options.label} JSON-LD`, `解析失敗：${(e as Error).message}`);
  }

  if (!html.includes(options.expectedTitleFragment)) {
    fail(`${options.label} 可見標題`, `HTML 缺「${options.expectedTitleFragment}」`);
  }
  if (!visibleTextPresent(html, options.expectedDescriptionFragment, 16)) {
    fail(`${options.label} HTML 描述`, "HTML 缺 definition summary／lede");
  }
  const countLabel = `${options.expectedStoryCount} 則故事`;
  if (!htmlContainsStoryCount(html, options.expectedStoryCount)) {
    fail(`${options.label} 故事數`, `HTML 缺「${countLabel}」`);
  }

  return !results.slice(resultStart).some((result) => !result.ok);
}

type StaticPageSpec = {
  label: string;
  relativePath: string;
  canonicalPath?: string;
  titleNeedle?: string;
  descriptionNeedle?: string;
  requireJsonLd?: boolean;
  /** 首頁等 metadata 未宣告 canonical 時略過 link 檢查 */
  canonicalOptional?: boolean;
};

function checkStaticPage(spec: StaticPageSpec): void {
  const html = readHtml(spec.relativePath);
  if (html === null) {
    fail(`${spec.label} HTML`, `找不到 ${spec.relativePath}`);
    return;
  }
  if (isNextErrorShell(html)) {
    fail(`${spec.label} HTML`, "build 產物為 Next error 頁——請重新 npm run build");
    return;
  }

  const canonical = extractCanonicalHref(html);
  if (spec.canonicalPath) {
    if (!canonical) {
      if (spec.canonicalOptional) {
        skip(`${spec.label} canonical`, "metadata 未宣告 alternates.canonical");
      } else {
        fail(`${spec.label} canonical`, "缺少 rel=canonical");
      }
    } else if (!canonicalMatchesPath(canonical, spec.canonicalPath)) {
      fail(`${spec.label} canonical`, `應為 ${spec.canonicalPath}，實際 ${canonical}`);
    }
  }

  if (htmlHasNoindex(html)) {
    fail(`${spec.label} noindex`, "不得 noindex");
  }

  if (spec.titleNeedle && !html.includes(spec.titleNeedle)) {
    fail(`${spec.label} title`, `HTML 缺 title／標題線索「${spec.titleNeedle}」`);
  }
  if (spec.descriptionNeedle && !html.includes(spec.descriptionNeedle)) {
    fail(`${spec.label} description`, "HTML 缺 meta description 線索");
  }

  try {
    const blocks = parseJsonLdBlocks(html);
    if (spec.requireJsonLd !== false && blocks.length === 0) {
      fail(`${spec.label} JSON-LD`, "無 JSON-LD script");
    }
  } catch (e) {
    fail(`${spec.label} JSON-LD`, `解析失敗：${(e as Error).message}`);
  }
}

async function checkRobots(): Promise<void> {
  const mod = await import("../app/robots");
  const robots = mod.default();
  const verification = verifyRobotsPolicy(robots.rules);
  if (!verification.ok) {
    fail("robots.ts AI 爬蟲政策", verification.errors.join("; "));
    return;
  }
  pass(
    "robots.ts AI 爬蟲政策（結構化規則）",
    `allow ${AI_RETRIEVAL_CRAWLERS.length} 項檢索、disallow ${AI_TRAINING_CRAWLERS.length} 項訓練`,
  );

  const bodyPath = join(APP_DIR, "robots.txt.body");
  if (existsSync(bodyPath)) {
    pass("robots.txt build 產物存在");
  } else {
    skip("robots.txt build 產物存在", "無 robots.txt.body（仍以 app/robots.ts 為準）");
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

/** RSS enclosure length：本地音檔實際存在的故事須 > 0；無本地音檔者容許 0。 */
async function checkRssEnclosureLength(stories: Story[]): Promise<void> {
  const mod = await import("../app/feed.xml/route");
  const response = mod.GET();
  const xml = await response.text();

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

/** FAQ 覆蓋率是目前內容契約，不是僅供觀察的統計。 */
function checkEpisodeFaqCoverage(stories: Story[]): void {
  const storySlugs = stories.map((story) => story.slug);
  const report = episodeFaqCoverage(storySlugs);
  const extraSlugs = listEpisodeFaqSlugs().filter((slug) => !storySlugs.includes(slug));

  coverage.uniqueFaqCoverage = report.covered;
  coverage.missingUniqueFaqSlugs = report.missingSlugs;

  if (report.missingSlugs.length > 0) {
    fail(
      "Unique episode FAQ coverage",
      `缺少：${report.missingSlugs.join(", ")}`,
    );
  } else {
    pass("Unique episode FAQ coverage", `${report.covered}/${report.total}`);
  }

  if (extraSlugs.length > 0) {
    fail("episodeFaq sidecar slug 對齊故事目錄", `多餘：${extraSlugs.join(", ")}`);
  }
}

/** `/stories` 含 searchParams，build 常無獨立 prerender HTML；改驗資料層契約（對齊 generateMetadata）。verify:geo 無 stories.html 時不驗證 body DOM。 */
function checkStoriesListingPage(stories: Story[]): void {
  const tags = allTags();
  const vehicles = allVehicles();
  const description = storiesCatalogSummary(stories, tags.length, vehicles.length);
  const descriptionNeedle = Array.from(description.trim()).slice(0, 24).join("");

  const html = readHtml("stories.html");
  if (html !== null) {
    checkStaticPage({
      label: "/stories",
      relativePath: "stories.html",
      canonicalPath: "/stories",
      titleNeedle: "全部故事",
      descriptionNeedle,
      requireJsonLd: true,
    });
    return;
  }

  pass("/stories metadata canonical", "/stories（契約，見 app/stories/page）");
  pass("/stories catalog summary", `${Array.from(description).length} 字`);
  skip("/stories prerender HTML", "動態 searchParams 路由，無 stories.html");
}

function printDetailReport(): void {
  console.log("=== 車車遊樂園 · GEO 驗證 ===\n");
  for (const r of results) {
    const icon = r.skip ? "○" : r.warn ? "△" : r.ok ? "✓" : "✗";
    const suffix = r.skip ? `skip(${r.skip})` : r.detail ? `— ${r.detail}` : "";
    console.log(`${icon} ${r.label}${suffix ? ` ${suffix}` : ""}`);
  }
}

function printCoverageSummary(): void {
  console.log("\n=== GEO 覆蓋率摘要 ===");
  console.log(`Stories checked: ${coverage.storiesChecked}/${coverage.storiesTotal}`);
  console.log(
    `Story JSON-LD valid: ${coverage.storyJsonLdValid}/${coverage.storiesTotal}`,
  );
  console.log(
    `Unique episode FAQ coverage: ${coverage.uniqueFaqCoverage}/${coverage.storiesTotal}`,
  );
  console.log(
    `Full transcript coverage: ${coverage.fullTranscriptCoverage}/${coverage.storiesTotal}`,
  );
  console.log(
    `Scene-caption-only episodes: ${coverage.sceneCaptionOnly}/${coverage.storiesTotal}`,
  );
  console.log(
    `Topic pages checked: ${coverage.topicPagesChecked}/${coverage.topicPagesTotal}`,
  );
  console.log(
    `Vehicle pages checked: ${coverage.vehiclePagesChecked}/${coverage.vehiclePagesTotal}`,
  );

  if (coverage.missingFullTranscriptSlugs.length > 0) {
    console.log(
      `Missing full transcripts: ${coverage.missingFullTranscriptSlugs.join(", ")}`,
    );
  }
  if (coverage.missingUniqueFaqSlugs.length > 0) {
    console.log(`Missing episode FAQs: ${coverage.missingUniqueFaqSlugs.join(", ")}`);
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
  coverage.storiesTotal = stories.length;

  const sitemapEntries = await loadSitemapEntries();
  const sitemapUrls = new Set(sitemapEntries.map((e) => e.url));
  const sitemapByStory = new Map<string, { url: string; lastModified?: string | Date }>();
  for (const story of stories) {
    const entry = sitemapEntries.find((e) => e.url.endsWith(`/story/${story.slug}`));
    if (entry) sitemapByStory.set(story.slug, entry);
  }

  await checkSitemap(stories, siteUrl);
  checkLlmsFullTxt(latestStory.slug);
  checkEpisodeFaqCoverage(stories);

  for (const story of stories) {
    checkStoryPage(story, sitemapByStory);
  }

  const tags = allTags();
  coverage.topicPagesTotal = tags.length;
  for (const tag of tags) {
    const encoded = encodeURIComponent(tag);
    const storiesForTag = getStoriesByTag(tag);
    const ok = checkCollectionPage({
      label: `topic/${tag}`,
      relativePath: `topic/${tag}.html`,
      canonicalPath: `/topic/${encoded}`,
      sitemapUrls,
      siteUrl,
      expectedTitleFragment: `${tag}主題故事`,
      expectedDescriptionFragment: topicDefinitionSummary(tag, storiesForTag),
      expectedStoryCount: storiesForTag.length,
      sitemapSuffix: `/topic/${encoded}`,
    });
    if (ok) coverage.topicPagesChecked += 1;
  }

  const vehicles = allVehicles();
  coverage.vehiclePagesTotal = vehicles.length;
  for (const vehicle of vehicles) {
    const storiesForVehicle = getStoriesByVehicle(vehicle);
    const ok = checkCollectionPage({
      label: `vehicles/${vehicle}`,
      relativePath: `vehicles/${vehicle}.html`,
      canonicalPath: `/vehicles/${encodeURIComponent(vehicle)}`,
      sitemapUrls,
      siteUrl,
      expectedTitleFragment: `${vehicle}故事屋`,
      expectedDescriptionFragment: vehicleDefinitionSummary(vehicle, storiesForVehicle),
      expectedStoryCount: storiesForVehicle.length,
      sitemapSuffix: `/vehicles/${encodeURIComponent(vehicle)}`,
    });
    if (ok) coverage.vehiclePagesChecked += 1;
  }

  checkStaticPage({
    label: "首頁 /",
    relativePath: "index.html",
    canonicalOptional: true,
    titleNeedle: "車車遊樂園",
    descriptionNeedle: "親子",
    requireJsonLd: true,
  });
  checkStoriesListingPage(stories);
  const topicThemes = tags.map((tag) => ({
    tag,
    count: getStoriesByTag(tag).length,
  }));
  const topicIndexDescription = topicIndexDefinitionSummary(topicThemes);
  const topicIndexNeedle = Array.from(topicIndexDescription.trim())
    .slice(0, 24)
    .join("");
  checkStaticPage({
    label: "/topic",
    relativePath: "topic.html",
    canonicalPath: "/topic",
    titleNeedle: "主題",
    descriptionNeedle: topicIndexNeedle,
  });
  checkStaticPage({
    label: "/for-parents",
    relativePath: "for-parents.html",
    canonicalPath: "/for-parents",
    titleNeedle: "家長",
  });
  checkStaticPage({
    label: "/characters",
    relativePath: "characters.html",
    canonicalPath: "/characters",
    titleNeedle: "角色",
  });
  checkStaticPage({
    label: "/about",
    relativePath: "about.html",
    canonicalPath: "/about",
    titleNeedle: "關於",
  });

  // 開放島頁：與 checkStaticPage 同一機制；非開放島 noindex，不納入受管檢查。
  for (const zone of universe.zones.filter((z) => z.status === "open")) {
    checkStaticPage({
      label: `/adventures/${zone.id}`,
      relativePath: `adventures/${zone.id}.html`,
      canonicalPath: `/adventures/${zone.id}`,
      titleNeedle: zone.name,
      descriptionNeedle: zone.tagline,
      requireJsonLd: false,
    });
  }

  checkHasNoindex("story/[slug]/play 頁", `story/${latestStory.slug}/play.html`);

  await checkRobots();
  checkSameAs();
  await checkRssEnclosureLength(stories);
  checkIndexNowKeyFile();

  printDetailReport();
  printCoverageSummary();

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
