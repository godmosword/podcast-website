# 第三方授權聲明

本檔案列出網站發佈物中嵌入或引用的第三方字型與常見開源元件授權摘要。
網站程式碼之 MIT 授權見 [LICENSE](./LICENSE)；節目內容不在此列。

## 字型

| 字型 | 用途 | 授權 | 條款全文 |
|------|------|------|----------|
| jf-open 粉圓（huninn）子集 | 中文內文（`app/fonts/huninn-subset.woff2`） | SIL Open Font License 1.1 | [app/fonts/OFL-huninn.txt](./app/fonts/OFL-huninn.txt) |
| Baloo 2 | 拉丁字母與數字 | SIL OFL 1.1 | [Google Fonts](https://fonts.google.com/specimen/Baloo+2) |
| Gochi Hand | 手繪風拉丁標題 | SIL OFL 1.1 | [Google Fonts](https://fonts.google.com/specimen/Gochi+Hand) |

## 商標（指示性使用）

頁面上的 Apple Podcasts、Spotify、KKBOX、YouTube、LINE、Instagram、Threads、Facebook
等圖示與名稱，僅用於連結至各平台官方頁面，商標權屬各權利人。實作說明見 `lib/connect-icons.tsx`。

## npm 依賴

執行時主要依賴（MIT／Apache-2.0 等）見 `package-lock.json`。
建置工具（Playwright、Vitest、tsx 等）僅用於開發與 CI，不打包進靜態網站。
