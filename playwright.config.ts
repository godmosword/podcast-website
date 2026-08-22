import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    // 沙箱／CI 環境可用 PW_CHROMIUM_PATH 指向預裝 Chromium，免重新下載
    ...(process.env.PW_CHROMIUM_PATH
      ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } }
      : {}),
  },
  webServer: {
    command: "npm run build && npm run start",
    env: {
      NEXT_PUBLIC_SITE_URL: "https://podcast-website-mu.vercel.app",
    },
    url: "http://127.0.0.1:3000",
    // 只有明確指定 production server 才重用；避免把 `next dev` 當成 E2E
    // server，導致 client hydration／互動測試默默 timeout。
    reuseExistingServer: process.env.PW_REUSE_SERVER === "1",
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
    },
  },
});
