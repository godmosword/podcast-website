// 2026-09-11：Intro 預設舞台已切為橫向 2.5D 視差帶（無 canvas、無 GLB）。這支腳本量的是
// 3D 舞台的指標（DPR、frame time、GLB 傳輸），所以固定走 `?stage=world` 的回滾舞台。
// 要量視差帶請直接用 e2e/intro-portal.spec.ts 的契約與 visual baseline。
// Phase 12 的**模擬**部分：跨 viewport 版面、旋轉與網路條件。
// 這支腳本跑在 headless Chromium（軟體算圖）上，**不能代替實體 iPhone／Android**；
// SPEC §15.1 要求模擬結果獨立列，所以輸出的每一列都標了 engine 與 emulated:true。
import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const BASE = process.env.INTRO_QA_BASE ?? 'http://127.0.0.1:3000';
const OUT = resolve(process.argv.find(a => a.startsWith('--out='))?.slice('--out='.length)
  ?? 'docs/qa/intro-portal/phase12-20260908/emulated');
await mkdir(OUT, { recursive: true });

const VIEWPORTS = [
  { name: '320x568', width: 320, height: 568, dpr: 2, kind: 'narrow phone' },
  { name: '360x800', width: 360, height: 800, dpr: 3, kind: 'phone' },
  { name: '375x812', width: 375, height: 812, dpr: 3, kind: 'phone' },
  { name: '390x844', width: 390, height: 844, dpr: 3, kind: 'phone' },
  { name: '414x896', width: 414, height: 896, dpr: 2, kind: 'phone' },
  { name: '430x932', width: 430, height: 932, dpr: 3, kind: 'phone' },
  { name: '844x390', width: 844, height: 390, dpr: 3, kind: 'short landscape' },
  { name: '768x1024', width: 768, height: 1024, dpr: 2, kind: 'tablet portrait' },
  { name: '1024x768', width: 1024, height: 768, dpr: 2, kind: 'tablet landscape' },
  { name: '1440x900', width: 1440, height: 900, dpr: 2, kind: 'desktop' },
];

const browser = await chromium.launch({ headless: true, ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}) });
const engine = `Chromium ${browser.version()} (Playwright, headless, SwiftShader)`;

async function inspect(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const node = document.querySelector(selector);
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { x: +box.x.toFixed(1), y: +box.y.toFixed(1), w: +box.width.toFixed(1), h: +box.height.toFixed(1) };
    };
    const link = [...document.querySelectorAll('a')];
    const enter = link.find(a => a.textContent?.includes('進入車車遊樂園'));
    const skip = link.find(a => a.textContent?.includes('略過動畫'));
    const boxOf = (node) => {
      if (!node) return null;
      const box = node.getBoundingClientRect();
      return { x: +box.x.toFixed(1), y: +box.y.toFixed(1), w: +box.width.toFixed(1), h: +box.height.toFixed(1),
        inViewport: box.top >= 0 && box.bottom <= innerHeight && box.left >= 0 && box.right <= innerWidth };
    };
    const canvas = document.querySelector('[data-hero-world] canvas');
    return {
      state: document.querySelector('[data-hero-world]')?.getAttribute('data-scene-state') ?? null,
      canvases: document.querySelectorAll('[data-hero-world] canvas').length,
      horizontalOverflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      heading: rect('h1'),
      enter: boxOf(enter),
      skip: boxOf(skip),
      pause: boxOf(document.querySelector('[data-hero-world] button')),
      stage: rect('[data-hero-stage]'),
      canvasCss: canvas ? { w: +canvas.getBoundingClientRect().width.toFixed(1), h: +canvas.getBoundingClientRect().height.toFixed(1) } : null,
      renderDpr: canvas ? +(canvas.width / canvas.getBoundingClientRect().width).toFixed(3) : null,
      viewport: { innerWidth, innerHeight, devicePixelRatio },
    };
  });
}

const rows = [];
for (const viewport of VIEWPORTS) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.dpr,
    serviceWorkers: 'block',
    isMobile: viewport.width <= 500,
    hasTouch: viewport.width <= 500,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/intro?stage=world`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  const poster = await inspect(page);
  await page.screenshot({ path: join(OUT, `${viewport.name}-poster.png`) });
  await page.waitForSelector('[data-scene-state="ready"], [data-scene-state="fallback"]', { timeout: 120_000 }).catch(() => {});
  await page.waitForTimeout(600);
  const ready = await inspect(page);
  await page.screenshot({ path: join(OUT, `${viewport.name}-ready.png`) });

  // Orientation change on the phone-sized viewports: rotate and re-check.
  let rotated = null;
  if (viewport.kind !== 'desktop') {
    await page.setViewportSize({ width: viewport.height, height: viewport.width });
    await page.waitForTimeout(900);
    rotated = await inspect(page);
    await page.screenshot({ path: join(OUT, `${viewport.name}-rotated.png`) });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(600);
  }

  // Enter and land, then check the Landing layout at the same viewport.
  await page.getByRole('link', { name: /進入車車遊樂園/ }).click();
  await page.waitForURL(/\/$/, { timeout: 15_000 }).catch(() => {});
  await page.waitForTimeout(900);
  const landing = await page.evaluate(() => ({
    url: location.pathname,
    horizontalOverflowPx: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    landingRoot: Boolean(document.querySelector('[data-landing-root]')),
    activeElement: document.activeElement?.id ?? '',
    heroCanvases: document.querySelectorAll('canvas').length,
  }));
  await page.screenshot({ path: join(OUT, `${viewport.name}-landing.png`) });
  rows.push({ ...viewport, engine, emulated: true, poster, ready, rotated, landing });
  await context.close();
}

// ─── Network conditions at 390x844 ──────────────────────────────────────────
const networks = [];
async function networkCase(name, prepare, { expectModels = true } = {}) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, serviceWorkers: 'block', isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const models = [];
  const errors = [];
  page.on('request', r => { if (/\.glb$/.test(r.url())) models.push(r.url()); });
  page.on('pageerror', e => errors.push(e.message));
  await prepare({ context, page });
  await page.goto(`${BASE}/intro?stage=world`, { waitUntil: 'domcontentloaded' }).catch(() => {});
  await page.waitForTimeout(1_200);
  const early = await inspect(page);
  await page.waitForTimeout(expectModels ? 30_000 : 4_000);
  const settled = await inspect(page);
  // Enter must never wait for 3D under any network condition.
  const started = Date.now();
  await page.getByRole('link', { name: /進入車車遊樂園/ }).click().catch(() => {});
  const entered = await page.waitForURL(/\/$/, { timeout: 15_000 }).then(() => true).catch(() => false);
  networks.push({ name, engine, emulated: true, earlyState: early.state, settledState: settled.state,
    modelRequests: models.length, uniqueModels: new Set(models.map(u => u.split('/').pop())).size,
    enterOk: entered, enterMs: Date.now() - started, pageErrors: errors });
  await context.close();
}

await networkCase('wifi (no throttling)', async () => {});
await networkCase('slow (400kbps, 400ms RTT)', async ({ context, page }) => {
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  await session.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 400 * 1024 / 8, uploadThroughput: 400 * 1024 / 8, latency: 400 });
});
await networkCase('offline', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'onLine', { get: () => false }));
}, { expectModels: false });
await networkCase('Save-Data', async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: { saveData: true, effectiveType: '4g', addEventListener() {}, removeEventListener() {} },
  }));
}, { expectModels: false });
await networkCase('GLB 404 (failure fallback)', async ({ page }) => {
  await page.route(/\.glb$/, route => route.fulfill({ status: 404, contentType: 'text/plain', body: 'missing' }));
}, { expectModels: false });

const report = { meta: { base: BASE, engine, emulated: true, note: 'Chromium emulation only. Not a substitute for physical iPhone Safari or Android Chrome.', measuredAt: new Date().toISOString() }, viewports: rows, networks };
await writeFile(join(OUT, 'crossdevice.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ viewports: rows.map(r => ({ name: r.name, state: r.ready.state, overflow: r.ready.horizontalOverflowPx, enter: r.ready.enter, renderDpr: r.ready.renderDpr, rotatedOverflow: r.rotated?.horizontalOverflowPx ?? null, landing: r.landing })), networks }, null, 2));
await browser.close();
