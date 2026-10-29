# 小橘特快車圖檔來源

小遊戲「小橘特快車」（路徑 `orange-express`）。本表只登記這個目錄裡已經進儲存庫的圖，一檔一列。提示詞與 API 呼叫次數在 `public/.games-staging/orange-express/<run-id>/manifest.json`（不進儲存庫）。

生圖腳本：`scripts/generate-orange-express-art.ts`。張數與 prompt 在 `docs/plans/2026-10-28-orange-express-art-batch2.md` 最後一節確認過；每張每輪最多 1 次 API 呼叫，不自動重抽。

`cover.svg` 是程式畫的暫代封面，換上 cover.webp 後留著不刪（舊連結與備援）。

## 逐檔

| 檔名 | 用途 | 產生方式 | 模型 | 日期 | 人工處理 | 對應 PR |
|------|------|----------|------|------|----------|---------|
| `cover.webp` | 遊樂園卡片、標題主視覺、著色本「下一站」卡 | AI 生圖（`scripts/generate-orange-express-art.ts`，1 次 API 呼叫），人工審稿後 `--approve`。 | gpt-image-2 | 2026-10-29 | 轉 webp（quality 90）。未重畫。 | #276 |
| `xiaoju-sticker.webp` | 結算的小橘 | AI 生圖（`scripts/generate-orange-express-art.ts`，1 次 API 呼叫），人工審稿後 `--approve`。 | gpt-image-1.5 | 2026-10-29 | 去透明邊、轉 webp（quality 90）。未重畫。 | #276 |
| `sm/xiaoju-sticker.webp` | 小橘貼紙的縮小副本（寬 256） | 由原檔以同一支腳本縮小。不是另一次生圖。 | 同原檔（這張不是另一次生圖） | 2026-10-29 | sharp 縮小後轉 webp（quality 86、alphaQuality 100）。 | #276 |
