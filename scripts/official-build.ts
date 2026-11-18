/**
 * 官網 Vercel 專案的 build command：npm run build:official
 * 環境變數：SITE_EDITION=official、NEXT_PUBLIC_SITE_URL=https://carcarplayground.com
 * Production Branch：release
 *
 * 會刪除工作目錄裡的排除檔。本機不要對 repo 本體執行。
 */
import { spawnSync } from "node:child_process";

if (process.env.VERCEL !== "1" && process.env.OFFICIAL_BUILD_LOCAL !== "1") {
  console.error("npm run build:official 會依發行清單刪除路由與素材。");
  console.error("只交給官網 Vercel 專案。本機要驗時，先複製到暫時目錄，再設 OFFICIAL_BUILD_LOCAL=1。");
  process.exit(1);
}

if (process.env.SITE_EDITION !== "official") {
  console.error("官網 build 必須 SITE_EDITION=official。");
  process.exit(1);
}

if (!process.env.NEXT_PUBLIC_SITE_URL?.trim()) {
  console.error("官網 build 必須設定 NEXT_PUBLIC_SITE_URL。");
  process.exit(1);
}

const prune = spawnSync("npx", ["tsx", "scripts/release-prune.ts", "--apply"], {
  stdio: "inherit",
  env: { ...process.env, OFFICIAL_BUILD_UNLOCK: "1" },
});
if ((prune.status ?? 1) !== 0) process.exit(prune.status ?? 1);

const build = spawnSync("npm", ["run", "build"], {
  stdio: "inherit",
  env: process.env,
});
process.exit(build.status ?? 1);
