# 親子遊樂地圖景點圖片（2026-08-12）

## Goal

為 `/for-parents/play-map` 全縣市景點支援**可驗證授權**的實景圖：卡片／sheet 有圖顯示、無圖退回色條。

## Decisions

| 題目 | 決策 |
|---|---|
| 儲存 | 本機 `public/play-map/{id}.webp`＋sidecar `data/playground-images.ts` |
| 欄位 | `imageSrc`／`imageAlt`／`imageCredit`（選填；有 src 必有 alt＋credit） |
| 來源策略 | **優先**政府開放授權／官網明示可轉載圖；實務上 TDX／北市 Open API 需金鑰或 Cloudflare 擋 bot → **本輪以維基共享資源（CC0／CC BY／CC BY-SA／Public Domain）實景圖**全縣市覆蓋，credit 寫清作者與授權 |
| 不做 | Places／Maps 圖、社群爬圖、生圖 API 假實景、未授權商用官網行銷圖熱存 |

## Architecture

```
scripts/fetch-playground-images.ts  → public/play-map/*.webp + data/playground-images.ts
data/playgrounds.ts                 → Playground 選填圖欄；listPlaygrounds 合併 sidecar
components/for-parents/PlayMap.*    → 卡片／sheet 縮圖
docs/PLAY-MAP-EDITORIAL.md          → 圖片 SOP
```

## Success

1. 盡量為 73 筆取得可授權圖；無法匹配者保留無圖態。
2. UI 無圖不破版；有圖顯示 alt／credit。
3. `npm test`／`tsc`／`build` 綠。
