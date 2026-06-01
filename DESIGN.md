# 車車遊樂園 — 設計系統 v0.1

Bonbon & 馬米親子 podcast「看圖聽故事」網站的視覺與互動規範。

## 受眾

| 對象 | 需求 |
|------|------|
| 3–8 歲兒童 | 大觸控區、少文字、強視覺回饋、沉浸式播放 |
| 陪同家長 | Footer 使用說明、podcast 訂閱導流、分享預覽正確 |

## 裝置

- **Mobile-first**，內容欄寬 `max-width: 640px` 置中
- 桌面端維持單欄，兩側留白
- PWA：`manifest.json` + Apple Web App meta
- Viewport 鎖定縮放（`userScalable: false`）— 避免幼兒誤觸；低視力使用者需依賴系統放大，此為已知取捨

## 色彩

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#fff7ec` | 頁面背景（奶油） |
| `--bg-dot` | `#ffe6c7` | 點狀底紋 |
| `--ink` | `#4a3b2a` | 主文字 |
| `--ink-soft` | `#8a7a66` | 次要文字 |
| `--card` | `#ffffff` | 卡片背景 |

每則故事另有 `story.color`（hex），用於邊框、陰影、CTA、播放鈕。

## 字型

- **Baloo 2**（Google Fonts，`next/font`）
- Fallback：`PingFang TC`、`Microsoft JhengHei`、`Noto Sans TC`
- 標題 1.8–2.2rem / 內文 1rem / 播放器字幕 1.15rem

## 圓角與陰影

| Token | 值 |
|-------|-----|
| `--radius-sm` | 12px |
| `--radius-md` | 18px |
| `--radius-lg` | 24px |
| `--shadow-card` | `0 4px 0 var(--ink)` |

## 互動

- **按壓式按鈕**：`:active { transform: translateY(4px) }` 或 `scale(0.94)`，陰影消失
- **Focus**：`:focus-visible { outline: 3px solid var(--ink); outline-offset: 2px }`
- **動效 token**：`--motion-press`（按鈕）、`--motion-page`（翻頁淡入）
- **`prefers-reduced-motion: reduce`**：關閉吉祥物 bounce 等非必要動畫

## 元件規格

| 元件 | 說明 |
|------|------|
| `SiteHeader` | 吉祥物 + 標題（首頁完整版 / 內頁精簡版） |
| `StoryCard` | 封面 4:3、EP meta、主題色邊框 + 6px 底陰影 |
| `Chip` | 篩選與標籤 pill，`aria-pressed` |
| `PlayButton` | 全寬 CTA，主題色底 |
| `StoryMeta` | EP / 日期 / 時長 / 車種 chip |
| `StoryPlayer` | 全螢幕黑底、字幕底板、底部控制列 |
| `SiteFooter` | 家長說明 + 平台連結 |

## 播放器狀態

1. **字幕跟讀（預設開）**：音檔進度驅動換頁；dots 不可點
2. **手動翻頁**：關閉跟讀後，左右 tap zone + swipe
3. **播放完成**：再聽一次 / 回故事屋 / 下一集
4. **載入中**：封面 skeleton 脈動

## 新增故事檢查清單

1. `public/stories/<slug>/` 放入 `audio.mp3`、`01.jpg`～`NN.jpg`
2. `data/stories.ts` 更新 `pageCount` 與 `captions`
3. `npm test` + `npm run build`
