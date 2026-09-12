/*
 * Production-only mobile performance gate.
 *
 * This intentionally starts next start, never next dev. Run npm run build
 * first, then npm run measure:mobile. The numbers are lab/simulated Chromium
 * evidence; they are not field data from iPhone Safari or Android Chrome.
 */
import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { join, resolve } from "node:path";

const OUT = resolve("docs/qa/mobile-performance");
const RUNS = 3;
const BASE_FROM_ENV = process.env.MOBILE_PERF_BASE ?? "";
const INTRO_GATE_KEY = "cheche:intro-seen-v1";
const PARALLAX_CSS_PATH = resolve("components/landing/hero-parallax/HeroParallax.module.css");

const PAGES = [
  { id: "intro", label: "Intro", path: "/intro", bypassIntro: false },
  { id: "landing", label: "Landing", path: "/", bypassIntro: true },
  { id: "stories", label: "Stories", path: "/stories", bypassIntro: true },
  { id: "story-detail", label: "Story detail", path: "/story/ep-6", bypassIntro: true },
  {
    id: "interactive",
    label: "Interactive main page",
    path: "/games/candy-match",
    bypassIntro: true,
  },
];

const PROFILES = [
  {
    id: "iphone-like",
    label: "iPhone-like",
    viewport: { width: 390, height: 844 },
    dpr: 3,
    cpuThrottle: 1,
  },
  {
    id: "android-mid",
    label: "Android mid-range",
    viewport: { width: 360, height: 800 },
    dpr: 2,
    cpuThrottle: 4,
  },
  {
    id: "android-low",
    label: "Android low-end simulation",
    viewport: { width: 360, height: 800 },
    dpr: 2,
    cpuThrottle: 6,
  },
];

const NETWORKS = [
  {
    id: "local",
    label: "local network",
    downloadThroughput: null,
    uploadThroughput: null,
    latency: 0,
  },
  {
    id: "slow-1.6mbps",
    label: "1.6 Mbps down / 750 Kbps up / 150 ms",
    downloadThroughput: 1_600_000 / 8,
    uploadThroughput: 750_000 / 8,
    latency: 150,
  },
];

const CASES = [
  { profile: PROFILES[0], network: NETWORKS[0] },
  { profile: PROFILES[1], network: NETWORKS[0] },
  { profile: PROFILES[2], network: NETWORKS[0] },
  { profile: PROFILES[0], network: NETWORKS[1] },
];

const sleep = (ms) => new Promise((resolvePromise) => setTimeout(resolvePromise, ms));

function round(value, digits = 1) {
  return value == null || !Number.isFinite(value)
    ? null
    : Number(value.toFixed(digits));
}

function median(values) {
  const finite = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!finite.length) return null;
  const middle = Math.floor(finite.length / 2);
  return finite.length % 2
    ? finite[middle]
    : (finite[middle - 1] + finite[middle]) / 2;
}

function maxFinite(values) {
  const finite = values.filter((value) => Number.isFinite(value));
  return finite.length ? Math.max(...finite) : null;
}

function pathOf(url) {
  try {
    const parsed = new URL(url);
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

function pathWithoutQuery(url) {
  return pathOf(url).split("?")[0];
}

function formatBytes(value) {
  if (!Number.isFinite(value)) return "n/a";
  if (value < 1024) return String(Math.round(value)) + " B";
  return (value / 1024).toFixed(value < 1024 * 1024 ? 1 : 2) + " KB";
}

function percentile(values, fraction) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))];
}

function performanceMetricMap(metrics) {
  const entries = Array.isArray(metrics) ? metrics : metrics?.metrics ?? [];
  return Object.fromEntries(entries.map((entry) => [entry.name, entry.value]));
}

async function findFreePort() {
  return new Promise((resolvePromise, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : null;
      server.close(() => resolvePromise(port));
    });
  });
}

async function waitForServer(base) {
  const deadline = Date.now() + 120_000;
  let lastError = "server did not answer";
  while (Date.now() < deadline) {
    try {
      const response = await fetch(base + "/intro", { redirect: "manual" });
      if (response.status < 500) return;
      lastError = "HTTP " + response.status;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(250);
  }
  throw new Error("Production server did not become ready: " + lastError);
}

async function startProductionServer() {
  if (BASE_FROM_ENV) {
    return { base: BASE_FROM_ENV.replace(/\/$/, ""), process: null };
  }
  if (!existsSync(".next/BUILD_ID")) {
    throw new Error("Missing .next/BUILD_ID. Run npm run build before npm run measure:mobile.");
  }
  const port = await findFreePort();
  const child = spawn("npm", ["run", "start", "--", "-p", String(port)], {
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? "https://podcast-website-mu.vercel.app",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  child.stdout.on("data", () => {});
  child.stderr.on("data", () => {});
  const base = "http://127.0.0.1:" + port;
  await waitForServer(base);
  return { base, process: child };
}

function installProbe(page) {
  return page.addInitScript(() => {
    const state = {
      lcp: null,
      lcpElement: null,
      fcp: null,
      cls: 0,
      layoutShifts: [],
      events: [],
      longTasks: [],
      heapSamples: [],
      frameTimes: [],
      appRafRequests: 0,
      appRafCallbacks: 0,
      activeTimeouts: 0,
      activeIntervals: 0,
      scrollListenerAdds: 0,
      webglContexts: 0,
    };
    window.__mobilePerf = state;

    const observe = (type, callback, options = {}) => {
      try {
        new PerformanceObserver(callback).observe({ type, buffered: true, ...options });
      } catch {
        // Older Chromium builds may not expose every observer type.
      }
    };

    observe("largest-contentful-paint", (list) => {
      for (const entry of list.getEntries()) {
        state.lcp = entry.startTime;
        state.lcpElement = entry.element?.tagName ?? null;
      }
    });
    observe("paint", (list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") state.fcp = entry.startTime;
      }
    });
    observe("layout-shift", (list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          state.cls += entry.value;
          state.layoutShifts.push({
            value: entry.value,
            startTime: entry.startTime,
            sources: (entry.sources ?? []).map((source) => {
              const node = source.node;
              const rect = (value) => value ? {
                x: Number(value.x.toFixed(1)),
                y: Number(value.y.toFixed(1)),
                width: Number(value.width.toFixed(1)),
                height: Number(value.height.toFixed(1)),
              } : null;
              return {
                node: node?.tagName ?? null,
                className: typeof node?.className === "string" ? node.className : null,
                id: node?.id ?? null,
                previousRect: rect(source.previousRect),
                currentRect: rect(source.currentRect),
              };
            }),
          });
        }
      }
    });
    observe("event", (list) => {
      for (const entry of list.getEntries()) {
        state.events.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          processingDelay:
            Number.isFinite(entry.processingStart) && Number.isFinite(entry.startTime)
              ? entry.processingStart - entry.startTime
              : null,
          interactionId: entry.interactionId ?? 0,
        });
      }
    }, { durationThreshold: 16 });
    observe("longtask", (list) => {
      for (const entry of list.getEntries()) {
        state.longTasks.push({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          attribution: (entry.attribution ?? []).map((item) => ({
            name: item.name ?? null,
            containerType: item.containerType ?? null,
            containerName: item.containerName ?? null,
            containerSrc: item.containerSrc ?? null,
          })),
        });
      }
    });

    const originalRaf = window.requestAnimationFrame.bind(window);
    const nativeRaf = originalRaf;
    window.requestAnimationFrame = (callback) => {
      state.appRafRequests += 1;
      return originalRaf((timestamp) => {
        state.appRafCallbacks += 1;
        callback(timestamp);
      });
    };
    window.__startMobileFrameSample = (durationMs) =>
      new Promise((resolvePromise) => {
        const frames = [];
        const started = performance.now();
        const sample = (timestamp) => {
          frames.push(timestamp);
          if (timestamp - started >= durationMs) {
            state.frameTimes = frames;
            const intervals = frames.slice(1).map((time, index) => time - frames[index]);
            resolvePromise({
              frames: frames.length,
              intervals: intervals.map((value) => Number(value.toFixed(3))),
              elapsedMs: Number((timestamp - started).toFixed(1)),
            });
            return;
          }
          nativeRaf(sample);
        };
        nativeRaf(sample);
      });

    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (type === "scroll") state.scrollListenerAdds += 1;
      return originalAddEventListener.call(this, type, listener, options);
    };

    const originalSetTimeout = window.setTimeout.bind(window);
    const originalSetInterval = window.setInterval.bind(window);
    const originalClearTimeout = window.clearTimeout.bind(window);
    const originalClearInterval = window.clearInterval.bind(window);
    window.setTimeout = (callback, delay, ...args) => {
      state.activeTimeouts += 1;
      return originalSetTimeout((...callbackArgs) => {
        state.activeTimeouts = Math.max(0, state.activeTimeouts - 1);
        if (typeof callback === "function") callback(...callbackArgs);
      }, delay, ...args);
    };
    window.setInterval = (callback, delay, ...args) => {
      state.activeIntervals += 1;
      return originalSetInterval(() => {
        if (typeof callback === "function") callback(...args);
      }, delay);
    };
    window.clearTimeout = (handle) => {
      state.activeTimeouts = Math.max(0, state.activeTimeouts - 1);
      return originalClearTimeout(handle);
    };
    window.clearInterval = (handle) => {
      state.activeIntervals = Math.max(0, state.activeIntervals - 1);
      return originalClearInterval(handle);
    };

    const originalCanvasGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (...args) {
      if (String(args[0] ?? "").startsWith("webgl")) state.webglContexts += 1;
      return originalCanvasGetContext.apply(this, args);
    };
  });
}

async function configureContext(context, page, profile, network) {
  const client = await context.newCDPSession(page);
  await client.send("Network.enable");
  await client.send("Network.setCacheDisabled", { cacheDisabled: true });
  await client.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuThrottle });
  if (network.downloadThroughput != null) {
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      downloadThroughput: network.downloadThroughput,
      uploadThroughput: network.uploadThroughput,
      latency: network.latency,
    });
  }
  await client.send("Performance.enable");
  return client;
}

async function makeContext(browser, pageDef, profile, network, reducedMotion = false) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.dpr,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block",
    reducedMotion: reducedMotion ? "reduce" : "no-preference",
  });
  if (pageDef.bypassIntro) {
    await context.addInitScript((key) => {
      try {
        sessionStorage.setItem(key, "1");
      } catch {
        // Storage may be disabled; the route is still measurable.
      }
    }, INTRO_GATE_KEY);
  }
  const page = await context.newPage();
  await installProbe(page);
  const client = await configureContext(context, page, profile, network);
  return { context, page, client };
}

function attachPageDiagnostics(page) {
  const consoleErrors = [];
  const pageErrors = [];
  const requests = [];
  const responseHeaders = new Map();
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("request", (request) => {
    if (!/^(data|blob):/.test(request.url())) {
      requests.push({
        url: request.url(),
        path: pathOf(request.url()),
        resourceType: request.resourceType(),
      });
    }
  });
  page.on("response", (response) => {
    try {
      const headers = response.headers();
      responseHeaders.set(pathOf(response.url()), {
        contentType: headers["content-type"] ?? "",
        contentLength: Number(headers["content-length"] ?? 0) || null,
      });
    } catch {
      // A response can disappear while a context is closing.
    }
  });
  return { consoleErrors, pageErrors, requests, responseHeaders };
}

async function collectImageDom(page) {
  return page.evaluate(() => Array.from(document.images).map((image) => {
    const box = image.getBoundingClientRect();
    const parent = image.parentElement;
    const parentBox = parent?.getBoundingClientRect();
    const imageStyle = getComputedStyle(image);
    const parentStyle = parent ? getComputedStyle(parent) : null;
    const hasWidth = image.hasAttribute("width");
    const hasHeight = image.hasAttribute("height");
    const layoutReserved = Boolean(
      parent &&
      imageStyle.position === "absolute" &&
      parentBox && parentBox.width > 0 && parentBox.height > 0 &&
      parentStyle && parentStyle.position !== "static",
    );
    return {
      src: image.currentSrc || image.src,
      alt: image.alt,
      naturalWidth: image.naturalWidth,
      naturalHeight: image.naturalHeight,
      renderedWidth: Number(box.width.toFixed(1)),
      renderedHeight: Number(box.height.toFixed(1)),
      top: Number(box.top.toFixed(1)),
      bottom: Number(box.bottom.toFixed(1)),
      inFirstViewport: box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth,
      loading: image.getAttribute("loading") ?? "auto",
      fetchPriority: image.getAttribute("fetchpriority") ?? "auto",
      hasWidth,
      hasHeight,
      layoutReserved,
      complete: image.complete,
    };
  }));
}

async function collectSnapshot(page, diagnostics) {
  const snapshot = await page.evaluate(() => {
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource").map((entry) => ({
      url: entry.name,
      path: new URL(entry.name).pathname + new URL(entry.name).search,
      initiatorType: entry.initiatorType,
      startTime: Number(entry.startTime.toFixed(1)),
      responseEnd: Number(entry.responseEnd.toFixed(1)),
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize,
      decodedBodySize: entry.decodedBodySize,
    }));
    const probe = window.__mobilePerf ?? {};
    const heap = performance.memory?.usedJSHeapSize ?? null;
    if (heap != null) probe.heapSamples.push({ at: performance.now(), bytes: heap });
    return {
      navigation: navigation
        ? {
            domContentLoaded: navigation.domContentLoadedEventEnd,
            load: navigation.loadEventEnd,
            transferSize: navigation.transferSize,
          }
        : null,
      vitals: {
        lcp: probe.lcp,
        lcpElement: probe.lcpElement,
        fcp: probe.fcp,
        cls: probe.cls,
        layoutShifts: probe.layoutShifts ?? [],
      },
      events: probe.events ?? [],
      longTasks: probe.longTasks ?? [],
      heapSamples: probe.heapSamples ?? [],
      resources,
      runtime: {
        canvases: document.querySelectorAll("canvas").length,
        webglContexts: probe.webglContexts ?? 0,
        activeTimeouts: probe.activeTimeouts ?? null,
        activeIntervals: probe.activeIntervals ?? null,
        scrollListenerAdds: probe.scrollListenerAdds ?? 0,
      },
    };
  });

  const resources = snapshot.resources.map((resource) => {
    const header = diagnostics.responseHeaders.get(resource.path) ?? {};
    const transferBytes =
      resource.transferSize || resource.encodedBodySize || header.contentLength || 0;
    const contentType = header.contentType ?? "";
    const isJavaScript = /\.js(?:$|\?)/i.test(resource.path) || contentType.includes("javascript");
    const isImage =
      contentType.startsWith("image/") ||
      /\.(avif|gif|jpe?g|png|svg|webp|ico)(?:$|\?)/i.test(resource.path);
    return {
      ...resource,
      transferBytes,
      contentType,
      isJavaScript,
      isImage,
    };
  });
  snapshot.resources = resources;
  snapshot.images = await collectImageDom(page);
  snapshot.network = {
    requestCount: diagnostics.requests.length,
    requests: diagnostics.requests,
  };
  snapshot.bytes = {
    total: (snapshot.navigation?.transferSize ?? 0) + resources.reduce((sum, item) => sum + item.transferBytes, 0),
    js: resources.filter((item) => item.isJavaScript).reduce((sum, item) => sum + item.transferBytes, 0),
    images: resources.filter((item) => item.isImage).reduce((sum, item) => sum + item.transferBytes, 0),
  };
  snapshot.errors = {
    console: [...diagnostics.consoleErrors],
    page: [...diagnostics.pageErrors],
  };
  snapshot.longTaskSummary = {
    over50ms: snapshot.longTasks.filter((task) => task.duration > 50).length,
    over100ms: snapshot.longTasks.filter((task) => task.duration > 100).length,
    longestMs: maxFinite(snapshot.longTasks.map((task) => task.duration)),
  };
  return snapshot;
}

async function runRepresentativeInteraction(page, pageDef, beforeSnapshot) {
  const candidates = [];
  if (pageDef.id === "intro") {
    candidates.push(page.getByRole("link", { name: "略過動畫" }));
  }
  if (pageDef.id === "story-detail") {
    candidates.push(page.getByRole("button", { name: /播放|play/i }).first());
  }
  candidates.push(page.getByRole("button").first());
  candidates.push(page.locator("a").first());

  let target = null;
  for (const candidate of candidates) {
    try {
      if (await candidate.count() && await candidate.isVisible()) {
        target = candidate;
        break;
      }
    } catch {
      // Continue to the next harmless candidate.
    }
  }
  if (!target) {
    return {
      supported: false,
      kind: "no-visible-interactive-target",
      latencyMs: null,
      processingDelayMs: null,
      eventEntries: [],
    };
  }

  const label = await target
    .evaluate((node) => (node.getAttribute("aria-label") || node.textContent || node.tagName).trim())
    .catch(() => "interactive target");
  const before = await page.evaluate(() => performance.now());
  const started = Date.now();
  let clickError = null;
  try {
    await target.click({ timeout: 5_000, noWaitAfter: true });
  } catch (error) {
    clickError = error instanceof Error ? error.message : String(error);
  }
  await page.waitForTimeout(350);
  const eventData = await page
    .evaluate((start) => {
      const entries = window.__mobilePerf?.events ?? [];
      return entries.filter((entry) =>
        entry.startTime >= start - 5 &&
        /click|pointer|touch|keydown|keypress/i.test(entry.name),
      );
    }, before)
    .catch(() => []);
  const durations = eventData.map((entry) => entry.duration).filter(Number.isFinite);
  const processingDelays = eventData.map((entry) => entry.processingDelay).filter(Number.isFinite);
  return {
    supported: true,
    kind: "representative-click",
    label,
    actionElapsedMs: Date.now() - started,
    latencyMs: round(maxFinite(durations)),
    processingDelayMs: round(maxFinite(processingDelays)),
    eventEntries: eventData,
    clickError,
    beforeSnapshot: {
      lcp: beforeSnapshot.vitals.lcp,
      cls: beforeSnapshot.vitals.cls,
    },
  };
}

function imageResourceFor(image, resources) {
  const key = pathOf(image.src);
  const withoutQuery = pathWithoutQuery(image.src);
  const exact = resources.find((resource) => resource.path === key);
  if (exact) return exact;
  if (withoutQuery.startsWith("/_next/image")) return null;
  return resources.find((resource) => pathWithoutQuery(resource.path) === withoutQuery) ?? null;
}

function enrichImageAudit(snapshot) {
  return snapshot.images.map((image) => {
    const resource = imageResourceFor(image, snapshot.resources);
    const headerFormat = resource?.contentType?.split("/")[1]?.split(";")[0] ?? null;
    const format = headerFormat || pathWithoutQuery(image.src).split(".").pop() || "unknown";
    const oversized =
      image.renderedWidth > 0 &&
      image.renderedHeight > 0 &&
      (image.naturalWidth > image.renderedWidth * 2 ||
        image.naturalHeight > image.renderedHeight * 2);
    return {
      ...image,
      format,
      transferBytes: resource?.transferBytes ?? 0,
      encodedBytes: resource?.encodedBodySize ?? 0,
      decodedBytes: resource?.decodedBodySize ?? 0,
      oversized,
    };
  });
}

async function measurePage(base, browser, pageDef, profile, network, run) {
  const { context, page } = await makeContext(browser, pageDef, profile, network);
  const diagnostics = attachPageDiagnostics(page);
  let navigationError = null;
  try {
    await page.goto(base + pageDef.path, { waitUntil: "load", timeout: 120_000 });
    await page.waitForTimeout(1_200);
  } catch (error) {
    navigationError = error instanceof Error ? error.message : String(error);
  }
  const snapshot = await collectSnapshot(page, diagnostics).catch((error) => ({
    navigation: null,
    vitals: { lcp: null, lcpElement: null, fcp: null, cls: null },
    events: [],
    longTasks: [],
    heapSamples: [],
    resources: [],
    images: [],
    network: { requestCount: diagnostics.requests.length, requests: diagnostics.requests },
    bytes: { total: 0, js: 0, images: 0 },
    runtime: { canvases: null, webglContexts: null, activeTimeouts: null, activeIntervals: null, scrollListenerAdds: null },
    longTaskSummary: { over50ms: 0, over100ms: 0, longestMs: null },
    errors: {
      console: diagnostics.consoleErrors,
      page: diagnostics.pageErrors.concat(error instanceof Error ? [error.message] : [String(error)]),
    },
  }));
  const images = enrichImageAudit(snapshot);
  const interaction = await runRepresentativeInteraction(page, pageDef, snapshot).catch((error) => ({
    supported: false,
    kind: "interaction-error",
    latencyMs: null,
    processingDelayMs: null,
    eventEntries: [],
    clickError: error instanceof Error ? error.message : String(error),
  }));
  const glbRequests = diagnostics.requests.filter((request) => /\.glb(?:$|\?)/i.test(request.url));
  const forbiddenChunkRequests = diagnostics.requests.filter((request) =>
    /three|react-three/i.test(request.url),
  );
  const result = {
    page: pageDef.id,
    pageLabel: pageDef.label,
    path: pageDef.path,
    profile: profile.id,
    profileLabel: profile.label,
    network: network.id,
    networkLabel: network.label,
    run,
    navigationError,
    vitals: snapshot.vitals,
    navigation: snapshot.navigation,
    bytes: snapshot.bytes,
    requestCount: snapshot.network.requestCount,
    longTasks: snapshot.longTasks,
    longTaskSummary: snapshot.longTaskSummary,
    heapSamples: snapshot.heapSamples,
    interaction,
    images,
    resources: snapshot.resources,
    runtime: {
      ...snapshot.runtime,
      glbRequests: glbRequests.length,
      forbiddenChunkRequests: forbiddenChunkRequests.length,
      forbiddenChunkUrls: forbiddenChunkRequests.map((request) => request.url),
      glbUrls: glbRequests.map((request) => request.url),
    },
    errors: snapshot.errors,
  };
  await context.close();
  return result;
}

function animationSnapshot(page) {
  return page.evaluate(() => {
    const animations = Array.from(document.getAnimations({ subtree: true }));
    return {
      mediaReduced: matchMedia("(prefers-reduced-motion: reduce)").matches,
      heroStage: document.querySelector("[data-hero-world]")?.getAttribute("data-stage") ?? null,
      heroRunning: document.querySelector("[data-hero-parallax]")?.getAttribute("data-running") ?? null,
      animations: animations.map((animation) => {
        const target = animation.effect?.getTiming ? animation.effect.getTiming() : {};
        const keyframes = animation.effect?.getKeyframes?.() ?? [];
        const properties = [...new Set(keyframes.flatMap((frame) => Object.keys(frame)))].filter(
          (key) => !["offset", "easing", "composite", "computedOffset"].includes(key),
        );
        const element = animation.effect?.target;
        const style = element ? getComputedStyle(element) : null;
        return {
          animationName: style?.animationName ?? null,
          playState: animation.playState,
          willChange: style?.willChange ?? null,
          properties,
          durationMs: target.duration ?? null,
          target: element?.className?.toString?.() ?? element?.tagName ?? null,
        };
      }),
    };
  });
}

async function measureParallaxCssContract(browser, profile) {
  const css = await readFile(PARALLAX_CSS_PATH, "utf8");
  const fixtureHtml = `
    <style>${css}</style>
    <div class="band" data-hero-parallax data-running="true"
      style="position:relative;width:360px;height:800px;--h:100px;--w:100px">
      <div class="layer l1"><div class="strip"></div></div>
      <div class="heroSlot"><div class="hero"></div></div>
    </div>`;

  const measureState = async (reducedMotion) => {
    const context = await browser.newContext({
      viewport: profile.viewport,
      deviceScaleFactor: profile.dpr,
      reducedMotion,
    });
    const page = await context.newPage();
    await page.setContent(fixtureHtml, { waitUntil: "load" });
    const state = await page.evaluate(async () => {
      const read = () => {
        const targets = [".strip", ".hero"].map((selector) => document.querySelector(selector));
        const animations = Array.from(document.getAnimations({ subtree: true })).filter((animation) =>
          targets.includes(animation.effect?.target),
        );
        return {
          computedPlayStates: targets.map((target) => getComputedStyle(target).animationPlayState),
          playStates: animations.map((animation) => animation.playState),
          animationCount: animations.length,
          properties: [...new Set(animations.flatMap((animation) =>
            (animation.effect?.getKeyframes?.() ?? []).flatMap((frame) => Object.keys(frame)),
          ))].filter((property) =>
            !["offset", "easing", "composite", "computedOffset"].includes(property),
          ),
        };
      };
      await new Promise((resolvePromise) => requestAnimationFrame(() => resolvePromise()));
      const running = read();
      document.querySelector(".band").setAttribute("data-running", "false");
      await new Promise((resolvePromise) => requestAnimationFrame(() => resolvePromise()));
      return { running, paused: read() };
    });
    await context.close();
    return state;
  };

  const normal = await measureState("no-preference");
  const reduced = await measureState("reduce");
  return {
    source: "components/landing/hero-parallax/HeroParallax.module.css",
    normal,
    reduced,
    hiddenPausedOrReduced: normal.paused.computedPlayStates.every((state) => state !== "running") &&
      normal.paused.playStates.every((state) => state !== "running"),
    reducedMotionStopped: reduced.running.animationCount === 0 &&
      reduced.paused.animationCount === 0,
    compositorPropertiesOnly: normal.running.properties.every((property) =>
      ["transform", "opacity"].includes(property),
    ),
  };
}

async function measureAnimation(base, browser, profile) {
  const pageDef = PAGES[0];
  const { context, page, client } = await makeContext(browser, pageDef, profile, NETWORKS[0]);
  const diagnostics = attachPageDiagnostics(page);
  await page.goto(base + "/intro", { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(1_000);
  const beforeMetrics = performanceMetricMap((await client.send("Performance.getMetrics")).metrics);
  const declarations = await animationSnapshot(page);
  const introAvailable = declarations.heroStage !== null || declarations.heroRunning !== null;
  const cssContract = introAvailable ? null : await measureParallaxCssContract(browser, profile);
  const cadence = introAvailable
    ? await page.evaluate((duration) => window.__startMobileFrameSample(duration), 10_000)
    : { intervals: [], note: "Intro is disabled and /intro redirected; cadence is not applicable." };
  const afterMetrics = performanceMetricMap((await client.send("Performance.getMetrics")).metrics);
  const intervals = cadence.intervals;
  const delayed = intervals.filter((value) => value > 25);
  const droppedApprox = intervals.reduce(
    (sum, value) => sum + Math.max(0, Math.round(value / (1000 / 60)) - 1),
    0,
  );

  const beforeHidden = introAvailable ? await animationSnapshot(page) : null;
  if (introAvailable) {
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
  }
  await page.waitForTimeout(introAvailable ? 350 : 0);
  const hidden = introAvailable
    ? await animationSnapshot(page)
    : { method: "css-contract-fixture", pausedOrReduced: cssContract.hiddenPausedOrReduced };
  if (introAvailable) {
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
  }
  await page.waitForTimeout(introAvailable ? 350 : 0);
  const visibleAgain = introAvailable ? await animationSnapshot(page) : null;

  const beforeLeave = introAvailable ? await page.evaluate(() => ({
    activeTimeouts: window.__mobilePerf?.activeTimeouts ?? null,
    activeIntervals: window.__mobilePerf?.activeIntervals ?? null,
  })) : null;
  if (introAvailable) await page.getByRole("link", { name: "略過動畫" }).click({ noWaitAfter: true }).catch(() => {});
  await page.waitForTimeout(introAvailable ? 1_200 : 0);
  const afterLeave = introAvailable ? await page.evaluate(() => ({
    url: location.pathname,
    heroCount: document.querySelectorAll("[data-hero-parallax]").length,
    heroAnimationCount: document.querySelector("[data-hero-parallax]")?.getAnimations({ subtree: true }).length ?? 0,
    animationCount: document.getAnimations({ subtree: true }).length,
    activeTimeouts: window.__mobilePerf?.activeTimeouts ?? null,
    activeIntervals: window.__mobilePerf?.activeIntervals ?? null,
  })).catch(() => ({
    url: page.url(),
    heroCount: null,
    heroAnimationCount: null,
    animationCount: null,
    activeTimeouts: null,
    activeIntervals: null,
  })) : null;

  const reduced = await measureReducedMotion(base, browser, profile);
  const metricDelta = (name) =>
    Number.isFinite(beforeMetrics[name]) && Number.isFinite(afterMetrics[name])
      ? round(afterMetrics[name] - beforeMetrics[name], 4)
      : null;
  const longTasks = (await page.evaluate(() => window.__mobilePerf?.longTasks ?? []).catch(() => []));
  const result = {
    profile: profile.id,
    profileLabel: profile.label,
    simulated: true,
    durationMs: 10_000,
    introAvailable,
    declarations,
    cssContract,
    frameCadence: {
      samples: intervals.length,
      p50IntervalMs: round(percentile(intervals, 0.5), 3),
      p95IntervalMs: round(percentile(intervals, 0.95), 3),
      maxIntervalMs: round(maxFinite(intervals), 3),
      delayedIntervalsOver25ms: delayed.length,
      droppedFramesApprox: droppedApprox,
      note: cadence.note ?? "Headless Chromium cadence approximation; not a real-device FPS claim.",
    },
    mainThreadDuringAnimation: {
      layoutCountDelta: metricDelta("LayoutCount"),
      recalcStyleCountDelta: metricDelta("RecalcStyleCount"),
      taskDurationDeltaMs: metricDelta("TaskDuration"),
      scriptDurationDeltaMs: metricDelta("ScriptDuration"),
    },
    hiddenTab: {
      before: beforeHidden,
      hidden,
      visibleAgain,
      pausedOrReduced: introAvailable
        ? hidden.heroRunning === "false" || hidden.animations.every((animation) => animation.playState !== "running")
        : cssContract.hiddenPausedOrReduced,
      method: introAvailable ? "runtime-visibilitychange" : "css-contract-fixture",
    },
    routeLeave: {
      available: introAvailable,
      before: beforeLeave,
      after: afterLeave,
      noHeroAfterLeave: introAvailable ? afterLeave.heroCount === 0 : null,
      noAnimationAfterLeave: introAvailable ? afterLeave.heroAnimationCount === 0 : null,
    },
    reducedMotion: reduced,
    scrollListenerAdds: await page.evaluate(() => window.__mobilePerf?.scrollListenerAdds ?? null).catch(() => null),
    longTasksOver100ms: longTasks.filter((task) => task.duration > 100),
    errors: {
      console: diagnostics.consoleErrors,
      page: diagnostics.pageErrors,
    },
  };
  await context.close();
  return result;
}

async function measureReducedMotion(base, browser, profile) {
  const { context, page } = await makeContext(browser, PAGES[0], profile, NETWORKS[0], true);
  const diagnostics = attachPageDiagnostics(page);
  await page.goto(base + "/intro", { waitUntil: "load", timeout: 120_000 });
  await page.waitForTimeout(700);
  const state = await animationSnapshot(page);
  const result = {
    mediaReduced: state.mediaReduced,
    animationCount: state.animations.length,
    runningAnimations: state.animations.filter((animation) => animation.playState === "running").length,
    heroRunning: state.heroRunning,
    canvases: await page.locator("canvas").count(),
    consoleErrors: diagnostics.consoleErrors,
    pageErrors: diagnostics.pageErrors,
  };
  await context.close();
  return result;
}

function summarizeCase(rows) {
  const metric = (getter) => round(median(rows.map(getter)));
  return {
    runs: rows.map((row) => ({
      run: row.run,
      lcp: row.vitals.lcp,
      fcp: row.vitals.fcp,
      cls: row.vitals.cls,
      interactionLatency: row.interaction.latencyMs,
      interactionProcessingDelay: row.interaction.processingDelayMs,
      dcl: row.navigation?.domContentLoaded ?? null,
      load: row.navigation?.load ?? null,
      totalBytes: row.bytes.total,
      jsBytes: row.bytes.js,
      imageBytes: row.bytes.images,
      requestCount: row.requestCount,
      longTasksOver50: row.longTaskSummary.over50ms,
      longTasksOver100: row.longTaskSummary.over100ms,
      longestTask: row.longTaskSummary.longestMs,
      heapEnd: row.heapSamples.at(-1)?.bytes ?? null,
    })),
    median: {
      lcp: metric((row) => row.vitals.lcp),
      fcp: metric((row) => row.vitals.fcp),
      cls: metric((row) => row.vitals.cls),
      interactionLatency: metric((row) => row.interaction.latencyMs),
      interactionProcessingDelay: metric((row) => row.interaction.processingDelayMs),
      dcl: metric((row) => row.navigation?.domContentLoaded),
      load: metric((row) => row.navigation?.load),
      totalBytes: metric((row) => row.bytes.total),
      jsBytes: metric((row) => row.bytes.js),
      imageBytes: metric((row) => row.bytes.images),
      requestCount: metric((row) => row.requestCount),
      longTasksOver50: metric((row) => row.longTaskSummary.over50ms),
      longTasksOver100: metric((row) => row.longTaskSummary.over100ms),
      longestTask: metric((row) => row.longTaskSummary.longestMs),
      heapEnd: metric((row) => row.heapSamples.at(-1)?.bytes),
    },
  };
}

function groupPageCases(rows) {
  const groups = new Map();
  for (const row of rows) {
    const key = row.page + "|" + row.profile + "|" + row.network;
    if (!groups.has(key)) {
      groups.set(key, {
        page: row.page,
        pageLabel: row.pageLabel,
        profile: row.profile,
        profileLabel: row.profileLabel,
        network: row.network,
        networkLabel: row.networkLabel,
        rows: [],
      });
    }
    groups.get(key).rows.push(row);
  }
  return [...groups.values()].map((group) => ({
    ...group,
    summary: summarizeCase(group.rows),
  }));
}

function worstPageSummary(pageDef, cases) {
  const matching = cases.filter((item) => item.page === pageDef.id);
  const chooseMax = (getter) => maxFinite(matching.map((item) => getter(item.summary.median)));
  const worstLcpCase = matching
    .filter((item) => Number.isFinite(item.summary.median.lcp))
    .sort((a, b) => b.summary.median.lcp - a.summary.median.lcp)[0];
  return {
    page: pageDef.id,
    label: pageDef.label,
    condition: worstLcpCase
      ? worstLcpCase.profileLabel + " / " + worstLcpCase.networkLabel
      : "no numeric LCP case",
    lcp: chooseMax((medianCase) => medianCase.lcp),
    cls: chooseMax((medianCase) => medianCase.cls),
    interactionLatency: chooseMax((medianCase) => medianCase.interactionLatency),
    longestTask: chooseMax((medianCase) => medianCase.longestTask),
    totalBytes: chooseMax((medianCase) => medianCase.totalBytes),
    jsBytes: chooseMax((medianCase) => medianCase.jsBytes),
    imageBytes: chooseMax((medianCase) => medianCase.imageBytes),
    requestCount: chooseMax((medianCase) => medianCase.requestCount),
  };
}

function imageAuditByPage(rows) {
  return PAGES.map((page) => {
    const first = rows.find((row) => row.page === page.id);
    const all = first?.images ?? [];
    const firstFold = all.filter((image) => image.inFirstViewport);
    return {
      page: page.id,
      label: page.label,
      firstFoldImages: firstFold,
      largeFirstFoldOver300KB: firstFold.filter((image) => image.transferBytes > 300 * 1024),
      oversizedFirstFold: firstFold.filter((image) => image.oversized),
      eagerBelowFold: all.filter((image) => !image.inFirstViewport && image.loading !== "lazy"),
      missingDimensions: all.filter((image) =>
        (!image.hasWidth || !image.hasHeight) && !image.layoutReserved,
      ),
    };
  });
}

function introGate(rows, animations) {
  const failures = [];
  for (const row of rows.filter((item) => item.page === "intro")) {
    if (row.runtime.canvases !== 0) failures.push("Intro canvas count was not zero.");
    if (row.runtime.webglContexts !== 0) failures.push("Intro created a WebGL context.");
    if (row.runtime.glbRequests !== 0) failures.push("Intro requested a GLB asset.");
    if (row.runtime.forbiddenChunkRequests !== 0) {
      failures.push("Intro requested a Three.js/react-three chunk.");
    }
  }
  for (const animation of animations) {
    if (!animation.introAvailable) {
      if (!animation.cssContract?.hiddenPausedOrReduced) {
        failures.push("Intro parallax CSS contract did not pause when data-running=false for " + animation.profile + ".");
      }
      if (!animation.cssContract?.reducedMotionStopped) {
        failures.push("Intro parallax CSS contract did not stop for reduced motion for " + animation.profile + ".");
      }
      if (!animation.cssContract?.compositorPropertiesOnly) {
        failures.push("Intro parallax CSS contract used a non-compositor property for " + animation.profile + ".");
      }
      continue;
    }
    if (!animation.reducedMotion.mediaReduced || animation.reducedMotion.runningAnimations !== 0) {
      failures.push("Intro reduced-motion check did not stop running animation for " + animation.profile + ".");
    }
    const disallowedProperties = animation.declarations.animations
      .flatMap((item) => item.properties)
      .filter((property) => !["transform", "opacity"].includes(property));
    if (disallowedProperties.length) {
      failures.push(
        "Intro animation used a non-compositor property for " + animation.profile +
        ": " + [...new Set(disallowedProperties)].join(", ") + ".",
      );
    }
    if (animation.routeLeave.available &&
      (!animation.routeLeave.noHeroAfterLeave || !animation.routeLeave.noAnimationAfterLeave)) {
      failures.push("Intro route-leave animation residue check failed for " + animation.profile + ".");
    }
  }
  return failures;
}

function gateResults(rows, cases, animations) {
  const failures = [];
  const warnings = [];
  for (const summary of PAGES.map((page) => worstPageSummary(page, cases))) {
    if (summary.lcp == null) warnings.push(summary.label + " has no LCP sample.");
    else if (summary.lcp > 2_500) failures.push(summary.label + " LCP median exceeded 2.5s.");
    if (summary.cls != null && summary.cls > 0.1) failures.push(summary.label + " CLS median exceeded 0.1.");
    if (summary.interactionLatency == null) warnings.push(summary.label + " has no Event Timing interaction sample.");
    else if (summary.interactionLatency > 200) failures.push(summary.label + " interaction latency exceeded 200ms.");
    if (summary.longestTask != null && summary.longestTask > 200) {
      failures.push(summary.label + " had a main-thread task over 200ms.");
    }
  }
  const longTaskSources = rows.flatMap((row) =>
    row.longTasks
      .filter((task) => task.duration > 100)
      .map((task) => ({
        page: row.page,
        profile: row.profile,
        network: row.network,
        run: row.run,
        durationMs: round(task.duration),
        source: task.attribution?.[0] ?? { name: task.name },
      })),
  );
  if (longTaskSources.length) warnings.push("Long tasks over 100ms require source review.");
  const errorRows = rows.filter((row) => row.errors.console.length || row.errors.page.length);
  if (errorRows.length) warnings.push("Console/page errors were observed; see latest.json.");
  failures.push(...introGate(rows, animations));
  return {
    status: failures.length ? "FAIL" : warnings.length ? "WARN" : "PASS",
    failures: [...new Set(failures)],
    warnings: [...new Set(warnings)],
    longTaskSources,
    animationChecks: animations.map((animation) => ({
      profile: animation.profile,
      introAvailable: animation.introAvailable,
      p50FrameIntervalMs: animation.frameCadence.p50IntervalMs,
      p95FrameIntervalMs: animation.frameCadence.p95IntervalMs,
      droppedFramesApprox: animation.frameCadence.droppedFramesApprox,
      layoutCountDelta: animation.mainThreadDuringAnimation.layoutCountDelta,
      recalcStyleCountDelta: animation.mainThreadDuringAnimation.recalcStyleCountDelta,
      hiddenPausedOrReduced: animation.hiddenTab.pausedOrReduced,
      reducedMotionStopped: animation.introAvailable
        ? animation.reducedMotion.runningAnimations === 0
        : animation.cssContract?.reducedMotionStopped ?? null,
      compositorPropertiesOnly: animation.introAvailable
        ? animation.declarations.animations
          .flatMap((item) => item.properties)
          .every((property) => ["transform", "opacity"].includes(property))
        : animation.cssContract?.compositorPropertiesOnly ?? null,
      routeLeaveClean: animation.routeLeave.available
        ? animation.routeLeave.noHeroAfterLeave && animation.routeLeave.noAnimationAfterLeave
        : null,
      hiddenCheckMethod: animation.hiddenTab.method,
    })),
  };
}

function mdNumber(value, digits = 0) {
  return value == null ? "n/a" : Number(value.toFixed(digits)).toString();
}

function mdBoolean(value) {
  return value == null ? "n/a" : value ? "yes" : "no";
}

function buildReport(report) {
  const lines = [
    "# Mobile Performance Gate",
    "",
    "Status: **" + report.gate.status + "**",
    "",
    "測試為 production build + next start 的 headless Chromium lab/simulated 結果；不是實體 iPhone Safari、Android Chrome 或 CrUX field metrics。",
    "",
    "Build: " + report.meta.buildId + "  · 測量時間: " + report.meta.measuredAt,
    "",
    "## Page summary",
    "",
    "以下是每頁所有模擬條件中「median 的最差值」；完整每次 cold run、條件與資源在 latest.json。",
    "",
    "| Page | 條件 | LCP ms | CLS | interaction ms | longest task ms | transfer | JS | images |",
    "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
  ];
  for (const page of report.pageSummaries) {
    lines.push(
      "| " + page.label +
      " | " + page.condition +
      " | " + mdNumber(page.lcp) +
      " | " + mdNumber(page.cls, 4) +
      " | " + mdNumber(page.interactionLatency) +
      " | " + mdNumber(page.longestTask) +
      " | " + formatBytes(page.totalBytes) +
      " | " + formatBytes(page.jsBytes) +
      " | " + formatBytes(page.imageBytes) + " |",
    );
  }
  if (report.baseline?.pageSummaries) {
    lines.push(
      "",
      "## Before / after evidence",
      "",
      "before.json 是初次 baseline；以下對照同一測試條件下的每頁最差 median，保留 threshold 未被放寬的證據。",
      "",
      "| Page | before LCP | after LCP | before CLS | after CLS | before longest task | after longest task |",
      "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    );
    for (const after of report.pageSummaries) {
      const before = report.baseline.pageSummaries.find((item) => item.page === after.page);
      lines.push(
        "| " + after.label +
        " | " + mdNumber(before?.lcp) +
        " | " + mdNumber(after.lcp) +
        " | " + mdNumber(before?.cls, 4) +
        " | " + mdNumber(after.cls, 4) +
        " | " + mdNumber(before?.longestTask) +
        " | " + mdNumber(after.longestTask) + " |",
      );
    }
  }
  lines.push(
    "",
    "Targets: LCP ≤ 2500ms · CLS ≤ 0.1 · representative Event Timing interaction ≤ 200ms · no main-thread task > 200ms.",
    "",
    "## Intro animation",
    "",
    "Frame interval numbers are simulated headless cadence approximations, not real-device FPS.",
    "若 `/intro` 因 feature flag redirect 到 `/`，Intro runtime 不會拿 Landing DOM 充當證據；hidden/reduced/compositor 檢查改以同一份 parallax CSS 的 contract fixture 驗證。",
    "",
    "| Profile | p50 interval | p95 interval | dropped approx | layout delta | style recalc delta | hidden paused | reduced motion | route leave |",
    "| --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- |",
  );
  for (const animation of report.gate.animationChecks) {
    lines.push(
      "| " + animation.profile +
      " | " + mdNumber(animation.p50FrameIntervalMs, 3) +
      " | " + mdNumber(animation.p95FrameIntervalMs, 3) +
      " | " + mdNumber(animation.droppedFramesApprox) +
      " | " + mdNumber(animation.layoutCountDelta) +
      " | " + mdNumber(animation.recalcStyleCountDelta) +
      " | " + mdBoolean(animation.hiddenPausedOrReduced) +
      " | " + mdBoolean(animation.reducedMotionStopped) +
      " | " + mdBoolean(animation.routeLeaveClean) + " |",
    );
  }
  lines.push("", "## Gate notes", "");
  if (report.gate.failures.length) {
    lines.push("FAIL:");
    for (const failure of report.gate.failures) lines.push("- " + failure);
    lines.push("");
  }
  if (report.gate.warnings.length) {
    lines.push("WARN:");
    for (const warning of report.gate.warnings) lines.push("- " + warning);
    lines.push("");
  }
  if (!report.gate.failures.length && !report.gate.warnings.length) lines.push("No gate failures or warnings.", "");
  lines.push(
    "## Main-thread task source list",
    "",
    "以下列出所有 >100ms long task；Chromium Long Tasks attribution 對主文件通常只回報 `window`/`unknown`，因此 unknown 是 API 能提供的來源，而不是省略量測。",
    "",
    "| Page | Profile | Network | Run | duration ms | source |",
    "| --- | --- | --- | ---: | ---: | --- |",
  );
  for (const task of report.gate.longTaskSources) {
    const source = task.source?.containerSrc || task.source?.name || "window/unknown";
    lines.push(
      "| " + task.page +
      " | " + task.profile +
      " | " + task.network +
      " | " + task.run +
      " | " + mdNumber(task.durationMs, 1) +
      " | " + source.replaceAll("|", "\\|") + " |",
    );
  }
  if (!report.gate.longTaskSources.length) lines.push("| n/a | n/a | n/a | n/a | n/a | none |", "");
  else lines.push("");
  lines.push(
    "## Image audit",
    "",
    "首屏圖片、intrinsic/rendered 尺寸、transfer bytes、format、eager/lazy 與 width/height 契約在 latest.json 的 imageAudit。",
    "",
    "## Interpretation",
    "",
    "- before.json 是此 gate 第一次執行的 baseline；若後續只因 FAIL 做優化，請以它和本檔比較 before/after。",
    "- JS heap 是 browser performance.memory 的 GC-dependent trend，不能代表 GPU memory。",
    "- 實體裝置仍需確認 Safari/Chrome 的合成器、圖片 decode、電池／熱 throttling、觸控輸入與真實網路。",
    "",
  );
  return lines.join("\n");
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const server = await startProductionServer();
  const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}),
  });
  const startedAt = new Date().toISOString();
  const pageRows = [];
  const totalRuns = PAGES.length * CASES.length * RUNS;
  let completedRuns = 0;
  try {
    for (const pageDef of PAGES) {
      for (const testCase of CASES) {
        for (let run = 1; run <= RUNS; run += 1) {
          const row = await measurePage(
            server.base,
            browser,
            pageDef,
            testCase.profile,
            testCase.network,
            run,
          );
          pageRows.push(row);
          completedRuns += 1;
          console.log(
            "[" + completedRuns + "/" + totalRuns + "] " +
            pageDef.id + " " + testCase.profile.id + " " + testCase.network.id + " run " + run,
          );
        }
      }
    }

    const animationRows = [];
    for (const profile of PROFILES) {
      console.log("Animation sample: " + profile.id + " (10 seconds simulated)");
      animationRows.push(await measureAnimation(server.base, browser, profile));
    }

    const cases = groupPageCases(pageRows);
    const report = {
      meta: {
        buildId,
        base: server.base,
        browser: "Chromium " + browser.version() + " (Playwright headless)",
        simulated: true,
        productionServer: true,
        measuredAt: startedAt,
        completedAt: new Date().toISOString(),
        coldRunsPerCase: RUNS,
        profiles: PROFILES,
        networks: NETWORKS,
        cases: CASES.map((testCase) => ({
          profile: testCase.profile.id,
          network: testCase.network.id,
        })),
        note: "Lab/simulated only; do not present as field metrics.",
      },
      pageSummaries: PAGES.map((page) => worstPageSummary(page, cases)),
      cases,
      imageAudit: imageAuditByPage(pageRows),
      intro: {
        invariants: pageRows
          .filter((row) => row.page === "intro")
          .map((row) => ({
            profile: row.profile,
            network: row.network,
            run: row.run,
            canvases: row.runtime.canvases,
            webglContexts: row.runtime.webglContexts,
            glbRequests: row.runtime.glbRequests,
            forbiddenChunkRequests: row.runtime.forbiddenChunkRequests,
          })),
      },
      animation: animationRows,
    };
    if (existsSync(join(OUT, "before.json"))) {
      const baseline = JSON.parse(await readFile(join(OUT, "before.json"), "utf8"));
      report.baseline = {
        buildId: baseline.meta?.buildId ?? null,
        measuredAt: baseline.meta?.measuredAt ?? null,
        pageSummaries: baseline.pageSummaries ?? [],
        gate: baseline.gate ?? null,
      };
    } else {
      report.baseline = null;
    }
    report.gate = gateResults(pageRows, cases, animationRows);
    const latestPath = join(OUT, "latest.json");
    if (!existsSync(join(OUT, "before.json"))) {
      await writeFile(join(OUT, "before.json"), JSON.stringify(report, null, 2) + "\n");
    }
    await writeFile(latestPath, JSON.stringify(report, null, 2) + "\n");
    await writeFile(join(OUT, "REPORT.md"), buildReport(report) + "\n");
    console.log(JSON.stringify({
      status: report.gate.status,
      failures: report.gate.failures,
      warnings: report.gate.warnings,
      output: latestPath,
    }, null, 2));
    if (report.gate.status === "FAIL") process.exitCode = 1;
  } finally {
    await browser.close();
    if (server.process) {
      server.process.kill("SIGTERM");
      await sleep(300);
      if (!server.process.killed) server.process.kill("SIGKILL");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
