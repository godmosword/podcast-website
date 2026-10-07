// 暫時設定（勿 commit）：3000 被其他 dev server 佔用時改跑 3100 的 production server
import base from "./playwright.config";
import { defineConfig } from "@playwright/test";

export default defineConfig({
  ...base,
  use: { ...base.use, baseURL: "http://127.0.0.1:3100" },
  webServer: {
    command: "npm run start -- --port 3100",
    env: { NEXT_PUBLIC_SITE_URL: "https://podcast-website-mu.vercel.app" },
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
