/**
 * 產生 IndexNow key file：public/<key>.txt（內容＝key）。
 *
 * IndexNow 規格要求 key file 位於 https://<host>/<key>.txt（或提交時帶 keyLocation）。
 * 本檔掛在 prebuild：Vercel／CI build 時若設有 INDEXNOW_KEY 即產生，
 * 未設定時安靜略過（本機開發不需要）。產物只存在於部署輸出，不進 git
 * （見 .gitignore；本機驗證慣用 INDEXNOW_KEY=testkey）。
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

// IndexNow key 規格：8–128 字元，僅 a-z A-Z 0-9 與 dash。
const KEY_PATTERN = /^[a-zA-Z0-9-]{8,128}$/;

function main(): void {
  const key = process.env.INDEXNOW_KEY?.trim();
  if (!key) {
    console.log("generate-indexnow-key: skipped（未設 INDEXNOW_KEY）");
    return;
  }
  if (!KEY_PATTERN.test(key)) {
    const message =
      "generate-indexnow-key: INDEXNOW_KEY 不符合 IndexNow key 格式（8–128 字元、a-zA-Z0-9-）";
    // 正式部署（CI／Vercel）設了 key 卻格式錯誤 → fail-fast 擋 build，
    // 避免 IndexNow 長期失效卻無人察覺；本機只警告。
    if (process.env.CI || process.env.VERCEL) {
      console.error(`${message}——中止 build，請修正 env`);
      process.exit(1);
    }
    console.warn(`${message}，略過產生`);
    return;
  }
  const target = resolve(process.cwd(), "public", `${key}.txt`);
  writeFileSync(target, key, "utf8");
  console.log(`generate-indexnow-key: 已產生 public/${key}.txt`);
}

main();
