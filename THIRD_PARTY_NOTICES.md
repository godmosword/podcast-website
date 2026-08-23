# 第三方授權聲明

本檔案列出網站發佈物中嵌入或引用的第三方字型與常見開源元件授權摘要。
網站程式碼之 MIT 授權見 [LICENSE](./LICENSE)；節目內容不在此列。

## 字型

| 字型 | 用途 | 授權 | 條款全文 |
|------|------|------|----------|
| jf-open 粉圓（huninn）子集 | 中文內文（`app/fonts/huninn-subset.woff2`） | SIL Open Font License 1.1 | [app/fonts/OFL-huninn.txt](./app/fonts/OFL-huninn.txt) |
| Baloo 2 | 拉丁字母與數字 | SIL OFL 1.1 | [Google Fonts](https://fonts.google.com/specimen/Baloo+2) |
| Gochi Hand | 手繪風拉丁標題 | SIL OFL 1.1 | [Google Fonts](https://fonts.google.com/specimen/Gochi+Hand) |

## 內嵌圖形資產

| 資產 | 用途 | 來源 | 授權 |
|------|------|------|------|
| `public/map-pins/marker-icon.png`、`marker-icon-2x.png` | 親子遊樂地圖（`/for-parents/play-map`）的地圖標記圖示 | Leaflet 1.9.4（`node_modules/leaflet/dist/images/`，原樣複製未修改） | BSD-2-Clause，見 [Leaflet LICENSE](https://github.com/Leaflet/Leaflet/blob/main/LICENSE) |

自帶而非引用 CDN，是為了避免使用者瀏覽器對第三方主機發出請求。

## 商標（指示性使用）

頁面上的 Apple Podcasts、Spotify、KKBOX、YouTube、LINE、Instagram、Threads、Facebook
等圖示與名稱，僅用於連結至各平台官方頁面，商標權屬各權利人。收聽平台與社群圖示見 `lib/connect-icons.tsx`；`public/brand/` 為歷史備存。

## npm 依賴

以下為目前直接執行時依賴及其套件宣告的授權；完整版本與相依套件樹見 `package-lock.json`。

| 套件 | 版本 | 套件宣告授權 |
|------|------|--------------|
| `@neondatabase/serverless` | 1.1.0 | MIT |
| `@sentry/nextjs` | 10.70.0 | MIT |
| `@vercel/analytics` | 2.0.1 | MIT |
| `@vercel/functions` | 3.9.5 | Apache-2.0 |
| `leaflet` | 1.9.4 | BSD-2-Clause |
| `next` | 16.3.2 | MIT |
| `openai` | 6.42.0 | Apache-2.0 |
| `react`、`react-dom` | 19.2.7 | MIT |
| `react-leaflet` | 5.0.0 | Hippocratic-2.1 |
| `sharp` | 0.35.3 | Apache-2.0 |
| `zod` | 4.4.3 | MIT |

`react-leaflet` 的 Hippocratic License 2.1 及其他相依套件的授權相容性，仍須依實際發佈方式由適任人員進行人工法律審查；本表僅作為來源與授權識別，不代表相容性結論。

建置工具（Playwright、Vitest、tsx 等）僅用於開發與 CI，不打包進靜態網站。
