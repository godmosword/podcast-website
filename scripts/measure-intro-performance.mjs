// Phase 10 量測工具：對「正在跑的 production build」實測載入、renderer、生命周期
// 與 web vitals，輸出機器可讀的 JSON。所有數字都會附上 build id、瀏覽器、viewport、
// DPR、quality tier、cold/warm 與網路／CPU 條件，避免變成沒有情境的宣稱。
import { chromium } from 'playwright';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const BASE = process.env.INTRO_PERF_BASE ?? 'http://127.0.0.1:3000';
const OUT = resolve(process.argv.find(a => a.startsWith('--out='))?.slice('--out='.length)
  ?? 'docs/qa/intro-portal/phase10-20260908');
await mkdir(OUT, { recursive: true });

const buildId = (await readFile('.next/BUILD_ID', 'utf8')).trim();
const browserPath = process.env.PW_CHROMIUM_PATH;
const browser = await chromium.launch({ headless: true, ...(browserPath ? { executablePath: browserPath } : {}) });
const version = browser.version();
const os = execFileSync('uname', ['-sr']).toString().trim();

/** Tier hints. QualityManager may still downgrade at runtime; we record what it actually used. */
const TIERS = {
  high: { cores: 8, memory: 8, viewport: { width: 1440, height: 900 }, mobile: false },
  medium: { cores: 4, memory: 4, viewport: { width: 390, height: 844 }, mobile: true },
  low: { cores: 2, memory: 2, viewport: { width: 390, height: 844 }, mobile: true },
};

async function newPage(tier, { warm } = { warm: null }) {
  const context = warm ?? await browser.newContext({ viewport: TIERS[tier].viewport, serviceWorkers: 'block', deviceScaleFactor: 1 });
  await context.addInitScript(([cores, memory]) => {
    Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => cores });
    Object.defineProperty(navigator, 'deviceMemory', { get: () => memory });
  }, [TIERS[tier].cores, TIERS[tier].memory]);
  return context;
}

/** Resource timing for one page load, with transfer and decoded sizes. */
async function resources(page) {
  return page.evaluate(() => performance.getEntriesByType('resource').map(entry => ({
    name: new URL(entry.name).pathname,
    type: entry.initiatorType,
    start: +entry.startTime.toFixed(1),
    end: +entry.responseEnd.toFixed(1),
    transferBytes: entry.transferSize,
    encodedBytes: entry.encodedBodySize,
    decodedBytes: entry.decodedBodySize,
  })));
}

const report = {
  meta: {
    buildId,
    browser: `Chromium ${version} (Playwright, headless)`,
    renderer: 'software rasterizer (SwiftShader); no GPU in this container',
    os,
    server: `${BASE} · next start · NEXT_PUBLIC_SITE_URL=https://podcast-website-mu.vercel.app`,
    network: 'loopback, no throttling',
    cpu: 'no throttling; container CPU shared with the build host',
    measuredAt: new Date().toISOString(),
  },
  loading: {},
  renderer: {},
  lifecycle: {},
  webVitals: {},
};

// ─── Loading ────────────────────────────────────────────────────────────────
{
  const context = await newPage('high');
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await page.waitForTimeout(2_500);
  const landing = await resources(page);
  const scripts = landing.filter(r => r.name.endsWith('.js'));
  report.loading.landing = {
    url: '/',
    scripts: scripts.length,
    scriptTransferBytes: scripts.reduce((n, r) => n + r.transferBytes, 0),
    threeOrGlb: landing.filter(r => /three|@react-three|\.glb$/.test(r.name)).map(r => r.name),
    posterRequests: landing.filter(r => /poster/.test(r.name)).map(r => ({ name: r.name, transferBytes: r.transferBytes })),
  };
  await context.close();
}

{
  const context = await newPage('high');
  const page = await context.newPage();
  await page.goto(`${BASE}/intro`, { waitUntil: 'load' });
  const beforeScene = (await resources(page)).filter(r => r.name.endsWith('.js')).map(r => r.name);
  await page.waitForSelector('[data-scene-state="ready"], [data-scene-state="fallback"]', { timeout: 90_000 });
  await page.waitForTimeout(1_000);
  const all = await resources(page);
  const lazyScripts = all.filter(r => r.name.endsWith('.js') && !beforeScene.includes(r.name));
  // gzip the on-disk chunk so the number does not depend on the dev server's
  // compression settings.
  const gzipOf = async (pathname) => {
    try { return gzipSync(await readFile(join('public', pathname))).length; }
    catch { try { return gzipSync(await readFile(join('.next', pathname.replace(/^\/_next\//, '')))).length; } catch { return null; } }
  };
  report.loading.intro = {
    url: '/intro',
    initialScripts: beforeScene.length,
    initialScriptTransferBytes: all.filter(r => r.name.endsWith('.js') && beforeScene.includes(r.name)).reduce((n, r) => n + r.transferBytes, 0),
    lazyScripts: await Promise.all(lazyScripts.map(async r => ({ name: r.name, transferBytes: r.transferBytes, decodedBytes: r.decodedBytes, gzipBytes: await gzipOf(r.name) }))),
    models: all.filter(r => r.name.endsWith('.glb')).map(r => ({ name: r.name, transferBytes: r.transferBytes, decodedBytes: r.decodedBytes, startMs: r.start, endMs: r.end })),
    posters: all.filter(r => /poster.*\.webp$/.test(r.name)).map(r => ({ name: r.name, transferBytes: r.transferBytes, decodedBytes: r.decodedBytes, startMs: r.start, endMs: r.end })),
    waterfall: all.sort((a, b) => a.start - b.start).map(r => ({ name: r.name, type: r.type, startMs: r.start, endMs: r.end, transferBytes: r.transferBytes })),
  };
  report.loading.intro.lazyGzipTotal = report.loading.intro.lazyScripts.reduce((n, r) => n + (r.gzipBytes ?? 0), 0);
  await context.close();
}

// ─── Renderer per tier ──────────────────────────────────────────────────────
for (const tier of ['high', 'medium', 'low']) {
  const context = await newPage(tier);
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window;
    w.__frames = [];
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { w.__frames.push(t); cb(t); });
  });
  await page.goto(`${BASE}/intro`, { waitUntil: 'load' });
  const state = await page.waitForSelector('[data-scene-state="ready"], [data-scene-state="fallback"]', { timeout: 90_000 })
    .then(() => page.locator('[data-hero-world]').getAttribute('data-scene-state'));
  if (state !== 'ready') {
    report.renderer[tier] = { state, note: 'scene never reached ready in this host' };
    await context.close();
    continue;
  }
  // Sample frame cadence while the story is actually running: demand rendering
  // means an idle scene produces no frames at all, which is correct behaviour
  // but says nothing about frame time.
  await page.evaluate(() => { window.__frames.length = 0; });
  await page.waitForTimeout(10_000);
  const frames = await page.evaluate(() => window.__frames.slice());
  // QualityManager needs 45 warm-up frames plus a 2s window; on a software
  // rasterizer that is minutes, so this can legitimately come back empty.
  const metrics = await page.waitForFunction(() => document.querySelector('canvas')?.dataset.worldMetrics ?? null, null, { timeout: 150_000, polling: 250 })
    .then(handle => handle.jsonValue()).then(JSON.parse).catch(() => null);
  const deltas = frames.slice(1).map((t, i) => t - frames[i]).sort((a, b) => a - b);
  const at = (q) => deltas.length ? +deltas[Math.min(deltas.length - 1, Math.floor(q * deltas.length))].toFixed(1) : null;
  const later = await page.evaluate(() => JSON.parse(document.querySelector('canvas')?.dataset.worldMetrics ?? 'null'));
  report.renderer[tier] = {
    requestedTier: tier,
    viewport: TIERS[tier].viewport,
    hints: { hardwareConcurrency: TIERS[tier].cores, deviceMemory: TIERS[tier].memory },
    qualityManagerSample: metrics,
    qualityManagerSampleAfterwards: later,
    dprFromSample: metrics?.dpr ?? null,
    frameTimeMs: { samples: deltas.length, medianMs: at(.5), p10Ms: at(.1), p95Ms: at(.95) },
    fpsFromFrameTime: deltas.length ? +(1000 / at(.5)).toFixed(1) : null,
  };
  await context.close();
}

// ─── Lifecycle / memory ─────────────────────────────────────────────────────
{
  const context = await newPage('high');
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window;
    w.__probe = { webglContexts: 0, visibilityListeners: 0, rafCalls: 0, timers: 0 };
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => { w.__probe.rafCalls++; return raf(cb); };
    const setTimeoutOriginal = window.setTimeout.bind(window);
    window.setTimeout = ((cb, ms, ...rest) => { w.__probe.timers++; return setTimeoutOriginal(cb, ms, ...rest); });
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(...args) {
      if (String(args[0] ?? '').startsWith('webgl')) w.__probe.webglContexts++;
      return getContext.apply(this, args);
    };
    const add = document.addEventListener.bind(document);
    const remove = document.removeEventListener.bind(document);
    document.addEventListener = ((type, ...rest) => { if (type === 'visibilitychange') w.__probe.visibilityListeners++; return add(type, ...rest); });
    document.removeEventListener = ((type, ...rest) => { if (type === 'visibilitychange') w.__probe.visibilityListeners--; return remove(type, ...rest); });
  });
  const modelRequests = [];
  page.on('request', r => { if (/\.glb$/.test(r.url())) modelRequests.push(r.url()); });
  const rounds = [];
  const heap = async () => page.evaluate(() => performance.memory?.usedJSHeapSize ?? null);
  for (let round = 0; round < 5; round++) {
    await page.goto(`${BASE}/intro`, { waitUntil: 'load' });
    await page.waitForSelector('[data-scene-state="ready"], [data-scene-state="fallback"]', { timeout: 90_000 });
    const live = await page.evaluate(() => ({
      canvases: document.querySelectorAll('canvas').length,
      metrics: JSON.parse(document.querySelector('canvas')?.dataset.worldMetrics ?? 'null'),
      ...window.__probe,
    }));
    await page.getByRole('link', { name: '略過動畫' }).click();
    await page.waitForURL(/\/$/, { timeout: 10_000 });
    await page.waitForTimeout(1_200);
    const after = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, ...window.__probe }));
    rounds.push({ round: round + 1, live, after, heapBytes: await heap(), modelRequests: modelRequests.length });
  }
  // hidden / paused / sleep must not keep rendering.
  await page.goto(`${BASE}/intro`, { waitUntil: 'load' });
  await page.waitForSelector('[data-scene-state="ready"], [data-scene-state="fallback"]', { timeout: 90_000 });
  const rafDelta = async (ms, prepare) => {
    if (prepare) await prepare();
    const before = await page.evaluate(() => window.__probe.rafCalls);
    await page.waitForTimeout(ms);
    const afterCount = await page.evaluate(() => window.__probe.rafCalls);
    return afterCount - before;
  };
  const runningRaf = await rafDelta(3_000);
  const hiddenRaf = await rafDelta(3_000, () => page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
  }));
  const visibleRaf = await rafDelta(2_000, () => page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => false });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    document.dispatchEvent(new Event('visibilitychange'));
  }));
  const pausedRaf = await rafDelta(3_000, async () => {
    const pause = page.getByRole('button', { name: '暫停小紅的旅程' });
    if (await pause.count()) await pause.click();
  });
  const leftRaf = await rafDelta(3_000, async () => {
    const resume = page.getByRole('button', { name: '繼續小紅的旅程' });
    if (await resume.count()) await resume.click();
    await page.getByRole('link', { name: '略過動畫' }).click();
    await page.waitForURL(/\/$/, { timeout: 10_000 });
  });
  report.lifecycle = {
    roundTrips: rounds,
    rafPerWindow: { runningIn3s: runningRaf, hiddenIn3s: hiddenRaf, visibleAgainIn2s: visibleRaf, pausedIn3s: pausedRaf, afterLeavingIn3s: leftRaf },
    heapNote: 'performance.memory is a GC-dependent JS heap number, not GPU memory; treat it as a trend, not a benchmark.',
  };
  await context.close();
}

// ─── Web vitals + interaction latency ───────────────────────────────────────
async function vitals(url, { warmContext } = {}) {
  const context = warmContext ?? await newPage('high');
  const page = await context.newPage();
  await page.addInitScript(() => {
    const w = window;
    w.__vitals = { lcp: 0, cls: 0 };
    new PerformanceObserver(list => { for (const e of list.getEntries()) w.__vitals.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => { for (const e of list.getEntries()) if (!e.hadRecentInput) w.__vitals.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(3_000);
  const measured = await page.evaluate(() => ({ lcp: +window.__vitals.lcp.toFixed(1), cls: +window.__vitals.cls.toFixed(4) }));
  if (!warmContext) await context.close(); else await page.close();
  return measured;
}

{
  const cold = [];
  for (let i = 0; i < 3; i++) cold.push({ run: i + 1, ...await vitals(`${BASE}/intro`) });
  const warmContext = await newPage('high');
  const warmup = await warmContext.newPage();
  await warmup.goto(`${BASE}/intro`, { waitUntil: 'load' });
  await warmup.waitForTimeout(2_000);
  await warmup.close();
  const warm = [];
  for (let i = 0; i < 3; i++) warm.push({ run: i + 1, ...await vitals(`${BASE}/intro`, { warmContext }) });
  await warmContext.close();

  const interaction = [];
  for (const scenario of ['ready', 'poster']) {
    for (let i = 0; i < 3; i++) {
      const context = await newPage('high');
      const page = await context.newPage();
      await page.goto(`${BASE}/intro`, { waitUntil: 'load' });
      if (scenario === 'ready') await page.waitForSelector('[data-scene-state="ready"]', { timeout: 90_000 });
      else await page.waitForSelector('[data-scene-state="poster"]');
      const measured = await page.evaluate(async () => {
        const link = [...document.querySelectorAll('a')].find(a => a.textContent?.includes('進入車車遊樂園'));
        const started = performance.now();
        link.click();
        // First paintable feedback: the transition attribute or the route change.
        await new Promise(resolve => {
          const check = () => (document.querySelector('[data-hero-world][data-entering="true"]') || location.pathname === '/' ? resolve() : requestAnimationFrame(check));
          check();
        });
        const feedback = performance.now() - started;
        await new Promise(resolve => { const check = () => (location.pathname === '/' ? resolve() : requestAnimationFrame(check)); check(); });
        return { feedbackMs: +feedback.toFixed(1), urlChangeMs: +(performance.now() - started).toFixed(1) };
      });
      interaction.push({ scenario, run: i + 1, ...measured });
      await context.close();
    }
  }
  report.webVitals = {
    lcpCls: { cold, warm, note: 'PerformanceObserver on /intro; lab numbers on a software renderer.' },
    enterInteraction: interaction,
    inp: 'not measured — no field data. Lab clicks are Event Timing proxies, not INP.',
  };
}

await writeFile(join(OUT, 'performance.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ ...report, loading: { ...report.loading, intro: { ...report.loading.intro, waterfall: `${report.loading.intro.waterfall.length} entries` } } }, null, 2));
await browser.close();
