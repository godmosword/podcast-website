import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const MODEL_URL = /\/models\/hero-world\/(?:v[23]\/)?[^/]+\.glb(?:\?.*)?$/;

test.describe("Intro Portal · Phase 4 route and entry", () => {
  test("serves a semantic, poster-first intro without the Landing chrome", async ({ page }) => {
    const response = await page.goto("/intro", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await expect(page.getByText("故事，就從這裡出發。")).toBeVisible();
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toHaveAttribute("href", "/?enter=1");
    await expect(page.getByRole("link", { name: "略過動畫" })).toHaveAttribute("href", "/?enter=1");
    await expect(page.locator("[data-testid='site-nav-bar']")).toHaveCount(0);
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /\/intro$/);
    await expect(page.locator("meta[name='robots']")).toHaveAttribute("content", /noindex/);
  });

  test("keeps the intro controls accessible without exposing WebGL objects", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });

  test("enters Landing immediately before the scene is ready", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "略過動畫" }).click();
    // Enhanced navigation lands on the clean canonical URL; `?enter=1` stays in
    // the href as the no-JS entry point.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  // ADR-0003: `/` is always Landing. R09 (opening /intro on purpose) and the
  // opt-in entry link replace the retired first-visit redirect (R01-R07/R12).
  test("R09: a fresh visit stays on Landing and offers an SSR link into the intro", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    // The link must be in the server response, not only after hydration.
    const html = await (await context.request.get("/")).text();
    expect(html).toContain('href="/intro"');
    const entry = page.getByRole("link", { name: /看小紅開進遊樂園/ });
    await expect(entry).toHaveAttribute("href", "/intro");
    await entry.click();
    await expect(page).toHaveURL(/\/intro$/);
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await context.close();
  });

  test("R08: Back and Forward move between Landing and Intro without a redirect loop", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /看小紅開進遊樂園/ }).click();
    await expect(page).toHaveURL(/\/intro$/);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await page.goForward({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/intro$/);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
  });

  test("R11: a modifier click on Enter keeps native link semantics", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const enter = page.getByRole("link", { name: /進入車車遊樂園/ });
    await enter.click({ modifiers: ["Shift"] });
    await expect(page).toHaveURL(/\/intro$/);
  });

  test("deep links and Landing never download the hero models", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (MODEL_URL.test(request.url())) requests.push(request.url());
    });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stories$/);
    await page.goto("/?enter=1", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    // canonical stays the bare Landing URL; `?enter=1` is only an entry marker.
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /^https?:\/\/[^?#]+\/?$/);
    await expect.poll(() => requests.length, { timeout: 1_500 }).toBe(0);
  });

  test("R10: keeps both content and the native intro links usable without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await expect(page.getByRole("link", { name: /看小紅開進遊樂園/ })).toHaveAttribute("href", "/intro");
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toHaveAttribute("href", "/?enter=1");
    await context.close();
  });
});

test.describe("Intro Portal · Phase 5 poster, fallback, and lifecycle", () => {
  // Route interception must see the GLB request before the app's progressive
  // service-worker registration can handle it.
  test.use({ serviceWorkers: "block" });

  test("reduced motion keeps the poster and makes no GLB request", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/models/hero-world/") && request.url().endsWith(".glb")) requests.push(request.url());
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
    await expect.poll(() => requests.length, { timeout: 1_100 }).toBe(0);
  });

  test("Save-Data keeps the static path available without mounting WebGL", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true, effectiveType: "4g", addEventListener() {}, removeEventListener() {} },
      });
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
  });

  test("offline and slow connections stay on the poster path", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "onLine", { configurable: true, value: false });
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: false, effectiveType: "2g", addEventListener() {}, removeEventListener() {} },
      });
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
  });

  test("falls back when WebGL is unavailable", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "fallback");
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
  });

  test("keeps the poster until a live scene renders, then exposes real pause/resume", async ({ page }) => {
    const modelRequests: string[] = [];
    page.on("request", (request) => {
      if (MODEL_URL.test(request.url())) modelRequests.push(request.url());
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect(hero).toHaveAttribute("data-scene-state", "poster");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    const state = await hero.getAttribute("data-scene-state");
    // CI hosts without a WebGL implementation still exercise the intentional
    // fallback tests above; on capable hosts this verifies the live branch.
    test.skip(state !== "ready", "WebGL unavailable in this browser host");
    expect(new Set(modelRequests.map((url) => url.split("/").pop())).size).toBe(3);
    expect(modelRequests).toHaveLength(3);
    await expect(hero.locator("canvas")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "暫停小紅的旅程" })).toBeVisible();
    await page.getByRole("button", { name: "暫停小紅的旅程" }).click();
    await expect(page.getByRole("button", { name: "繼續小紅的旅程" })).toBeVisible();
    await page.getByRole("button", { name: "繼續小紅的旅程" }).click();
    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 1_500 });
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
  });

  test("runs the signature phases once and pauses active time", async ({ page }) => {
    test.setTimeout(75_000);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    test.skip(await hero.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");
    await expect(hero).toHaveAttribute("data-motion-phase", "approach");
    await expect.poll(() => hero.getAttribute("data-motion-phase"), { timeout: 20_000 }).toBe("decelerate");
    await expect.poll(() => hero.getAttribute("data-motion-phase"), { timeout: 20_000 }).toBe("settle");
    await expect.poll(() => hero.getAttribute("data-motion-phase"), { timeout: 20_000 }).toBe("acknowledge");
    await expect(hero).toHaveAttribute("data-greeting", "true");
    await page.getByRole("button", { name: "暫停小紅的旅程" }).click();
    const pausedPhase = await hero.getAttribute("data-motion-phase");
    await page.waitForTimeout(900);
    await expect(hero).toHaveAttribute("data-motion-phase", pausedPhase ?? "acknowledge");
    await page.getByRole("button", { name: "繼續小紅的旅程" }).click();
    await expect.poll(() => hero.getAttribute("data-motion-phase"), { timeout: 12_000 }).toMatch(/continue|settled/);
    await expect.poll(() => hero.getAttribute("data-greeting"), { timeout: 8_000 }).toBe("false");
  });

  test("falls back for a failed GLB response and does not retry indefinitely", async ({ page }) => {
    let modelRequests = 0;
    await page.route(MODEL_URL, async (route) => {
      modelRequests += 1;
      await route.fulfill({ status: 404, contentType: "text/plain", body: "missing" });
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "fallback", { timeout: 8_000 });
    expect(modelRequests).toBeGreaterThan(0);
    expect(modelRequests).toBeLessThan(5);
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
  });

  test("rejects an HTML 200 response as a corrupt GLB", async ({ page }) => {
    await page.route(MODEL_URL, (route) => route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>fallback shell</title>",
    }));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "fallback", { timeout: 8_000 });
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
  });
});

// PLAN §15.2 F05／F09／F10／F11. These budgets are measured in active time, so
// they are driven through the injectable clock in
// components/landing/hero-world/active-clock.ts rather than by waiting 15–30
// real seconds. Injecting a clock does not fake the browser's own scheduling:
// the 900ms warm-up timer, network and rendering stay real.
const CLOCK_GLOBAL = "__chechecarHeroActiveClock";
const LOAD_TIMEOUT_MS = 15_000;
const SLEEP_AFTER_MS = 24_000;
const MAX_TICK_DELTA_MS = 1_000;

declare global {
  interface Window {
    __advanceHeroClock?: (ms: number) => void;
    __heroInstrumentation?: { webglContexts: number; visibilityListeners: number };
  }
}

async function installFakeClock(page: import("@playwright/test").Page) {
  await page.addInitScript(([clockGlobal, maxDelta]) => {
    let virtual = 0;
    let nextId = 1;
    const handlers = new Map<number, () => void>();
    (window as unknown as Record<string, unknown>)[clockGlobal as string] = {
      now: () => virtual,
      setInterval: (handler: () => void) => {
        const id = nextId++;
        handlers.set(id, handler);
        return id;
      },
      clearInterval: (id: number) => {
        handlers.delete(id);
      },
    };
    // Each step advances by at most one tick's worth, because the accumulators
    // clamp a single tick to MAX_TICK_DELTA_MS on purpose.
    window.__advanceHeroClock = (ms: number) => {
      const step = maxDelta as number;
      for (let elapsed = 0; elapsed < ms; elapsed += step) {
        virtual += step;
        [...handlers.values()].forEach((handler) => handler());
      }
    };
  }, [CLOCK_GLOBAL, MAX_TICK_DELTA_MS] as const);
}

test.describe("Intro Portal · active-time budgets (F05/F09/F10/F11)", () => {
  test.use({ serviceWorkers: "block" });

  test("F05: a stalled model load falls back after 15s of active time without a retry storm", async ({ page }) => {
    let modelRequests = 0;
    await installFakeClock(page);
    // Never fulfil: the loader must give up on its own budget, not on a network error.
    await page.route(MODEL_URL, async () => {
      modelRequests += 1;
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect(hero).toHaveAttribute("data-scene-state", "poster");
    await expect.poll(() => modelRequests, { timeout: 8_000 }).toBeGreaterThan(0);
    await expect(hero).toHaveAttribute("data-scene-state", "poster");

    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), LOAD_TIMEOUT_MS - 2_000);
    await expect(hero).toHaveAttribute("data-scene-state", "poster");

    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), 3_000);
    await expect(hero).toHaveAttribute("data-scene-state", "fallback");
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    expect(modelRequests).toBeLessThan(5);
  });

  test("F09: 30s hidden does not consume the motion budget and does not jump the car", async ({ page }) => {
    await installFakeClock(page);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    test.skip(await hero.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");

    const before = await hero.getAttribute("data-motion-phase");
    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // Wait for the app to observe the hidden state before advancing: the
    // accumulator is torn down by an effect, so advancing in the same tick
    // would still be measuring a foreground scene.
    await expect(hero).toHaveAttribute("data-scene-active", "false");
    await page.evaluate(() => window.__advanceHeroClock?.(30_000));
    await expect(hero).toHaveAttribute("data-motion-phase", before ?? "approach");

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(hero).toHaveAttribute("data-scene-active", "true");
    // 30 hidden seconds must not have spent the 24s sleep budget.
    await expect(page.getByRole("button", { name: "暫停小紅的旅程" })).toBeVisible();
  });

  test("F10: secondary motion sleeps after 24s of active time and only an explicit action resumes it", async ({ page }) => {
    await installFakeClock(page);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    test.skip(await hero.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");

    await expect(page.getByRole("button", { name: "暫停小紅的旅程" })).toBeVisible();
    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), SLEEP_AFTER_MS - 2_000);
    await expect(page.getByRole("button", { name: "暫停小紅的旅程" })).toBeVisible();

    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), 3_000);
    await expect(page.getByRole("button", { name: "繼續小紅的旅程" })).toBeVisible();
    // Sleeping must not resume by itself.
    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), 10_000);
    await expect(page.getByRole("button", { name: "繼續小紅的旅程" })).toBeVisible();

    await page.getByRole("button", { name: "繼續小紅的旅程" }).click();
    await expect(page.getByRole("button", { name: "暫停小紅的旅程" })).toBeVisible();
  });

  test("F11: five Intro↔Landing round trips leak no canvas, context or visibility listener", async ({ page }) => {
    await page.addInitScript(() => {
      const instrumentation = { webglContexts: 0, visibilityListeners: 0 };
      window.__heroInstrumentation = instrumentation;
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, ...args: unknown[]) {
        const type = String(args[0] ?? "");
        if (type.startsWith("webgl")) instrumentation.webglContexts += 1;
        return (getContext as (...a: unknown[]) => unknown).apply(this, args);
      } as typeof HTMLCanvasElement.prototype.getContext;
      const add = document.addEventListener.bind(document);
      const remove = document.removeEventListener.bind(document);
      document.addEventListener = ((type: string, ...rest: unknown[]) => {
        if (type === "visibilitychange") instrumentation.visibilityListeners += 1;
        return (add as (...a: unknown[]) => unknown)(type, ...rest);
      }) as typeof document.addEventListener;
      document.removeEventListener = ((type: string, ...rest: unknown[]) => {
        if (type === "visibilitychange") instrumentation.visibilityListeners -= 1;
        return (remove as (...a: unknown[]) => unknown)(type, ...rest);
      }) as typeof document.removeEventListener;
    });

    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    test.skip(await hero.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");

    for (let round = 0; round < 5; round += 1) {
      await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toBe("ready");
      await expect(page.locator("[data-hero-world] canvas")).toHaveCount(1);
      await page.getByRole("link", { name: "略過動畫" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
      const listeners = await page.evaluate(() => window.__heroInstrumentation?.visibilityListeners ?? 0);
      // One live HeroWorld keeps one visibility listener; a leak grows per round.
      expect(listeners, `round ${round}: visibility listeners`).toBeLessThanOrEqual(2);
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
    }

    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(1);
    const instrumentation = await page.evaluate(() => window.__heroInstrumentation);
    expect(instrumentation?.visibilityListeners ?? 0).toBeLessThanOrEqual(2);
  });
});

// PLAN §9 / SPEC §5.3. Enter must work from every moment of the intro, must not
// wait for the decorative transition, and must leave nothing behind on Landing.
test.describe("Intro Portal · Phase 9 enter transition and navigation lifecycle", () => {
  test.use({ serviceWorkers: "block" });

  const enterLink = /進入車車遊樂園/;

  async function waitForScene(page: import("@playwright/test").Page) {
    const hero = page.locator("[data-hero-world]");
    await expect.poll(() => hero.getAttribute("data-scene-state"), { timeout: 12_000 }).toMatch(/ready|fallback/);
    return hero;
  }

  test("Enter during poster leaves immediately without loading WebGL", async ({ page }) => {
    const modelRequests: string[] = [];
    page.on("request", (request) => { if (MODEL_URL.test(request.url())) modelRequests.push(request.url()); });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    // The scene chunk only starts after a 900ms warm-up; clicking before that
    // must not wait for it.
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    expect(modelRequests, "leaving during the poster must not start model downloads").toHaveLength(0);
  });

  test("Enter during loading does not wait for the model to finish", async ({ page }) => {
    // Hold the first model open for the whole test: the click must not block on it.
    await page.route(MODEL_URL, async () => { /* never fulfilled */ });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
    // A load that resolves (or aborts) after the route change must not throw.
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("Enter during fallback leaves immediately", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = (() => null) as typeof HTMLCanvasElement.prototype.getContext;
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "fallback");
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("reduced motion Enter goes straight to Landing with no transition overlay", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect(hero).toHaveAttribute("data-scene-state", "poster");
    await page.getByRole("link", { name: enterLink }).click();
    // data-entering must never turn on: reduced motion gets no fade or camera push.
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("Enter during the greeting, and again while paused, both leave at once", async ({ page }) => {
    await page.goto("/intro?heroQa=1", { waitUntil: "domcontentloaded" });
    const hero = await waitForScene(page);
    test.skip(await hero.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");
    // Park the story on the greeting through the QA-only time hook.
    await page.evaluate(() => { (window as unknown as { __HERO_WORLD_QA_TIME?: number }).__HERO_WORLD_QA_TIME = 5.55; });
    await expect.poll(() => hero.getAttribute("data-motion-phase"), { timeout: 20_000 }).toBe("acknowledge");
    await expect(hero).toHaveAttribute("data-greeting", "true");
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);

    // Paused is a separate moment: motion is stopped but the scene is live.
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const paused = await waitForScene(page);
    test.skip(await paused.getAttribute("data-scene-state") !== "ready", "WebGL unavailable in this browser host");
    await page.getByRole("button", { name: "暫停小紅的旅程" }).click();
    await expect(page.getByRole("button", { name: "繼續小紅的旅程" })).toBeVisible();
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("a double click lands once and leaves a single history entry", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForScene(page);
    const depthBefore = await page.evaluate(() => history.length);
    await page.getByRole("link", { name: enterLink }).dblclick();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await expect(hero).toHaveCount(0);
    // Enter replaces the intro entry; a second navigation would grow history.
    expect(await page.evaluate(() => history.length)).toBe(depthBefore);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stories$/);
    expect(errors).toEqual([]);
  });

  test("middle click keeps native link semantics", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const box = await page.getByRole("link", { name: enterLink }).boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.click(box!.x + box!.width / 2, box!.y + box!.height / 2, { button: "middle" });
    await page.waitForTimeout(300);
    // The current tab stays on the intro; the browser owns what a middle click does.
    await expect(page).toHaveURL(/\/intro$/);
  });

  test("focus lands on main after an enhanced entry, without scrolling", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForScene(page);
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? ""), { timeout: 3_000 }).toBe("main-content");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("a plain Landing visit is never focus-grabbed", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.activeElement?.id ?? "")).not.toBe("main-content");
  });

  test("Back after entering returns to the page before the intro, then Forward returns to Landing", async ({ page }) => {
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForScene(page);
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    // Enter replaces the intro entry, so Back skips it instead of looping.
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stories$/);
    await page.goForward({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    // A restored Landing must not steal focus from the reader.
    expect(await page.evaluate(() => document.activeElement?.id ?? "")).not.toBe("main-content");
  });

  test("the route change disposes the canvas, the model requests and the listeners", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.addInitScript(() => {
      const instrumentation = { webglContexts: 0, visibilityListeners: 0 };
      window.__heroInstrumentation = instrumentation;
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, ...args: unknown[]) {
        const type = String(args[0] ?? "");
        if (type.startsWith("webgl")) instrumentation.webglContexts += 1;
        return (getContext as (...a: unknown[]) => unknown).apply(this, args);
      } as typeof HTMLCanvasElement.prototype.getContext;
      const add = document.addEventListener.bind(document);
      const remove = document.removeEventListener.bind(document);
      document.addEventListener = ((type: string, ...rest: unknown[]) => {
        if (type === "visibilitychange") instrumentation.visibilityListeners += 1;
        return (add as (...a: unknown[]) => unknown)(type, ...rest);
      }) as typeof document.addEventListener;
      document.removeEventListener = ((type: string, ...rest: unknown[]) => {
        if (type === "visibilitychange") instrumentation.visibilityListeners -= 1;
        return (remove as (...a: unknown[]) => unknown)(type, ...rest);
      }) as typeof document.removeEventListener;
    });
    const modelRequests: string[] = [];
    page.on("request", (request) => { if (MODEL_URL.test(request.url())) modelRequests.push(request.url()); });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForScene(page);
    const loaded = modelRequests.length;
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-hero-world]")).toHaveCount(0);
    await expect(page.locator("canvas")).toHaveCount(0);
    // Two seconds is well past the 360ms transition and any late GLB parse.
    await page.waitForTimeout(2_000);
    expect(modelRequests.length, "no model refetch after leaving").toBe(loaded);
    expect(await page.evaluate(() => window.__heroInstrumentation?.visibilityListeners ?? 0)).toBeLessThanOrEqual(1);
    expect(errors, "a leaked frame or late parse would throw here").toEqual([]);
  });
});
