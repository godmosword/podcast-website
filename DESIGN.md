# 車車遊樂園 — 設計系統 v0.1

Bonbon & 馬米親子 podcast「看圖聽故事」網站的視覺與互動規範。

## 受眾

| 對象 | 需求 |
|------|------|
| 3–7 歲兒童 | 大觸控區、少文字、強視覺回饋、沉浸式播放 |
| 陪同家長 | Footer 使用說明、podcast 訂閱導流、分享預覽正確 |

## 裝置

- **Mobile-first**，內容欄寬 `max-width: 640px` 置中
- 桌面端維持單欄，兩側留白
- PWA：`manifest.json` + Apple Web App meta
- Viewport 允許使用者縮放（未設 `maximum-scale` / `user-scalable=no`），方便家長放大閱讀

## 色彩

多彩粉嫩風（純白底）：白為主，彩色出現在裝飾、卡片邊框與 chip。

| Token | 值 | 用途 |
|-------|-----|------|
| `--bg` | `#ffffff` | 頁面背景（純白） |
| `--bg-2` | `#fbfbfd` | 次背景 / 卡片漸層 |
| `--bg-dot` | `#eef1f6` | 極淡灰藍底紋 |
| `--ink` | `#34302b` | 主文字（中性深灰） |
| `--ink-soft` | `#7a7268` | 次要文字 |
| `--card` | `#ffffff` | 卡片背景 |

多彩粉嫩 accent（裝飾、chip、邊框輪播）：

| Token | 值 |
|-------|-----|
| `--c-pink` | `#f7a8c4` |
| `--c-yellow` | `#ffd866` |
| `--c-mint` | `#b7df9b` |
| `--c-sky` | `#8fcde8` |
| `--c-teal` | `#79c8c1` |
| `--c-lilac` | `#c5b3e6` |

頁面背景為純白（`--bg`），四角極淡多彩柔光由獨立節點 `.site-backdrop`（`position: fixed`）繪製，內容包在 `.site-root` 內；**不在 `body::before` 上畫 gradient**，避免 iOS Safari 上 sticky／合成層白塊跑版。實作見 `app/globals.css`、`app/layout.tsx`。
每則故事另有 `story.color`（hex），用於邊框、陰影、CTA、播放鈕。

## 手繪塗鴉裝飾（v2：全力塗鴉框）

整體手法升級為「手繪不規則外框 + 高密度塗鴉 + 螢光筆色塊 + 仿麥克筆標題」，貼近參考圖的全手繪塗鴉氛圍。

### 全域 SVG 粗糙濾鏡
- `components/decor/SvgDefs.tsx`：定義 `#rough-1/2/3` 三組 `feTurbulence + feDisplacementMap`（抖動量遞增），於 `app/layout.tsx <body>` 掛載一次。
- 供 RoughFrame 外框與 `.marker` 螢光筆色塊以 `filter: url(#rough-N)` 引用，讓直線/色塊邊緣產生手繪抖動。

### 手繪不規則外框 RoughFrame
- `components/decor/RoughFrame.tsx`：絕對定位 `inset:0` 覆蓋父層（父層需 `position: relative`），`border` + `filter: url(#rough-N)`，顏色吃 `story.color` 或 accent。
- 已取代乾淨實線邊框：StoryCard（list/grid）、LatestHero。對應 padding 補回原邊框寬度。
- topic 索引頁的標籤膠囊維持乾淨邊框（數量多，避免逐顆濾鏡的 GPU 成本與可讀性損失）。

### 塗鴉散布
- `components/decor/Doodle.tsx`：inline SVG 塗鴉（`squiggle` / `loop` / `dots` / `burst` / `blob` / `zigzag`），`aria-hidden`，顏色吃 accent token。
- 定位 class 於 `components/decor/decor.module.css`（`.doodle` + `.doodleTL/TR/BL/BR` + `.tiltA/B/C`）。
- 已接入：SiteHeader 標題四周（5 個）、LatestHero（3 個）、SiteFooter（4 個），混色 pink/yellow/mint/sky/lilac。尊重 `prefers-reduced-motion`。
- **StoryFilter 區塊目前刻意留白**（無 Doodle），避免中段裝飾過密；若補 1–2 個塗鴉須與 Header 呼應並回寫本文件（見 TODOS P2）。

### 螢光筆色塊 `.marker`
- 定義於 `app/globals.css`：文字壓在手繪螢光筆色塊上（`::before` 上色 + 微旋轉 + `filter: url(#rough-3)`）。
- 變體：`.marker-pink/sky/mint/lilac`，或以 inline `--marker-color` 帶入 `story.color`。
- 已套用：SiteHeader 副標、StoryFilter `groupLabel`/`topicLabel`、StoryCard EP、LatestHero CTA。

## 字型

- **Baloo 2**（Google Fonts，`next/font`）— 拉丁/數字內文
- **jf-open 粉圓 huninn**（`next/font/local`，子集化）— 中文字
- **Gochi Hand**（Google Fonts，`--font-marker`）— 手繪麥克筆風，僅含拉丁/數字；用於標題拉丁字符與英文標誌，中文回退 huninn。
- Fallback：`PingFang TC`、`Microsoft JhengHei`、`Noto Sans TC`
- 標題 1.8–2.3rem / 內文 1rem / 播放器字幕 1.15rem
- **仿麥克筆標題**：中文標題（SiteHeader `.title`、topic 標題）以 `-webkit-text-stroke` + 偏移色塊陰影模擬手寫粗描邊（中文無現成麥克筆字型）。

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
| `StoryMeta` | EP / 時長（標註） / 車種 chip |
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
