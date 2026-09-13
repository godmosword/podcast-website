#!/usr/bin/env tsx
/**
 * 由 `public/icon-512.png` 產生 `public/favicon.ico`。
 *
 *   npm run generate:favicon
 *
 * 為什麼還需要 `.ico`：`metadata.icons` 宣告的 PNG 只影響有讀 `<link>` 的客戶端；
 * 瀏覽器分頁、部分爬蟲與 RSS 閱讀器仍會直接打 `/favicon.ico`，沒有就是一筆 404。
 *
 * ICO 自 Vista 起允許直接內嵌 PNG（不必轉 BMP），所以這裡只做容器封裝：
 * ICONDIR(6) + ICONDIRENTRY(16)×n + 各尺寸 PNG。
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "public/icon-512.png");
const TARGET = resolve(ROOT, "public/favicon.ico");
const SIZES = [16, 32, 48] as const;

const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 } as const;

async function main(): Promise<void> {
  const pngs = await Promise.all(
    SIZES.map((size) =>
      sharp(SOURCE)
        .resize(size, size, { fit: "contain", background: TRANSPARENT })
        .png({ compressionLevel: 9 })
        .toBuffer(),
    ),
  );

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type：1 = icon
  header.writeUInt16LE(SIZES.length, 4);

  let offset = 6 + 16 * SIZES.length;
  const entries = SIZES.map((size, i) => {
    const entry = Buffer.alloc(16);
    // 規格用 1 byte 存邊長，256 以 0 表示；本檔最大 48，不會踩到。
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2); // 調色盤色數：0 = 非索引色
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(pngs[i]!.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += pngs[i]!.length;
    return entry;
  });

  const ico = Buffer.concat([header, ...entries, ...pngs]);
  writeFileSync(TARGET, ico);
  console.log(
    `✓ public/favicon.ico（${ico.length} bytes）：${SIZES.map((s, i) => `${s}px ${pngs[i]!.length}B`).join("、")}`,
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
