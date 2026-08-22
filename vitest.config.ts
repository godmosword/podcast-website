import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Several jsdom/map and image-contract tests do real asset work and
    // exceed Vitest's 5s default on a cold worker. Keep the timeout per test
    // bounded while avoiding false failures in the repository-wide suite.
    testTimeout: 15_000,
    // 只跑專案內 *.test.ts；避免 vitest 預設掃到 .cache/whisper-cpp 的 *.spec.js
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/.cache/**",
      "**/models/**",
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
