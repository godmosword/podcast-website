import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { skipIntroOverlay } from "./intro-gate";

/**
 * Intro 的舞台自 2026-09-11 起是橫向 2.5D 視差帶（規格 HERO-PARALLAX-SPEC.md
 * Phase 3）：四張黏土 tile 加一張主角 sprite，純 CSS transform。它沒有 WebGL、
 * 沒有模型、沒有載入狀態機——這份 spec 守的契約也跟著改：
 *
 * - 永遠不請求 WebGL context、不載入任何 three chunk（改版的核心收益）
 * - reduced motion 直接是靜態圖；runtime 切換也一樣
 * - 沒有暫停鈕；看著頁面時動畫一直跑。隱藏分頁、離開視窗才凍住，不釋放 layer
 * - tile 載不出來不阻擋 ready 與出口；晚到的 tile 在路由切換後被丟掉
 *
 * 舊的 3D 舞台（`?stage=world`）只剩回滾用途，e2e 不再守它。
 */
const TILE_URL = /\/landing\/hero-parallax\/[^/]+\.webp(?:\?.*)?$/;
const MODEL_URL = /\/models\/hero-world\/(?:v[23]\/)?[^/]+\.glb(?:\?.*)?$/;
const ROAD_URL = /\/landing\/hero-parallax\/l3-road\.webp(?:\?.*)?$/;

async function waitForBand(page: import("@playwright/test").Page) {
  const hero = page.locator("[data-hero-world]");
  await expect(hero).toHaveAttribute("data-stage", "parallax");
  await expect(hero).toHaveAttribute("data-scene-state", "ready", { timeout: 12_000 });
  return hero;
}

/** 一條 strip 的 animation 狀態；四層都一樣，取第一層就夠。 */
async function stripAnimation(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const strip = document.querySelector("[data-hero-parallax] [data-layer='l1'] > div");
    if (!strip) return null;
    const style = getComputedStyle(strip);
    return { name: style.animationName, playState: style.animationPlayState };
  });
}

/** 計 WebGL context 與 visibility listener：前者必須永遠是 0，後者不得隨往返累積。 */
async function installInstrumentation(page: import("@playwright/test").Page) {
  await page.addInitScript(() => {
    const instrumentation = { webglContexts: 0, visibilityListeners: 0 };
    window.__heroInstrumentation = instrumentation;
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function patched(this: HTMLCanvasElement, ...args: unknown[]) {
      const type = String(args[0] ?? "");
      if (type.startsWith("webgl") || type === "experimental-webgl") instrumentation.webglContexts += 1;
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
}

test.describe("Intro Portal · Phase 4 route and entry", () => {
  test("serves a semantic intro without the Landing chrome", async ({ page }) => {
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

  test("keeps the intro controls accessible", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const blocking = results.violations.filter((violation) => violation.impact === "critical" || violation.impact === "serious");
    expect(blocking, blocking.map((violation) => `${violation.id}: ${violation.help}`).join("\n")).toEqual([]);
  });

  test("enters Landing immediately before the band is ready", async ({ page }) => {
    // 扣住路面 tile，band 就真的到不了 ready；等 hydration 訊號再點，否則量到的是
    // 「hydration 前的原生導航」——那是 R10 的無 JS 契約，不是這條。
    await page.route(ROAD_URL, async () => { /* never fulfilled */ });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "true");
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await page.getByRole("link", { name: "略過動畫" }).click();
    // Enhanced navigation lands on the clean canonical URL; `?enter=1` stays in
    // the href as the no-JS entry point.
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  // ADR-0004: `/` still serves the full Landing HTML; the opening is a
  // same-page overlay on top of it. R09 is now "opening /intro on purpose
  // still works", because the overlay has no URL of its own.
  test("R09: /intro stays reachable on its own and hands back to Landing", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await expect(page.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "true");
    await page.getByRole("link", { name: "略過動畫" }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    // 從 /intro 進站的人已經看過開場，回到 `/` 不該再被覆蓋層蓋一次。
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
  });

  test("Landing to story back and forward stays on content", async ({ page }) => {
    await skipIntroOverlay(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: "車車遊樂園的故事 →" }).click();
    await expect(page).toHaveURL(/\/stories/);
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await page.goForward({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stories/);
  });

  test("R08: Back and Forward move between Landing and Intro without a redirect loop", async ({ page }) => {
    await skipIntroOverlay(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
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

  // ADR-0004 之後這條必須分成兩半：閘門關著的 `/` 一張 tile 都不下載，
  // 閘門開著的 `/` 會下載（那正是覆蓋層的用途），後者由 overlay 那組守。
  test("deep links and a gated Landing never download the hero tiles", async ({ page }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (TILE_URL.test(request.url())) requests.push(request.url());
    });
    await skipIntroOverlay(page);
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

  test("R10: keeps Landing content usable and the overlay absent without JavaScript", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    // 無 JS 時閘門 script 跑不了，覆蓋層依設計不會出現——Landing 直接可用。
    await expect(page.locator("html")).not.toHaveAttribute("data-intro-gate", "on");
    await expect(page.getByRole("link", { name: "看小紅開進遊樂園" })).toHaveCount(0);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/intro$/);
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toHaveAttribute("href", "/?enter=1");
    await context.close();
  });
});

test.describe("Intro Portal · Phase 5 band, motion gating and lifecycle", () => {
  test.use({ serviceWorkers: "block" });

  test("never requests a WebGL context, a model, or a three chunk", async ({ page }) => {
    await installInstrumentation(page);
    const models: string[] = [];
    const scripts: string[] = [];
    page.on("request", (request) => {
      if (MODEL_URL.test(request.url())) models.push(request.url());
      if (request.resourceType() === "script") scripts.push(request.url());
    });
    await page.goto("/intro", { waitUntil: "load" });
    await waitForBand(page);
    await page.waitForTimeout(1_500);
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
    expect(await page.evaluate(() => window.__heroInstrumentation?.webglContexts ?? 0), "no WebGL context").toBe(0);
    expect(models, "no GLB may be fetched").toEqual([]);
    // 3D runtime 只在 HeroScene 的 dynamic import 後面；視差舞台不得把它拉進來。
    const threeChunks = await page.evaluate((urls) => urls.filter(url => url.includes("three") || url.includes("react-three")), scripts);
    expect(threeChunks).toEqual([]);
  });

  test("becomes ready once the road and the hero sprite load", async ({ page }) => {
    const tiles: string[] = [];
    page.on("request", (request) => { if (TILE_URL.test(request.url())) tiles.push(request.url()); });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-ready", "true");
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "true");
    // 四層各一張 tile；三份副本是同一個 URL，瀏覽器只抓一次。
    expect(new Set(tiles.map((url) => url.split("/").pop()?.split("?")[0])).size).toBe(4);
    expect(await stripAnimation(page)).toMatchObject({ playState: "running" });
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);

    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 1_500 });
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(0);
  });

  test("reduced motion is a still picture: no animation, no pause control, still enters instantly", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
    expect(await stripAnimation(page)).toMatchObject({ name: "none" });
    // No pause control: there is no motion to pause.
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);
    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("Save-Data and slow connections still get the picture and both exits", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", {
        configurable: true,
        value: { saveData: true, effectiveType: "2g", addEventListener() {}, removeEventListener() {} },
      });
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    await expect(page.locator("[data-hero-world] canvas")).toHaveCount(0);
  });

  test("a missing tile does not block ready or the exits", async ({ page }) => {
    await page.route(ROAD_URL, (route) => route.fulfill({ status: 404, contentType: "text/plain", body: "gone" }));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    // 破圖就是破圖：onError 一樣算完成，不會留一個永遠等不到的 poster 狀態。
    await waitForBand(page);
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    await page.getByRole("link", { name: "略過動畫" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
  });
});

// PLAN §15.2 F09／F11 仍用 active-time 假時鐘。F10 改為斷言 24 秒後動畫
// 不會自己停。F05（模型載入逾時）不再存在：視差舞台沒有模型。
const CLOCK_GLOBAL = "__chechecarHeroActiveClock";
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

test.describe("Intro Portal · active-time budgets (F09/F10/F11)", () => {
  test.use({ serviceWorkers: "block" });

  test("F09: 30s hidden freezes the band and does not consume the motion budget", async ({ page }) => {
    await installFakeClock(page);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => true });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    // Wait for the app to observe the hidden state before advancing: the
    // accumulator is torn down by an effect, so advancing in the same tick
    // would still be measuring a foreground band.
    await expect(hero).toHaveAttribute("data-scene-active", "false");
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "false");
    expect(await stripAnimation(page)).toMatchObject({ playState: "paused" });
    await page.evaluate(() => window.__advanceHeroClock?.(30_000));

    await page.evaluate(() => {
      Object.defineProperty(document, "hidden", { configurable: true, get: () => false });
      Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "visible" });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(hero).toHaveAttribute("data-scene-active", "true");
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "true");
    expect(await stripAnimation(page)).toMatchObject({ playState: "running" });
  });

  test("F10: 24s of active time does not freeze the band", async ({ page }) => {
    await installFakeClock(page);
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);

    await page.evaluate((ms) => window.__advanceHeroClock?.(ms), SLEEP_AFTER_MS + 3_000);
    await expect(hero.locator("[data-hero-parallax]")).toHaveAttribute("data-running", "true");
    expect(await stripAnimation(page)).toMatchObject({ playState: "running" });
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);
  });

  test("F11: five Intro↔Landing round trips leak no band, context or visibility listener", async ({ page }) => {
    test.setTimeout(90_000);
    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));
    await installInstrumentation(page);

    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);

    for (let round = 0; round < 5; round += 1) {
      await expect(hero).toHaveAttribute("data-scene-state", "ready", { timeout: 12_000 });
      await expect(page.locator("[data-hero-parallax]")).toHaveCount(1);
      await page.getByRole("link", { name: "略過動畫" }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.locator("[data-hero-parallax]")).toHaveCount(0);
      const listeners = await page.evaluate(() => window.__heroInstrumentation?.visibilityListeners ?? 0);
      // One live HeroWorld keeps one visibility listener; a leak grows per round.
      expect(listeners, `round ${round}: visibility listeners`).toBeLessThanOrEqual(2);
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
    }

    await expect(page.locator("[data-hero-parallax]")).toHaveCount(1);
    const instrumentation = await page.evaluate(() => window.__heroInstrumentation);
    expect(instrumentation?.visibilityListeners ?? 0).toBeLessThanOrEqual(2);
    expect(instrumentation?.webglContexts ?? 0, "no WebGL context across five round trips").toBe(0);
    expect(pageErrors).toEqual([]);
  });
});

// PLAN §9 / SPEC §5.3. Enter must work from every moment of the intro, must not
// wait for the decorative transition, and must leave nothing behind on Landing.
test.describe("Intro Portal · Phase 9 enter transition and navigation lifecycle", () => {
  test.use({ serviceWorkers: "block" });

  const enterLink = /進入車車遊樂園/;

  test("Enter while the road tile is still loading does not wait for it", async ({ page }) => {
    // Hold the road open for the whole test: the click must not block on it.
    await page.route(ROAD_URL, async () => { /* never fulfilled */ });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = page.locator("[data-hero-world]");
    await expect(hero).toHaveAttribute("data-stage", "parallax");
    await expect(hero).toHaveAttribute("data-scene-state", "poster");
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(0);
    // A load that resolves (or aborts) after the route change must not throw.
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });

  test("reduced motion Enter goes straight to Landing with no transition overlay", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);
    await page.getByRole("link", { name: enterLink }).click();
    // data-entering must never turn on: reduced motion gets no fade or push.
    await expect(hero).not.toHaveAttribute("data-entering", "true");
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("a double click lands once and leaves a single history entry", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const hero = await waitForBand(page);
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
    await waitForBand(page);
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? ""), { timeout: 3_000 }).toBe("main-content");
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test("a plain Landing visit is never focus-grabbed", async ({ page }) => {
    await skipIntroOverlay(page);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => document.activeElement?.id ?? "")).not.toBe("main-content");
  });

  test("Back after entering returns to the page before the intro, then Forward returns to Landing", async ({ page }) => {
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
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

  test("the route change disposes the band, the tile requests and the listeners", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await installInstrumentation(page);
    const tiles: string[] = [];
    page.on("request", (request) => { if (TILE_URL.test(request.url())) tiles.push(request.url()); });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    const loaded = tiles.length;
    await page.getByRole("link", { name: enterLink }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
    await expect(page.locator("[data-hero-world]")).toHaveCount(0);
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(0);
    // Two seconds is well past the 360ms transition.
    await page.waitForTimeout(2_000);
    expect(tiles.length, "no tile refetch after leaving").toBe(loaded);
    expect(await page.evaluate(() => window.__heroInstrumentation?.visibilityListeners ?? 0)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => window.__heroInstrumentation?.webglContexts ?? 0)).toBe(0);
    expect(errors, "a leaked frame would throw here").toEqual([]);
  });
});

// PLAN §11 / SPEC §14. The intro must be completable without ever seeing the
// animation: keyboard only, screen-reader semantics, zoom, reduced motion.
test.describe("Intro Portal · Phase 11 accessibility", () => {
  test.use({ serviceWorkers: "block" });

  test("semantic structure: one h1, a real main, decorative band hidden", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("h1")).toHaveText("車車遊樂園");
    await expect(page.locator("main[data-intro-root]")).toHaveCount(1);
    // The band is decoration: it must not add anything to the accessibility tree.
    await expect(page.locator("[data-hero-parallax]")).toHaveAttribute("aria-hidden", "true");
    await expect(page.locator("[data-hero-parallax] img[alt='']")).toHaveCount(13);
    await expect(page.locator("section[data-hero-world]")).toHaveAttribute("aria-labelledby", "intro-title");
  });

  test("controls are native elements, not div soup", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const enter = page.getByRole("link", { name: /進入車車遊樂園/ });
    const skip = page.getByRole("link", { name: "略過動畫" });
    expect(await enter.evaluate(node => node.tagName)).toBe("A");
    expect(await skip.evaluate(node => node.tagName)).toBe("A");
    await expect(enter).toHaveAttribute("href", "/?enter=1");
    await waitForBand(page);
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);
  });

  test("every control is focusable, visibly focused and at least 44x44", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    const controls = [
      page.getByRole("link", { name: /進入車車遊樂園/ }),
      page.getByRole("link", { name: "略過動畫" }),
    ];
    for (const control of controls) {
      const box = await control.boundingBox();
      expect(box, "control must be rendered").not.toBeNull();
      expect(box!.width, `${await control.innerText()} width`).toBeGreaterThanOrEqual(44);
      expect(box!.height, `${await control.innerText()} height`).toBeGreaterThanOrEqual(44);
    }
    // Focus rings are :focus-visible, so the focus has to arrive by keyboard —
    // getComputedStyle cannot query a pseudo-class, and a mouse focus would not
    // paint the ring at all.
    const rings: { label: string; outlineStyle: string; outlineWidth: number }[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      const ring = await page.evaluate(() => {
        const node = document.activeElement as HTMLElement | null;
        if (!node) return null;
        const style = getComputedStyle(node);
        return { label: node.textContent?.trim().slice(0, 12) ?? "", outlineStyle: style.outlineStyle, outlineWidth: parseFloat(style.outlineWidth) || 0 };
      });
      if (ring && /進入車車遊樂園|略過動畫/.test(ring.label)) rings.push(ring);
    }
    expect(rings.length, "the two intro controls must be tabbable").toBeGreaterThanOrEqual(2);
    for (const ring of rings) {
      expect(ring.outlineStyle, `${ring.label} focus ring style`).not.toBe("none");
      expect(ring.outlineWidth, `${ring.label} focus ring width`).toBeGreaterThanOrEqual(2);
    }
  });

  test("keyboard only: tab order follows reading order and Enter/Space activate", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    const order: string[] = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      order.push(await page.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 12) ?? ""));
    }
    const enterIndex = order.findIndex(label => label.includes("進入車車遊樂園"));
    const skipIndex = order.findIndex(label => label.includes("略過動畫"));
    expect(enterIndex, "Enter must be reachable by Tab").toBeGreaterThanOrEqual(0);
    expect(skipIndex, "Skip must come after Enter").toBeGreaterThan(enterIndex);
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);
    // Keyboard Enter on the link navigates once, like a real anchor.
    await page.getByRole("link", { name: /進入車車遊樂園/ }).focus();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
    await expect(page.locator("[data-landing-root]")).toBeVisible();
  });

  test("stays usable at 200% page zoom and 200% text zoom", async ({ page }) => {
    // 200% page zoom on a 1280x800 desktop is the same layout as 640x400 CSS px.
    await page.setViewportSize({ width: 640, height: 400 });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    const enter = page.getByRole("link", { name: /進入車車遊樂園/ });
    await expect(enter).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, "no horizontal scrollbar at 200% zoom").toBeLessThanOrEqual(1);

    // Text-only zoom: the root font size doubles, the layout must not trap the exits.
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => { document.documentElement.style.fontSize = "32px"; });
    await page.waitForTimeout(200);
    await expect(enter).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    const textOverflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(textOverflow, "no horizontal scrollbar at 200% text zoom").toBeLessThanOrEqual(1);
    await enter.click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
  });

  test("no audio is created or played by the intro", async ({ page }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __audio: number };
      w.__audio = 0;
      const Original = window.AudioContext;
      if (Original) {
        window.AudioContext = class extends Original { constructor(...args: ConstructorParameters<typeof Original>) { w.__audio += 1; super(...args); } };
      }
      const play = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function patched(this: HTMLMediaElement) { w.__audio += 1; return play.call(this); };
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    await page.waitForTimeout(1_000);
    expect(await page.locator("audio, video").count()).toBe(0);
    expect(await page.evaluate(() => (window as unknown as { __audio: number }).__audio)).toBe(0);
  });

  test("axe finds no serious violation on the intro or on Landing after entering", async ({ page }) => {
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    const intro = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(intro.violations.filter(v => v.impact === "critical" || v.impact === "serious")
      .map(v => `${v.id}: ${v.help}`)).toEqual([]);
    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
    const landing = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(landing.violations.filter(v => v.impact === "critical" || v.impact === "serious")
      .map(v => `${v.id}: ${v.help}`)).toEqual([]);
  });
});

test.describe("Intro Portal · Phase 11 reduced motion", () => {
  test.use({ serviceWorkers: "block" });

  test("switching to reduced motion at runtime stops the band", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    expect(await stripAnimation(page)).toMatchObject({ playState: "running" });
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);

    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => stripAnimation(page)).toMatchObject({ name: "none" });
    // The picture stays; only the motion goes.
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(1);

    // And back: the strip resumes.
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await expect.poll(() => stripAnimation(page)).toMatchObject({ playState: "running" });
    await expect(page.getByRole("button", { name: /小紅的旅程/ })).toHaveCount(0);
    expect(errors).toEqual([]);
    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 2_000 });
  });
});

test.describe("Intro Portal · Phase 11 failure paths", () => {
  test.use({ serviceWorkers: "block" });

  test("F12: every tile failing still leaves the heading and both exits usable", async ({ page }) => {
    await page.route(TILE_URL, (route) => route.fulfill({ status: 404, contentType: "text/plain", body: "gone" }));
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    // Visual regression is expected here; the exit must not be.
    await page.getByRole("link", { name: "略過動畫" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
  });

  test("F13: a tile that arrives after the route change is dropped, not applied", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    let release: (() => void) | null = null;
    const held = new Promise<void>((resolve) => { release = resolve; });
    await page.route(ROAD_URL, async (route) => {
      await held;
      // The owner aborted this request when it unmounted; continuing an aborted
      // route is a no-op we do not want to fail the test on.
      await route.continue().catch(() => {});
    });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-hero-world]")).toHaveAttribute("data-scene-state", "poster");
    await page.getByRole("link", { name: "略過動畫" }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 3_000 });
    // Now let the tile arrive: the owner is gone, so it must be dropped.
    release!();
    await page.waitForTimeout(1_500);
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(0);
    await expect(page.locator("[data-hero-world]")).toHaveCount(0);
    expect(errors, "a late image must not throw into the new page").toEqual([]);
  });
});

// PLAN §12 的**模擬**部分。這些是版面契約，不是真機驗收：Chromium 模擬不能
// 代替實體 iPhone Safari 或 Android Chrome（見 phase12 報告的 NOT-RUN 清單）。
test.describe("Intro Portal · Phase 12 cross-viewport layout (emulated)", () => {
  test.use({ serviceWorkers: "block" });

  const viewports: [number, number, string][] = [
    [320, 568, "narrow phone"],
    [360, 800, "phone"],
    [390, 844, "phone"],
    [430, 932, "large phone"],
    [844, 390, "short landscape"],
    [768, 1024, "tablet portrait"],
  ];

  for (const [width, height, kind] of viewports) {
    test(`${width}x${height} (${kind}): both exits usable, nothing scrolls sideways`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: "車車遊樂園" })).toBeVisible();

      const enter = page.getByRole("link", { name: /進入車車遊樂園/ });
      const skip = page.getByRole("link", { name: "略過動畫" });
      for (const [label, control] of [["Enter", enter], ["Skip", skip]] as const) {
        await expect(control, `${label} must be visible at ${width}x${height}`).toBeVisible();
        const box = await control.boundingBox();
        expect(box, `${label} box`).not.toBeNull();
        expect(box!.height, `${label} height at ${width}x${height}`).toBeGreaterThanOrEqual(44);
        // Exits must sit inside the first screen, not below a fold the child has
        // to find; 100svh layouts are the usual way this breaks.
        expect(box!.y + box!.height, `${label} bottom at ${width}x${height}`).toBeLessThanOrEqual(height + 1);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        `horizontal overflow at ${width}x${height}`,
      ).toBeLessThanOrEqual(1);

      await enter.click();
      await expect(page).toHaveURL(/\/$/, { timeout: 5_000 });
      await expect(page.locator("[data-landing-root]")).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        `Landing horizontal overflow at ${width}x${height}`,
      ).toBeLessThanOrEqual(1);
    });
  }

  test("rotating from portrait to landscape keeps one band and both exits", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/intro", { waitUntil: "domcontentloaded" });
    await waitForBand(page);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(600);
    // A resize must reflow the same band, never mount a second one.
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(1);
    await expect(page.getByRole("link", { name: /進入車車遊樂園/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "略過動畫" })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    await expect(page.locator("[data-hero-parallax]")).toHaveCount(1);
    await page.getByRole("link", { name: /進入車車遊樂園/ }).click();
    await expect(page).toHaveURL(/\/$/, { timeout: 5_000 });
  });
});

// 視差帶的四條 strip 都比視窗寬、而且在位移，`.hero{overflow:hidden}` 必須把它們
// 全部吃掉：任何一層漏出去，頁面就會出現水平捲動，而那正是最容易被忽略的破法。
test.describe("Intro Portal · band geometry", () => {
  for (const [width, height] of [[320, 568], [390, 844], [430, 932], [768, 1024], [1440, 900]] as const) {
    test(`no strip leaks out of the hero frame at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
      const hero = await waitForBand(page);
      await expect(hero).toBeVisible();
      const boxes = await page.evaluate(() => {
        const heroEl = document.querySelector("[data-hero-world]");
        const bandEl = document.querySelector("[data-hero-parallax]");
        if (!heroEl || !bandEl) return null;
        const h = heroEl.getBoundingClientRect();
        const b = bandEl.getBoundingClientRect();
        return { hero: { left: h.left, right: h.right, top: h.top, bottom: h.bottom }, band: { left: b.left, right: b.right, top: b.top, bottom: b.bottom } };
      });
      expect(boxes, "hero 或 band 不存在").not.toBeNull();
      expect(boxes!.band.left).toBeGreaterThanOrEqual(boxes!.hero.left - 1);
      expect(boxes!.band.right).toBeLessThanOrEqual(boxes!.hero.right + 1);
      expect(boxes!.band.top).toBeGreaterThanOrEqual(boxes!.hero.top - 1);
      expect(boxes!.band.bottom).toBeLessThanOrEqual(boxes!.hero.bottom + 1);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
        "頁面出現水平捲動",
      ).toBeLessThanOrEqual(1);
    });
  }
});

function dioramaBoxes() {
  const rect = (el: Element | null) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { top: r.top, bottom: r.bottom };
  };
  const bandEl = document.querySelector("[data-hero-parallax]");
  const heroEl = document.querySelector("[data-hero-world]");
  const carEl = document.querySelector("[data-hero-parallax] img[src*='xiao-hong']");
  return {
    hero: rect(heroEl),
    band: rect(bandEl),
    l1: rect(bandEl?.querySelector("[data-layer='l1']") ?? null),
    l3: rect(bandEl?.querySelector("[data-layer='l3']") ?? null),
    l5: rect(bandEl?.querySelector("[data-layer='l5']") ?? null),
    car: rect(carEl),
  };
}

// 手機直向：路面、小紅、近景必須整組落在 band 裡，路要接到草叢，略過在場景列下面。
// 先前 --horizon:46% 加 L5 沉出 + 略過 absolute，會在路與草之間空一截、底緣被切掉。
test.describe("Intro Portal · portrait diorama fits the frame", () => {
  test.use({ serviceWorkers: "block" });

  const phones: [number, number][] = [[320, 568], [390, 844], [430, 932]];

  for (const [width, height] of phones) {
    test(`road, car and foreground stay inside the band at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
      await waitForBand(page);
      const geometry = await page.evaluate(dioramaBoxes);
      expect(geometry.band, "band").not.toBeNull();
      expect(geometry.l1, "L1").not.toBeNull();
      expect(geometry.l3, "L3").not.toBeNull();
      expect(geometry.l5, "L5").not.toBeNull();
      expect(geometry.car, "car").not.toBeNull();
      const slack = 2;
      const bob = 4;
      expect(geometry.l1!.top, "L1 top clipped").toBeGreaterThanOrEqual(geometry.band!.top - slack);
      expect(geometry.l3!.bottom, "road clipped").toBeLessThanOrEqual(geometry.band!.bottom + slack);
      expect(geometry.l5!.bottom, "foreground clipped").toBeLessThanOrEqual(geometry.band!.bottom + slack);
      expect(geometry.car!.top, "car top clipped").toBeGreaterThanOrEqual(geometry.band!.top - slack);
      expect(geometry.car!.bottom, "car clipped").toBeLessThanOrEqual(geometry.band!.bottom + bob);
      expect(geometry.l3!.bottom, "road must meet the grass").toBeGreaterThanOrEqual(geometry.l5!.top - slack);
      const skip = await page.getByRole("link", { name: "略過動畫" }).boundingBox();
      expect(skip, "skip box").not.toBeNull();
      expect(skip!.y, "skip must sit below the stage").toBeGreaterThanOrEqual(geometry.band!.bottom - slack);
      expect(skip!.y + skip!.height, "skip below the fold").toBeLessThanOrEqual(height + 1);
    });
  }

  test("home overlay at 390 keeps the foreground inside the stage", async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    // 覆蓋層 tile 是 lazy，不走 waitForBand 的 ready；有 CSS 高度就可以量裁切。
    await expect(page.locator("[data-intro-overlay] [data-hero-parallax]")).toBeVisible();
    await expect.poll(async () => {
      return page.locator("[data-intro-overlay] [data-layer='l3']").evaluate((el) => el.getBoundingClientRect().height);
    }).toBeGreaterThan(40);
    const geometry = await page.evaluate(dioramaBoxes);
    expect(geometry.band, "band").not.toBeNull();
    expect(geometry.l5, "L5").not.toBeNull();
    expect(geometry.l3, "L3").not.toBeNull();
    expect(geometry.car, "car").not.toBeNull();
    const slack = 2;
    expect(geometry.l5!.bottom, "overlay foreground clipped").toBeLessThanOrEqual(geometry.band!.bottom + slack);
    expect(geometry.l3!.bottom, "overlay road must meet the grass").toBeGreaterThanOrEqual(geometry.l5!.top - slack);
    expect(geometry.car!.bottom, "overlay car clipped").toBeLessThanOrEqual(geometry.band!.bottom + 4);
    const skip = await page.getByRole("button", { name: "略過動畫" }).boundingBox();
    expect(skip, "overlay skip").not.toBeNull();
    expect(skip!.y, "overlay skip must sit below the stage").toBeGreaterThanOrEqual(geometry.band!.bottom - slack);
    await context.close();
  });
});

// 文字安全區（規格 §4.4）。背景會動，所以契約不能是「某一幀沒撞到」，而是結構性的：
// 桌機與短橫向靠 L1／L2 左側的透明遮罩，遮罩的全透明段必須蓋過文案與按鈕列的右緣；
// 手機文案與按鈕在上、band 在下，文案與按鈕列不得與任何一層的框相交。兩者都與相位無關。
test.describe("Intro Portal · text safe zone", () => {
  const cases: [number, number, "mask" | "stack"][] = [
    [1440, 900, "mask"],
    [1280, 720, "mask"],
    [1920, 1080, "mask"],
    [844, 390, "mask"],
    [390, 844, "stack"],
    [360, 800, "stack"],
  ];
  for (const [width, height, mode] of cases) {
    test(`copy and CTA never share pixels with a moving layer at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto("/intro", { waitUntil: "domcontentloaded" });
      await waitForBand(page);
      const geometry = await page.evaluate(() => {
        const rect = (el: Element | null) => {
          if (!el) return null;
          const r = el.getBoundingClientRect();
          return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
        };
        const hero = document.querySelector("[data-hero-world]")!;
        const band = document.querySelector("[data-hero-parallax]") as HTMLElement;
        const clear = parseFloat(getComputedStyle(band).getPropertyValue("--text-clear")) || 0;
        const heroRect = hero.getBoundingClientRect();
        // 文案與按鈕列：h1／p 是 /intro 頁；覆蓋層用 p 當標題，這裡只跑 /intro。
        const copy = rect(hero.querySelector("h1")?.parentElement ?? null);
        const actions = rect(hero.querySelector("a[href='/?enter=1']")?.parentElement ?? null);
        const layers = ["l1", "l2", "l3"].map((id) => rect(band.querySelector(`[data-layer='${id}']`)));
        return { clearPx: heroRect.left + heroRect.width * clear / 100, heroLeft: heroRect.left, copy, actions, layers };
      });
      expect(geometry.copy, "copy block").not.toBeNull();
      expect(geometry.actions, "actions row").not.toBeNull();
      if (mode === "mask") {
        // 一個文字元素安全的條件：水平整個在透明段內，或垂直整個在會動的兩層之上。
        // 標題通常靠後者（它在遠景頂端之上），按鈕列靠前者。
        const movingTop = Math.min(geometry.layers[0]!.top, geometry.layers[1]!.top);
        for (const [label, box] of [["copy", geometry.copy!], ["actions", geometry.actions!]] as const) {
          const inClearZone = box.right <= geometry.clearPx + 1;
          const aboveLayers = box.bottom <= movingTop + 1;
          expect(inClearZone || aboveLayers,
            `${label} right=${Math.round(box.right)} bottom=${Math.round(box.bottom)} vs clear=${Math.round(geometry.clearPx)} layerTop=${Math.round(movingTop)}`)
            .toBe(true);
        }
        // 路面不在遮罩裡，所以按鈕列還必須整個在路面之上。
        const road = geometry.layers[2]!;
        expect(geometry.actions!.bottom, "CTA must sit above the road").toBeLessThanOrEqual(road.top + 1);
      } else {
        const intersects = (a: NonNullable<typeof geometry.copy>, b: NonNullable<typeof geometry.copy>) =>
          a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        for (const [i, layer] of geometry.layers.entries()) {
          expect(intersects(geometry.copy!, layer!), `copy intersects layer ${i}`).toBe(false);
          expect(intersects(geometry.actions!, layer!), `actions intersect layer ${i}`).toBe(false);
        }
      }
    });
  }
});

/**
 * ADR-0004：開場是首頁的同頁覆蓋層，不是導航。
 *
 * 這組守住三件事：Landing 的 HTML 沒有因此變薄（SEO 零損失）、覆蓋層在 SSR
 * 時就存在（所以不會出現「先看到 Landing 再被蓋上」的閃爍），以及明確表達
 * 限制偏好的使用者根本不會遇到它。
 */
test.describe("Intro Portal · home overlay (ADR-0004)", () => {
  test.use({ serviceWorkers: "block" });

  test("the server HTML carries both the full Landing and the overlay", async ({ request }) => {
    const html = await (await request.get("/")).text();
    // Landing 的內容與結構化資料必須一字不少地留在 `/` 的原始 HTML 裡。
    expect(html).toContain("data-landing-root");
    expect(html).toContain("PodcastSeries");
    expect(html).toContain("車車遊樂園的故事");
    // 覆蓋層是 SSR 出來的，不是 mount 之後才插進去的。
    expect(html).toContain("data-intro-overlay");
    expect(html).not.toContain('data-testid="replay-intro"');
    expect(html).not.toContain("看小紅開進遊樂園");
  });

  test("a first visit opens the overlay without changing the URL", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("html")).toHaveAttribute("data-intro-gate", "on");
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", /^https?:\/\/[^?#]+\/?$/);
    // 背後的 Landing 被 inert 圍住，鍵盤與指標都進不去。頂欄留下可點。
    await expect(page.locator("[data-landing-root]")).toHaveAttribute("inert", "");
    await expect(page.locator("[data-testid='site-nav-bar']")).not.toHaveAttribute("inert");
    await context.close();
  });

  test("mobile overlay title sits below the site nav", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    const title = page.locator("[data-intro-overlay]").getByText("車車遊樂園", { exact: true });
    await expect(title).toBeVisible();
    const box = await title.boundingBox();
    expect(box, "標題沒有排版盒").not.toBeNull();
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y);
      return Boolean(el?.closest("[data-intro-overlay]"));
    }, { x: box!.x + box!.width / 2, y: box!.y + Math.min(12, box!.height / 2) });
    expect(hit, "標題中心被頂欄蓋住").toBe(true);
    await context.close();
  });

  test("top bar stays clickable while the overlay is open", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    const menuBtn = page.getByRole("button", { name: "開啟選單" });
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    const drawer = page.getByRole("navigation", { name: "網站選單" });
    await expect(drawer).toBeVisible();
    await expect(drawer.getByRole("link", { name: "遊樂園" })).toBeVisible();
    await drawer.getByRole("link", { name: "遊樂園" }).click();
    await expect(page).toHaveURL(/\/games/);
    await expect(page.locator("html")).not.toHaveAttribute("data-intro-gate", "on");
    await context.close();
  });

  test("entering dismisses the overlay, hands focus to main, and adds no history entry", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/stories", { waitUntil: "domcontentloaded" });
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    await page.getByRole("button", { name: /進入車車遊樂園/ }).click();
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
    await expect(page).toHaveURL(/\/$/);
    await expect(page.locator("[data-landing-root]")).not.toHaveAttribute("inert", "");
    await expect.poll(() => page.evaluate(() => document.activeElement?.id ?? ""), { timeout: 3_000 }).toBe("main-content");
    // 關掉覆蓋層不是導航，所以 Back 應該回到 /stories，不是回到覆蓋層。
    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/stories$/);
    await context.close();
  });

  test("the overlay is a once-per-tab moment", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "略過動畫" }).click();
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).not.toHaveAttribute("data-intro-gate", "on");
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
    // 新分頁是新的 session，開場會再出現一次。
    const fresh = await context.newPage();
    await fresh.goto("/", { waitUntil: "domcontentloaded" });
    await expect(fresh.locator("[data-intro-overlay]")).toBeVisible();
    await context.close();
  });

  test("Escape closes the overlay", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
    await context.close();
  });

  test("Tab can reach the top bar, but not the Landing behind the overlay", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-intro-overlay]")).toBeVisible();
    await expect(page.locator("[data-intro-overlay] [data-hero-parallax]")).toHaveAttribute("data-running", "true");
    for (let i = 0; i < 12; i += 1) {
      await page.keyboard.press("Tab");
      const place = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "chrome";
        if (el.closest("[data-landing-root]")) return "landing";
        if (el.closest("[data-intro-overlay]")) return "overlay";
        if (el.closest("[data-testid='site-nav-bar']")) return "nav";
        return "other";
      });
      expect(place, `Tab #${i + 1} reached the inert Landing`).not.toBe("landing");
    }
    await context.close();
  });

  // ADR-0003 最有力的那段證據：舊的自動導向把「我不要動畫／不要花流量」的人
  // 推去看一張靜態圖。覆蓋層對他們也只會是多一次點擊，所以閘門在繪製前就擋掉。
  for (const [label, options] of [
    ["reduced motion", { reducedMotion: "reduce" as const }],
    ["Save-Data", {}],
  ] as const) {
    test(`${label} never sees the overlay and downloads no tile`, async ({ browser }) => {
      const context = await browser.newContext(options);
      if (label === "Save-Data") {
        await context.addInitScript(() => {
          Object.defineProperty(navigator, "connection", {
            configurable: true,
            value: { saveData: true, effectiveType: "4g", addEventListener() {}, removeEventListener() {} },
          });
        });
      }
      const page = await context.newPage();
      const requests: string[] = [];
      page.on("request", (request) => {
        if (TILE_URL.test(request.url())) requests.push(request.url());
      });
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await expect(page.locator("html")).not.toHaveAttribute("data-intro-gate", "on");
      await expect(page.locator("[data-intro-overlay]")).toHaveCount(0);
      await expect(page.locator("[data-landing-root]")).toBeVisible();
      await expect(page.locator("[data-landing-root]")).not.toHaveAttribute("inert", "");
      await expect.poll(() => requests.length, { timeout: 1_500 }).toBe(0);
      await context.close();
    });
  }

  test("a blocked sessionStorage still leaves Landing usable", async ({ browser }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      Object.defineProperty(window, "sessionStorage", {
        configurable: true,
        get() { throw new DOMException("blocked", "SecurityError"); },
      });
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "domcontentloaded" });
    // fail-safe 的方向是「不開覆蓋層」，而不是留下一層關不掉的東西。
    await expect(page.locator("html")).not.toHaveAttribute("data-intro-gate", "on");
    await expect(page.locator("[data-landing-root]")).toBeVisible();
    await expect(page.locator("[data-landing-root]")).not.toHaveAttribute("inert", "");
    await context.close();
  });
});
