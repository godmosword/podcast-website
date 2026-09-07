// Dynamic evidence for SPEC §V03/V04 and the auto-invite ADR: short recordings
// of the greeting and exit, a throttled first-visit redirect, and the Landing
// request waterfall. Requires a production server: `npm run build && npm run start`.
import { chromium } from 'playwright';
import { mkdir, rename, writeFile, readdir } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const out = resolve(process.argv[2] ?? 'docs/qa/intro-portal/dynamic-evidence-20260907');
await mkdir(out, { recursive: true });
const videos = join(out, 'recordings');
await mkdir(videos, { recursive: true });

const browser = await chromium.launch();
const summary = {};

async function saveVideo(page, name) {
  const video = page.video();
  if (!video) return null;
  const raw = await video.path();
  const target = join(videos, `${name}.webm`);
  await rename(raw, target).catch(async () => {
    await video.saveAs(target);
  });
  return `recordings/${name}.webm`;
}

// V03 — the greeting and the exit, as motion rather than stills.
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videos, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const phases = [];
  await page.goto(`${base}/intro`, { waitUntil: 'domcontentloaded' });
  const started = Date.now();
  const hero = page.locator('[data-hero-world]');
  let last = null;
  while (Date.now() - started < 22_000) {
    const phase = await hero.getAttribute('data-motion-phase');
    const state = await hero.getAttribute('data-scene-state');
    if (phase !== last) { phases.push({ atMs: Date.now() - started, phase, state }); last = phase; }
    if (phase === 'continue' && Date.now() - started > 9_000) break;
    await page.waitForTimeout(100);
  }
  const sceneState = await hero.getAttribute('data-scene-state');
  if (sceneState === 'ready') {
    await page.getByRole('link', { name: /進入車車遊樂園/ }).click();
    await page.waitForURL(/\?enter=1$/, { timeout: 5_000 });
    await page.waitForTimeout(800);
  }
  await page.close();
  await context.close();
  summary.greetingAndExit = { sceneState, phases, video: await saveVideo(page, 'greeting-and-exit-desktop') };
}

// Auto-invite flicker under a slow CPU (input for the ADR in item 6).
for (const rate of [1, 6]) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    recordVideo: { dir: videos, size: { width: 390, height: 844 } },
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const marks = [];
  page.on('framenavigated', (frame) => {
    if (frame === page.mainFrame()) marks.push({ atMs: Date.now() - t0, url: frame.url() });
  });
  const t0 = Date.now();
  await page.goto(`${base}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForURL(/\/intro$/, { timeout: 20_000 }).catch(() => {});
  const redirectedAt = Date.now() - t0;
  await page.waitForTimeout(2_500);
  await page.close();
  await context.close();
  summary[`firstVisitRedirect_cpu${rate}x`] = {
    cpuThrottling: `${rate}x`,
    redirectedAfterMs: redirectedAt,
    navigations: marks,
    video: await saveVideo(page, `first-visit-redirect-cpu${rate}x`),
  };
}

// Landing must never download Three.js or a GLB.
{
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const requests = [];
  const t0 = Date.now();
  page.on('response', async (response) => {
    const request = response.request();
    let bytes = null;
    try { bytes = (await request.sizes()).responseBodySize; } catch { /* transfer size unavailable */ }
    requests.push({
      atMs: Date.now() - t0,
      type: request.resourceType(),
      status: response.status(),
      bytes,
      url: new URL(response.url()).pathname,
    });
  });
  await page.goto(`${base}/?enter=1`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1_500);
  const scripts = requests.filter((entry) => entry.type === 'script');
  const bodies = await Promise.all(scripts.map(async (entry) => {
    const response = await page.request.get(`${base}${entry.url}`);
    const text = await response.text();
    return { url: entry.url, three: /THREE\.|WebGLRenderer|react-three-fiber/.test(text) };
  }));
  await context.close();
  summary.landingWaterfall = {
    url: '/?enter=1',
    totalRequests: requests.length,
    glbRequests: requests.filter((entry) => entry.url.endsWith('.glb')).map((entry) => entry.url),
    modelPathRequests: requests.filter((entry) => entry.url.includes('/models/hero-world/')).map((entry) => entry.url),
    scriptsContainingThree: bodies.filter((entry) => entry.three).map((entry) => entry.url),
    requests: requests.sort((a, b) => a.atMs - b.atMs),
  };
}

await browser.close();
await writeFile(join(out, 'dynamic-evidence.json'), JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify({
  greeting: summary.greetingAndExit?.sceneState,
  phases: summary.greetingAndExit?.phases?.map((p) => p.phase),
  redirect1x: summary.firstVisitRedirect_cpu1x?.redirectedAfterMs,
  redirect6x: summary.firstVisitRedirect_cpu6x?.redirectedAfterMs,
  glb: summary.landingWaterfall?.glbRequests,
  three: summary.landingWaterfall?.scriptsContainingThree,
  videos: await readdir(videos),
}, null, 2));
