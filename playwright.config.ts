import { defineConfig, devices } from "@playwright/test";
import { CANONICAL_SITE_URL } from "./lib/site-url";

/**
 * 視覺回歸用凍結資料 build（`VISUAL_FIXTURE=1`，見 lib/visual-fixture.ts）：產物在 .next-visual、
 * 跑在另一個埠，不會重用一般 e2e 的 3000 server，也不會被它重用。
 */
const PORT = process.env.VISUAL_FIXTURE === "1" ? 3200 : 3000;
const BASE_URL = `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    // 沙箱／CI 環境可用 PW_CHROMIUM_PATH 指向預裝 Chromium，免重新下載
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    // CI builds once in the build job, then starts that artifact here. Local
    // runs keep the existing convenience behavior when no server is reused.
    command:
      process.env.PW_REUSE_SERVER === "1"
        ? `npm run start -- --port ${PORT}`
        : `npm run build && npm run start -- --port ${PORT}`,
    env: {
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL ?? CANONICAL_SITE_URL,
      // build 與 start 都要帶，next.config 才會用同一個 .next-visual
      VISUAL_FIXTURE: process.env.VISUAL_FIXTURE === "1" ? "1" : "",
    },
    url: BASE_URL,
    // 只有明確指定 production server 才重用；避免把 `next dev` 當成 E2E
    // server，導致 client hydration／互動測試默默 timeout。
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 120_000,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    // Safari 行為（inert、overflow 捲動鎖、焦點）另外驗：只挑明確列出的 spec，CI 只裝 Chromium 也不受影響。
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testMatch: ["site-nav-modal.spec.ts"],
    },
  ],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
