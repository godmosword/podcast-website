import { expect, test, type Page } from "@playwright/test";
import { seedParentGatePassed } from "./parent-gate";

/**
 * Production release gate for the public site. Keep this suite deliberately
 * separate from smoke.spec.ts: the latter is also the gameplay regression
 * suite and must not become a required deploy check for this audit.
 */
const PUBLIC_ROUTES = [
  "/",
  "/stories",
  "/topic",
  "/characters",
  "/about",
  "/for-parents",
  "/for-parents/dashboard",
  "/for-parents/play-map/collections",
  "/subscribe",
  "/legal",
  "/story/ep-3",
  "/story/ep-3/play",
  "/adventures",
] as const;

function collectRuntimeFailures(page: Page): string[] {
  const failures: string[] = [];
  page.on("pageerror", (error: Error) => {
    failures.push(`pageerror: ${error.message}`);
  });
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (
      url.origin === new URL("http://127.0.0.1:3000").origin &&
      response.status() >= 400 &&
      !url.pathname.startsWith("/_vercel/insights/")
    ) {
      failures.push(`same-origin ${response.status()}: ${url.pathname}`);
    }
  });
  return failures;
}

async function expectPublicRoute(page: Page, path: string): Promise<void> {
  const failures = collectRuntimeFailures(page);
  const response = await page.goto(path, { waitUntil: "domcontentloaded" });
  expect(response?.status(), `${path} response`).toBe(200);
  // Story playback and the landing hub intentionally control document
  // scrolling; the visible h1 below is the content assertion we need here.
  await expect(page.locator("html")).toBeVisible();
  await expect(page.locator("h1").first()).toBeVisible();
  expect(failures, `${path} runtime failures`).toEqual([]);
}

test.describe("public production smoke", () => {
  test("public routes render without app errors or same-origin failed resources", async ({ page }) => {
    await seedParentGatePassed(page);
    for (const path of PUBLIC_ROUTES) {
      await expectPublicRoute(page, path);
    }
  });

  test("404 route returns the branded not-found page", async ({ page }) => {
    const failures = collectRuntimeFailures(page);
    const response = await page.goto("/story/not-real-slug", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
    await expect(page.locator("main")).toBeVisible();
    await expect(page.locator("h1")).toContainText("還沒有故事");
    expect(failures.filter((failure) => !failure.includes("/story/not-real-slug"))).toEqual([]);
  });
});

test.describe("public production smoke · mobile emulation", () => {
  test.use({
    viewport: { width: 412, height: 915 },
    userAgent:
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  });

  test("mobile public navigation and story playback entry render", async ({ page }) => {
    await expectPublicRoute(page, "/");
    await page.getByRole("link", { name: "車車遊樂園的故事 →" }).click();
    await expect(page).toHaveURL(/\/stories/);
    await expect(page.getByRole("heading", { name: "找故事" })).toBeVisible();
  });
});
