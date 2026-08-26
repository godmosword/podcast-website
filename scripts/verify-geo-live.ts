#!/usr/bin/env tsx
/**
 * 部署後 GEO 煙霧測試：對 live base URL 檢查 robots／sitemap／feed／llms、
 * 重點頁 HTTP 200、JSON-LD 可解析、最新一集 canonical 與 sitemap 涵蓋度。
 * 最新集逐字稿：有字幕側車才要求 VTT 200／RSS transcript；MVP 無側車則確認未宣告。
 *
 * 不在 npm run check 內；需網路。
 *
 *   npm run verify:geo-live -- --base-url=https://podcast-website-mu.vercel.app
 *   npm run verify:geo-live -- --help
 */

import { allVehicles, getStories, storiesByNewest } from "../data/content";
import { getSubtitles } from "../lib/subtitles";
import { hasFullTranscript } from "../lib/transcript";
import {
  contentTypeMatches,
  extractCanonicalHref,
  flattenJsonLdNodes,
  isLikelyEdgeOrWafErrorPage,
  parseJsonLdBlocks,
} from "../lib/geo-live-html";
import { validateRobotsTxtPolicy } from "../lib/robots-policy";
import { CANONICAL_SITE_URL, getSiteUrl } from "../lib/site-url";
import { storyAudioPath, storyCoverPath } from "../lib/story-utils";
import {
  associatedMediaHasVtt,
  rssHasPodcastTranscript,
  transcriptLiveMode,
} from "./lib/geo-live-transcript";

const FETCH_TIMEOUT_MS = 45_000;
const RETRIEVAL_UA_SAMPLES = ["Claude-SearchBot", "PerplexityBot"] as const;

type Result = { ok: boolean; label: string; detail?: string };
type CliOptions = { baseUrl: string; productionOnly: boolean };

const results: Result[] = [];

function pass(label: string, detail?: string): void {
  results.push({ ok: true, label, detail });
}

function fail(label: string, detail: string): void {
  results.push({ ok: false, label, detail });
}

function printHelp(): void {
  console.log(`用法：
  npm run verify:geo-live -- --base-url=<https://...>

選項：
  --base-url   必填（部署後站點根網址，不含尾斜線）
  --production 只允許驗證目前 production canonical origin，拒絕 preview URL
  --help       顯示說明

預設參考網域（未帶參數時僅提示）：${CANONICAL_SITE_URL}
`);
}

function isAllowedGeoLiveBaseUrl(url: URL): boolean {
  if (url.protocol === "https:") return true;
  if (url.protocol !== "http:") return false;
  return url.hostname === "localhost" || url.hostname === "127.0.0.1";
}

function parseOptions(argv: string[]): CliOptions | null {
  let baseUrl: string | null = null;
  let productionOnly = false;
  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--production") {
      productionOnly = true;
      continue;
    }
    if (arg.startsWith("--base-url=")) {
      const raw = arg.slice("--base-url=".length).trim();
      try {
        const url = new URL(raw);
        if (!isAllowedGeoLiveBaseUrl(url)) return null;
        baseUrl = url.origin;
      } catch {
        return null;
      }
    }
  }
  return baseUrl ? { baseUrl, productionOnly } : null;
}

function isConfiguredProductionOrigin(baseUrl: string): boolean {
  try {
    const canonicalOrigin = new URL(CANONICAL_SITE_URL).origin;
    return (
      new URL(baseUrl).origin === canonicalOrigin &&
      new URL(getSiteUrl()).origin === canonicalOrigin
    );
  } catch {
    return false;
  }
}

function assertFinalUrlOrigin(baseUrl: string, finalUrl: string, label: string): boolean {
  let finalOrigin: string;
  try {
    finalOrigin = new URL(finalUrl).origin;
  } catch {
    fail(label, `無法解析回應 URL：${finalUrl}`);
    return false;
  }
  if (finalOrigin !== baseUrl) {
    fail(label, `redirect 至不同 origin（${finalOrigin}，預期 ${baseUrl}）`);
    return false;
  }
  return true;
}

async function fetchLive(
  url: string,
  userAgent?: string,
): Promise<{
  status: number;
  contentType: string | null;
  body: string;
  finalUrl: string;
  headers: Headers;
}> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: userAgent ? { "User-Agent": userAgent } : undefined,
      redirect: "follow",
    });
    const body = await res.text();
    return {
      status: res.status,
      contentType: res.headers.get("content-type"),
      body,
      finalUrl: res.url,
      headers: res.headers,
    };
  } finally {
    clearTimeout(timer);
  }
}

async function checkProductionHeaders(baseUrl: string): Promise<void> {
  let res: Awaited<ReturnType<typeof fetchLive>>;
  try {
    res = await fetchLive(baseUrl);
  } catch (e) {
    fail("production security headers", `首頁請求失敗：${(e as Error).message}`);
    return;
  }

  const required = [
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "strict-origin-when-cross-origin"],
    ["x-frame-options", "SAMEORIGIN"],
  ] as const;
  const missing = required.filter(([name, expected]) => res.headers.get(name) !== expected);
  if (missing.length > 0) {
    fail(
      "production security headers",
      missing.map(([name, expected]) => `${name} 應為 ${expected}`).join("; "),
    );
  } else if (!/^max-age=31536000; includeSubDomains$/i.test(res.headers.get("strict-transport-security") ?? "")) {
    fail("production security headers", "缺少 production HSTS：max-age=31536000; includeSubDomains");
  } else {
    pass("production security headers");
  }
}

async function checkNotFoundPage(baseUrl: string): Promise<void> {
  let res: Awaited<ReturnType<typeof fetchLive>>;
  try {
    res = await fetchLive(`${baseUrl}/story/not-real-slug`);
  } catch (e) {
    fail("GET 404 頁面", (e as Error).message);
    return;
  }
  if (res.status !== 404) {
    fail("GET 404 頁面", `預期 HTTP 404，實際 ${res.status}`);
    return;
  }
  if (!contentTypeMatches(/^text\/html/i, res.contentType)) {
    fail("GET 404 頁面", `Content-Type：${res.contentType ?? "(無)"}`);
    return;
  }
  if (isLikelyEdgeOrWafErrorPage(res.body, res.contentType)) {
    fail("GET 404 頁面", "疑似 WAF／邊緣錯誤頁");
    return;
  }
  pass("GET 404 頁面");
}

type AssetCheck = {
  label: string;
  path: string;
  contentType: RegExp;
};

async function checkAsset(baseUrl: string, spec: AssetCheck): Promise<string | null> {
  const url = `${baseUrl}${spec.path}`;
  let res: Awaited<ReturnType<typeof fetchLive>>;
  try {
    res = await fetchLive(url);
  } catch (e) {
    fail(spec.label, `${url} 請求失敗：${(e as Error).message}`);
    return null;
  }
  if (res.status !== 200) {
    fail(spec.label, `${url} HTTP ${res.status}`);
    return null;
  }
  if (!assertFinalUrlOrigin(baseUrl, res.finalUrl, spec.label)) {
    return null;
  }
  if (isLikelyEdgeOrWafErrorPage(res.body, res.contentType)) {
    fail(spec.label, `${url} 疑似 WAF／邊緣錯誤頁`);
    return null;
  }
  if (!contentTypeMatches(spec.contentType, res.contentType)) {
    fail(
      spec.label,
      `${url} Content-Type 不符：${res.contentType ?? "(無)"}，預期 ${spec.contentType}`,
    );
    return null;
  }
  pass(spec.label, url);
  return res.body;
}

async function checkMissingTranscript(baseUrl: string, transcriptPath: string): Promise<void> {
  const url = `${baseUrl}${transcriptPath}`;
  let res: Awaited<ReturnType<typeof fetchLive>>;
  try {
    res = await fetchLive(url);
  } catch (e) {
    fail("GET 最新單集 transcript.vtt（無側車）", `${url} 請求失敗：${(e as Error).message}`);
    return;
  }
  if (res.status === 404) {
    pass("GET 最新單集 transcript.vtt 缺側車為 404", transcriptPath);
    return;
  }
  fail(
    "GET 最新單集 transcript.vtt 缺側車為 404",
    `${url} 預期 HTTP 404（本地無字幕），實際 ${res.status}`,
  );
}

async function checkHtmlPage(baseUrl: string, path: string, label: string): Promise<string | null> {
  const url = `${baseUrl}${path}`;
  let res: Awaited<ReturnType<typeof fetchLive>>;
  try {
    res = await fetchLive(url);
  } catch (e) {
    fail(label, `${url} 請求失敗：${(e as Error).message}`);
    return null;
  }
  if (res.status !== 200) {
    fail(label, `${url} HTTP ${res.status}`);
    return null;
  }
  if (!assertFinalUrlOrigin(baseUrl, res.finalUrl, label)) {
    return null;
  }
  if (!contentTypeMatches(/^text\/html/i, res.contentType)) {
    fail(label, `Content-Type：${res.contentType ?? "(無)"}`);
    return null;
  }
  if (isLikelyEdgeOrWafErrorPage(res.body, res.contentType)) {
    fail(label, "疑似 WAF／邊緣錯誤頁");
    return null;
  }
  pass(label, url);
  return res.body;
}

function checkJsonLdParseable(html: string, label: string): void {
  try {
    const blocks = parseJsonLdBlocks(html);
    if (blocks.length === 0) {
      fail(label, "無 application/ld+json 區塊");
      return;
    }
    for (const b of blocks) {
      flattenJsonLdNodes(b);
    }
    pass(label, `${blocks.length} 區塊`);
  } catch (e) {
    fail(label, (e as Error).message);
  }
}

async function main(): Promise<void> {
  const options = parseOptions(process.argv.slice(2));
  if (!options) {
    console.error("錯誤：請提供 --base-url=https://...");
    console.error(`範例：npm run verify:geo-live -- --base-url=${CANONICAL_SITE_URL}`);
    process.exit(1);
  }
  const { baseUrl, productionOnly } = options;
  if (productionOnly && !isConfiguredProductionOrigin(baseUrl)) {
    console.error(
      `錯誤：--production 只能驗證 canonical production origin ${CANONICAL_SITE_URL}，實際為 ${baseUrl}`,
    );
    process.exit(1);
  }

  const latest = storiesByNewest()[0]!;
  const vehicle = allVehicles()[0];
  if (!vehicle) {
    console.error("錯誤：故事目錄缺少 vehicle，無法組抽樣 URL");
    process.exit(1);
  }

  const topicPath = "/topic";
  const vehiclePath = `/vehicles/${encodeURIComponent(vehicle)}`;
  const storyPath = `/story/${latest.slug}`;
  const transcriptPath = `${storyPath}/transcript.vtt`;
  const latestImagePath = storyCoverPath(latest.slug);
  const latestAudioPath = storyAudioPath(latest.slug, latest.audio);

  console.log(`=== 車車遊樂園 · GEO Live 煙霧測試 ===\nbase: ${baseUrl}\n`);

  const robotsBody = await checkAsset(baseUrl, {
    label: "GET /robots.txt",
    path: "/robots.txt",
    contentType: /^text\/plain/i,
  });

  if (robotsBody) {
    const issues = validateRobotsTxtPolicy(robotsBody);
    if (issues.length > 0) {
      fail(
        "robots.txt AI crawler 契約",
        issues.map((i) => `${i.userAgent}: ${i.message}`).join("; "),
      );
    } else {
      pass("robots.txt AI crawler 契約");
    }
  }

  for (const ua of RETRIEVAL_UA_SAMPLES) {
    const url = `${baseUrl}/robots.txt`;
    try {
      const res = await fetchLive(url, ua);
      if (res.status !== 200) {
        fail(`robots.txt（UA ${ua}）`, `HTTP ${res.status}`);
      } else if (!assertFinalUrlOrigin(baseUrl, res.finalUrl, `robots.txt（UA ${ua}）`)) {
        /* fail 已記錄 */
      } else if (isLikelyEdgeOrWafErrorPage(res.body, res.contentType)) {
        fail(`robots.txt（UA ${ua}）`, "疑似 WAF 阻擋");
      } else {
        pass(`robots.txt（UA ${ua}）`, "200");
      }
    } catch (e) {
      fail(`robots.txt（UA ${ua}）`, (e as Error).message);
    }
  }

  const sitemapBody = await checkAsset(baseUrl, {
    label: "GET /sitemap.xml",
    path: "/sitemap.xml",
    contentType: /^(application\/xml|text\/xml)/i,
  });

  if (sitemapBody) {
    const storyUrl = `${baseUrl}${storyPath}`;
    if (sitemapBody.includes(storyUrl) || sitemapBody.includes(storyPath)) {
      pass("sitemap 含最新一集", latest.slug);
    } else {
      fail("sitemap 含最新一集", `找不到 ${storyPath}`);
    }
  }

  const feedBody = await checkAsset(baseUrl, {
    label: "GET /feed.xml",
    path: "/feed.xml",
    contentType: /^(application\/rss\+xml|application\/xml|text\/xml)/i,
  });

  const transcriptUrl = `${baseUrl}${transcriptPath}`;
  const transcriptMode = transcriptLiveMode(hasFullTranscript(latest));

  if (feedBody) {
    const inRss = rssHasPodcastTranscript(feedBody, transcriptUrl);
    if (transcriptMode === "require") {
      if (inRss) {
        pass("RSS 含最新一集 podcast:transcript", latest.slug);
      } else {
        fail("RSS 含最新一集 podcast:transcript", `找不到 ${transcriptPath}`);
      }
    } else if (inRss) {
      fail(
        "RSS 最新一集無 podcast:transcript",
        `本地無字幕側車卻宣告 ${transcriptPath}`,
      );
    } else {
      pass("RSS 最新一集無 podcast:transcript", `${latest.slug} MVP 無側車`);
    }
  }

  if (transcriptMode === "require") {
    const transcriptBody = await checkAsset(baseUrl, {
      label: "GET 最新單集 transcript.vtt",
      path: transcriptPath,
      contentType: /^text\/vtt/i,
    });

    if (transcriptBody) {
      if (!transcriptBody.startsWith("WEBVTT")) {
        fail("最新單集 transcript.vtt 格式", "內容不是 WEBVTT");
      } else {
        const firstText = getSubtitles(latest.slug)?.[0]?.text;
        if (!firstText) {
          fail("最新單集 transcript.vtt 內容", "本地字幕側車缺少第一句，無法驗證 live cue");
        } else if (!transcriptBody.includes(firstText)) {
          fail("最新單集 transcript.vtt 內容", "缺少本地字幕側車的第一句");
        } else {
          pass("最新單集 transcript.vtt 內容", `${latest.slug} cue 可讀`);
        }
      }
    }
  } else {
    await checkMissingTranscript(baseUrl, transcriptPath);
  }

  await checkAsset(baseUrl, {
    label: "GET /llms.txt",
    path: "/llms.txt",
    contentType: /^text\/plain/i,
  });

  const llmsFullBody = await checkAsset(baseUrl, {
    label: "GET /llms-full.txt",
    path: "/llms-full.txt",
    contentType: /^text\/plain/i,
  });

  if (llmsFullBody && !llmsFullBody.includes(latest.slug)) {
    fail("llms-full.txt 含最新一集 slug", latest.slug);
  } else if (llmsFullBody) {
    pass("llms-full.txt 含最新一集 slug", latest.slug);
  }

  const homeHtml = await checkHtmlPage(baseUrl, "/", "GET 首頁");
  if (homeHtml) checkJsonLdParseable(homeHtml, "首頁 JSON-LD 可解析");
  if (productionOnly) await checkProductionHeaders(baseUrl);
  await checkNotFoundPage(baseUrl);

  await checkAsset(baseUrl, {
    label: "GET 最新集主要圖片",
    path: latestImagePath,
    contentType: /^image\/(jpeg|jpg|webp|avif)/i,
  });
  await checkAsset(baseUrl, {
    label: "GET 最新集音檔",
    path: latestAudioPath,
    contentType: /^(audio\/mpeg|audio\/mp4|application\/octet-stream)/i,
  });

  const storyHtml = await checkHtmlPage(baseUrl, storyPath, "GET 最新單集頁");
  if (storyHtml) {
    checkJsonLdParseable(storyHtml, "最新單集 JSON-LD 可解析");
    const types = parseJsonLdBlocks(storyHtml).flatMap((b) => flattenJsonLdNodes(b));
    const episode = types.find((t) => t["@type"] === "PodcastEpisode");
    if (!episode) {
      fail("最新單集含 PodcastEpisode", storyPath);
    } else {
      pass("最新單集含 PodcastEpisode");
      const transcriptMediaUrl = `${baseUrl}${transcriptPath}`;
      const hasMatchingVtt = associatedMediaHasVtt(
        episode.associatedMedia,
        transcriptMediaUrl,
      );
      const hasAnyVtt = associatedMediaHasVtt(episode.associatedMedia);
      if (transcriptMode === "require") {
        if (hasMatchingVtt) {
          pass("最新單集 JSON-LD transcript MediaObject", latest.slug);
        } else {
          fail(
            "最新單集 JSON-LD transcript MediaObject",
            `contentUrl 應為 ${transcriptMediaUrl}`,
          );
        }
      } else if (hasAnyVtt) {
        fail(
          "最新單集 JSON-LD 無 transcript MediaObject",
          `本地無字幕側車卻宣告 ${transcriptMediaUrl}`,
        );
      } else {
        pass("最新單集 JSON-LD 無 transcript MediaObject", `${latest.slug} MVP 無側車`);
      }
    }
    const faq = types.find((t) => t["@type"] === "FAQPage");
    if (!faq) {
      fail("最新單集含 FAQPage", latest.slug);
    } else if (!latest.episodeFaq) {
      fail("最新單集含 episodeFaq 可見問題", "本地最新故事缺少 episodeFaq");
    } else if (!storyHtml.includes(latest.episodeFaq.question)) {
      fail("最新單集含 episodeFaq 可見問題", latest.episodeFaq.question);
    } else {
      pass("最新單集含 episodeFaq 可見問題", latest.slug);
    }
    const canonical = extractCanonicalHref(storyHtml);
    const expectedSuffix = storyPath;
    if (
      canonical &&
      (canonical.endsWith(expectedSuffix) || canonical === `${baseUrl}${expectedSuffix}`)
    ) {
      pass("最新單集 canonical", canonical);
    } else {
      fail("最新單集 canonical", `預期含 ${expectedSuffix}，實際 ${canonical ?? "(無)"}`);
    }
  }

  const topicHtml = await checkHtmlPage(baseUrl, topicPath, "GET 主題索引頁");
  if (topicHtml) checkJsonLdParseable(topicHtml, "主題索引頁 JSON-LD 可解析");

  const storiesHtml = await checkHtmlPage(baseUrl, "/stories", "GET 全部故事頁");
  if (storiesHtml) {
    const expectedCatalogNeedle = `全部 ${getStories().length} 則看圖聽故事`;
    if (storiesHtml.includes(expectedCatalogNeedle)) {
      pass("全部故事頁含 catalog summary", expectedCatalogNeedle);
    } else {
      fail("全部故事頁含 catalog summary", `找不到「${expectedCatalogNeedle}」`);
    }
  }

  const vehicleHtml = await checkHtmlPage(baseUrl, vehiclePath, "GET 車種頁（抽樣）");
  if (vehicleHtml) checkJsonLdParseable(vehicleHtml, "車種頁 JSON-LD 可解析");

  // 確認本地故事數與 sitemap 邏輯一致（僅 log）
  pass("抽樣故事 slug", `${latest.slug}（共 ${getStories().length} 集）`);

  console.log("");
  for (const r of results) {
    const icon = r.ok ? "✓" : "✗";
    console.log(`${icon} ${r.label}${r.detail ? ` — ${r.detail}` : ""}`);
  }

  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    console.log(`\n❌ ${failures.length} 項失敗`);
    process.exit(1);
  }
  console.log("\n✅ 全部通過");
}

main().catch((e) => {
  console.error("verify:geo-live 執行失敗：", e);
  process.exit(1);
});
