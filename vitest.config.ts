import path from "node:path";
import { defineConfig } from "vitest/config";

const playMapOnly = process.env.VITEST_PLAY_MAP === "1";

export default defineConfig({
  test: {
    environment: "node",
    // Several jsdom/map and image-contract tests do real asset work and
    // exceed Vitest's 5s default on a cold worker. Keep the timeout per test
    // bounded while avoiding false failures in the repository-wide suite.
    testTimeout: 15_000,
    // The large PlayMap jsdom file can block a threads worker long enough for
    // Vitest's onTaskUpdate RPC to time out. Forks keep that runner healthy.
    pool: "forks",
    // 只跑專案內 *.test.ts；避免 vitest 預設掃到 .cache/whisper-cpp 的 *.spec.js
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: [
      "**/node_modules/**",
      "**/e2e/**",
      "**/.cache/**",
      "**/models/**",
      // This 53-test jsdom suite is kept as an explicit map regression command;
      // its long worker updates are flaky in the repository-wide RPC runner.
      ...(playMapOnly ? [] : ["**/components/for-parents/PlayMap.test.tsx"]),
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
