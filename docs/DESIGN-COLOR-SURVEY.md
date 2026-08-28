# 設計色彩裸值調查

> **這是分類，不是遷移清單。** 本輪不改任何 `.module.css`、不新增 token、不改稽核腳本。
>
> - 產出日期：2026-08-28
> - 量測對象：`origin/main` `7325770`（列號在後續 main 與 CSS 未改的前提下仍對得上）
> - 分母：設計 token 稽核的色彩維度裸值 **182 筆**／**117 種值**／**34 檔**
> - 指令：與 `npm run audit:design-tokens` 同一套色彩屬性與「含 `var(` = token」規則
> - 列號：對齊原始 `.module.css`。註解與 `url()` 以**等長空白**取代後定位；不可把 `url(...)` 收成 `url()`，否則後面的列號會往前偏。

---

## 為什麼先調查、不遷移

色彩採用率已是四維度最高（82%）。剩下 182 個裸值的形狀跟字級／圓角／間距前幾輪**完全不同**：

| | 數量 |
|---|---:|
| 裸色宣告 | 182 |
| 不同的值 | 117 |
| 分佈檔案 | 34 |

**117 種值對 182 次使用。** 除了 `#fff`（29 次），其餘全部出現 ≤4 次。這不是漂移，多數是一次性的裝飾色與插畫色。

替一個只用一次的值命名，比留著 hex 更糟：`--hotspot-glow-3` 用一次，只是多一層轉接而不增加意義。

---

## 判斷準則

1. **重複次數是最強訊號。** ≥3 次幾乎必然屬類別一；1 次幾乎必然屬類別二。
2. **元件性質次之。** `StoryPlayer` 有 50 處但它是功能播放器不是插畫，裸色**不能**因為量大就歸類別二——逐筆視為深底 chrome。
3. 深色模式／深底上的 rgba 白疊層，重複 ≥3 的視為系統性，屬類別一。
4. **猶豫時歸類別三。** 這一類的存在是預期的，不為了讓報告好看而硬塞。
5. **不另立 rem／插畫 token 階梯。** 本文件只分類。
6. `globals.css` 已有等值 token 的裸色，即使只出現 1 次，也歸類別一（純遺漏）。

---

## 既有 token 對照（查過 `app/globals.css`）

| 裸值 | 既有 token | 日間值 | 夜間覆寫 |
|---|---|---|---|
| `#fff`／`#ffffff` | `--on-dark` | `#ffffff` | 未覆寫（仍白） |
| 同上 | `--bg`、`--card`、`--mix-base` | `#ffffff` | `--bg` `#1e2438`、`--card`／`--mix-base` `#2c3450` |
| 同上 | `--chip-active-fg` | `#ffffff` | `#1e2438` |
| 同上 | `--support-fg` | `#ffffff` | 改走 `--landing-brand-ink` |
| `#7a5410` | `--map-chip-ink` | `#7a5410` | **不覆寫**（地圖不反轉） |
| `#7a4012` | `--landing-cta-fg` | `#7a4012` | （landing CTA 組） |
| `#3a2410` | `--landing-brand-ink` | `#3a2410` | `#2a1808` |
| `#2a3a4a` | **不在 globals**；`ColoringPageShell` 的 `--coloring-ink` | `#2a3a4a` | 未覆寫 |
| `#2a4468` | 註解寫在 `--map-chip-ink` 段（夜海），**沒有獨立 token** | — | — |
| `#5d4a67` | 無。遊戲 TS 常數（`CandyMatchView` `INK`、`BlockDropView` ink）有同值，CSS 未接 token | — | — |

`#fff` 那 29 處因此是**純遺漏**：該用哪個白 token 取決於底是不是深色 chrome（播放器／landing CTA → `--on-dark`；紙色底 → `--bg`／`--card`）。本文件不決定對哪個。

---

## 摘要

| 類別 | 筆數 | 佔裸值 |
|---|---:|---:|
| 一、應該 token 化 | 85 | 47% |
| 二、一次性插畫／裝飾，應永久豁免 | 37 | 20% |
| 三、無法判斷 | 60 | 33% |
| **合計** | **182** | **100%** |

檔案集中度（全 182 筆，分類前）：

| 筆數 | 檔案 |
|---:|---|
| 50 | `components/StoryPlayer.module.css` |
| 17 | `components/universe/HotspotLayer.module.css` |
| 13 | `components/universe/ZoneIsland.module.css` |
| 12 | `components/coloring/ColoringCanvas.module.css` |
| 12 | `components/universe/UniverseMap.module.css` |
| 11 | `components/universe/ZoneSheet.module.css` |

同一值可以跨類別（按**出現處**分，不按值一刀切）。目前只有一組：`rgba(255, 255, 255, 0.45)` 在 StoryPlayer 歸類別一、在 SegmentNav 歸類別三。

本輪分類完就停。

---

## 類別一構成

| 來源 | 筆數 |
|---|---:|
| `#fff`（既有白 token 遺漏） | 29 |
| 既有 `--map-chip-ink`／`--landing-cta-fg`／`--landing-brand-ink` 等值遺漏 | 5 |
| 既有 `--coloring-ink` 及其 color-mix | 7 |
| `#5d4a67`（≥3，遊戲／著色本墨） | 3 |
| ≥3 的 rgba 白／深底疊層 | 15 |
| StoryPlayer／ParentTrustStrip 其餘深底 chrome（含只出現 1–2 次的 alpha） | 26 |
| **合計** | **85** |

`rgba(255, 255, 255, 0.72)` 三次裡有一次在 `HotspotLayer` 木牌圖示底——歸類依**次數**不依元件，所以進類別一。

---

## 類別一：應該 token 化（85）

重複出現且語意明確，或與既有 token 等值的遺漏。逐筆短註見表；理由已寫在「既有 token 對照」與「類別一構成」。

### 按值

| 全域次數 | 值 | 本類筆數 | 出現檔案 |
|--:|---|--:|---|
| 29 | `#fff` | 29 | `components/StoryPlayer.module.css`、`components/coloring/ColoringCanvas.module.css`、`components/coloring/ColoringCover.module.css`、`components/coloring/ColoringPageShell.module.css`、`components/coloring/ColoringToolbar.module.css`、`components/for-parents/PlayMapCityWall.module.css`、`components/landing/LandingSegment.module.css` |
| 4 | `#2a3a4a` | 4 | `components/coloring/ColoringPalette.module.css`、`components/coloring/ColoringToolbar.module.css` |
| 3 | `#5d4a67` | 3 | `components/coloring/ColoringCanvas.module.css`、`components/games/CandyMatchView.module.css` |
| 3 | `#7a5410` | 3 | `components/universe/UniverseMap.module.css`、`components/universe/ZoneIsland.module.css` |
| 3 | `rgba(20, 20, 24, 0.92)` | 3 | `components/StoryPlayer.module.css` |
| 3 | `rgba(255, 255, 255, 0.08)` | 3 | `components/ParentTrustStrip.module.css`、`components/StoryPlayer.module.css` |
| 3 | `rgba(255, 255, 255, 0.24)` | 3 | `components/StoryPlayer.module.css`、`components/landing/LandingSegment.module.css` |
| 3 | `rgba(255, 255, 255, 0.28)` | 3 | `components/StoryPlayer.module.css`、`components/landing/SegmentNav.module.css` |
| 3 | `rgba(255, 255, 255, 0.72)` | 3 | `components/story/FamilyActivityCard.module.css`、`components/story/ReflectionPrompt.module.css`、`components/universe/HotspotLayer.module.css` |
| 2 | `rgba(0, 0, 0, 0.55)` | 2 | `components/StoryPlayer.module.css` |
| 2 | `rgba(20, 20, 24, 0.88)` | 2 | `components/StoryPlayer.module.css` |
| 2 | `rgba(255, 255, 255, 0.1)` | 2 | `components/StoryPlayer.module.css` |
| 2 | `rgba(255, 255, 255, 0.22)` | 2 | `components/StoryPlayer.module.css` |
| 2 | `rgba(255, 255, 255, 0.78)` | 2 | `components/ParentTrustStrip.module.css`、`components/StoryPlayer.module.css` |
| 2 | `rgba(255, 255, 255, 0.45)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `#3a2410` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `#7a4012` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `color-mix(in srgb, #2a3a4a 55%, transparent)` | 1 | `components/coloring/ColoringCover.module.css` |
| 1 | `color-mix(in srgb, #2a3a4a 70%, transparent)` | 1 | `components/coloring/ColoringToolbar.module.css` |
| 1 | `color-mix(in srgb, #2a3a4a 78%, transparent)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `linear-gradient( to bottom, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0) )` | 1 | `components/StoryPlayer.module.css` |
| 1 | `linear-gradient(to top, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0))` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(0, 0, 0, 0.78)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(0, 0, 0, 0.88)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(24, 24, 28, 0.88)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.06)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.14)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.15)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.2)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.26)` | 1 | `components/ParentTrustStrip.module.css` |
| 1 | `rgba(255, 255, 255, 0.36)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.75)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.9)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(255, 255, 255, 0.95)` | 1 | `components/StoryPlayer.module.css` |
| 1 | `rgba(40, 40, 44, 0.92)` | 1 | `components/StoryPlayer.module.css` |

### 逐筆

| # | 檔案 | 選擇器 | 屬性 | 值 | 全域次數 | 短註 |
|--:|---|---|---|---|--:|---|
| 1 | `components/ParentTrustStrip.module.css`:46 | `.dark` | `border-color` | `rgba(255, 255, 255, 0.26)` | 1 | 夜間條帶疊層 |
| 2 | `components/ParentTrustStrip.module.css`:47 | `.dark` | `background` | `rgba(255, 255, 255, 0.08)` | 3 | ≥3 rgba 疊層 |
| 3 | `components/ParentTrustStrip.module.css`:48 | `.dark` | `color` | `rgba(255, 255, 255, 0.78)` | 2 | 夜間條帶疊層 |
| 4 | `components/StoryPlayer.module.css`:190 | `.endScreen` | `background` | `rgba(0, 0, 0, 0.88)` | 1 | 播放器深底 chrome |
| 5 | `components/StoryPlayer.module.css`:211 | `.endTitle` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 6 | `components/StoryPlayer.module.css`:219 | `.endSubtitle` | `color` | `rgba(255, 255, 255, 0.75)` | 1 | 播放器深底 chrome |
| 7 | `components/StoryPlayer.module.css`:234 | `.endBtn` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 8 | `components/StoryPlayer.module.css`:250 | `.endBtnSecondary` | `background` | `rgba(255, 255, 255, 0.15)` | 1 | 播放器深底 chrome |
| 9 | `components/StoryPlayer.module.css`:252 | `.endBtnSecondary` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 10 | `components/StoryPlayer.module.css`:267 | `.endPromptToggle` | `background` | `rgba(255, 255, 255, 0.08)` | 3 | ≥3 rgba 疊層 |
| 11 | `components/StoryPlayer.module.css`:268 | `.endPromptToggle` | `color` | `rgba(255, 255, 255, 0.78)` | 2 | 播放器深底 chrome |
| 12 | `components/StoryPlayer.module.css`:293 | `.time` | `color` | `rgba(255, 255, 255, 0.9)` | 1 | 播放器深底 chrome |
| 13 | `components/StoryPlayer.module.css`:323 | `.seekBar::-moz-range-track` | `background` | `rgba(255, 255, 255, 0.28)` | 3 | ≥3 rgba 疊層 |
| 14 | `components/StoryPlayer.module.css`:339 | `.seekBar::-webkit-slider-thumb` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 15 | `components/StoryPlayer.module.css`:348 | `.seekBar::-moz-range-thumb` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 16 | `components/StoryPlayer.module.css`:392 | `.topBar` | `background` | `linear-gradient( to bottom, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0) )` | 1 | 播放器深底 chrome |
| 17 | `components/StoryPlayer.module.css`:425 | `.glassPill` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 18 | `components/StoryPlayer.module.css`:436 | `.glassPill:active` | `background` | `rgba(255, 255, 255, 0.22)` | 2 | 播放器深底 chrome |
| 19 | `components/StoryPlayer.module.css`:455 | `.topTitle` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 20 | `components/StoryPlayer.module.css`:467 | `.subtitlesBtn` | `background` | `rgba(20, 20, 24, 0.92)` | 3 | ≥3 rgba 疊層 |
| 21 | `components/StoryPlayer.module.css`:472 | `.subtitlesBtnOn` | `background` | `rgba(20, 20, 24, 0.92)` | 3 | ≥3 rgba 疊層 |
| 22 | `components/StoryPlayer.module.css`:473 | `.subtitlesBtnOn` | `border-color` | `rgba(255, 255, 255, 0.45)` | 2 | 播放器深底 chrome |
| 23 | `components/StoryPlayer.module.css`:509 | `.timerBtnOn` | `background` | `rgba(255, 255, 255, 0.24)` | 3 | ≥3 rgba 疊層 |
| 24 | `components/StoryPlayer.module.css`:522 | `.timerMenu` | `background` | `rgba(20, 20, 24, 0.88)` | 2 | 播放器深底 chrome |
| 25 | `components/StoryPlayer.module.css`:532 | `.timerOpt` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 26 | `components/StoryPlayer.module.css`:535 | `.timerOpt` | `background` | `rgba(255, 255, 255, 0.1)` | 2 | 播放器深底 chrome |
| 27 | `components/StoryPlayer.module.css`:540 | `.timerOptOn` | `background` | `rgba(255, 255, 255, 0.36)` | 1 | 播放器深底 chrome |
| 28 | `components/StoryPlayer.module.css`:552 | `.nightPrompt` | `background` | `rgba(20, 20, 24, 0.92)` | 3 | ≥3 rgba 疊層 |
| 29 | `components/StoryPlayer.module.css`:561 | `.nightPromptText` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 30 | `components/StoryPlayer.module.css`:588 | `.nightPromptNo` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 31 | `components/StoryPlayer.module.css`:589 | `.nightPromptNo` | `background` | `rgba(255, 255, 255, 0.14)` | 1 | 播放器深底 chrome |
| 32 | `components/StoryPlayer.module.css`:628 | `.captionCurrent` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 33 | `components/StoryPlayer.module.css`:633 | `.captionCurrent` | `background` | `rgba(0, 0, 0, 0.55)` | 2 | 播放器深底 chrome |
| 34 | `components/StoryPlayer.module.css`:659 | `.caption` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 35 | `components/StoryPlayer.module.css`:664 | `.caption` | `background` | `rgba(0, 0, 0, 0.55)` | 2 | 播放器深底 chrome |
| 36 | `components/StoryPlayer.module.css`:686 | `.controls` | `background` | `linear-gradient(to top, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0))` | 1 | 播放器深底 chrome |
| 37 | `components/StoryPlayer.module.css`:695 | `.controlsInner` | `background` | `rgba(255, 255, 255, 0.06)` | 1 | 播放器深底 chrome |
| 38 | `components/StoryPlayer.module.css`:705 | `.controlsInner` | `background` | `rgba(24, 24, 28, 0.88)` | 1 | 播放器深底 chrome |
| 39 | `components/StoryPlayer.module.css`:720 | `.glassPill, .closeBtn, .subtitlesBtn, .subtitlesBtnOn, .sfxBtn, .captionSizeBtn, .timerBtn, .timerBtnOn` | `background` | `rgba(40, 40, 44, 0.92)` | 1 | 播放器深底 chrome |
| 40 | `components/StoryPlayer.module.css`:740 | `.ctrlBtn` | `color` | `rgba(255, 255, 255, 0.95)` | 1 | 播放器深底 chrome |
| 41 | `components/StoryPlayer.module.css`:752 | `.ctrlBtn:hover` | `background` | `rgba(255, 255, 255, 0.22)` | 2 | 播放器深底 chrome |
| 42 | `components/StoryPlayer.module.css`:753 | `.ctrlBtn:hover` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 43 | `components/StoryPlayer.module.css`:759 | `.ctrlBtn:active` | `background` | `rgba(255, 255, 255, 0.28)` | 3 | ≥3 rgba 疊層 |
| 44 | `components/StoryPlayer.module.css`:772 | `.ctrlBtnOn` | `background` | `rgba(255, 255, 255, 0.2)` | 1 | 播放器深底 chrome |
| 45 | `components/StoryPlayer.module.css`:815 | `.playBtn` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 46 | `components/StoryPlayer.module.css`:842 | `.errorBanner` | `background` | `rgba(0, 0, 0, 0.78)` | 1 | 播放器深底 chrome |
| 47 | `components/StoryPlayer.module.css`:843 | `.errorBanner` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 48 | `components/StoryPlayer.module.css`:910 | `.cuePanel` | `background` | `rgba(20, 20, 24, 0.88)` | 2 | 播放器深底 chrome |
| 49 | `components/StoryPlayer.module.css`:911 | `.cuePanel` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 50 | `components/StoryPlayer.module.css`:938 | `.cueMark` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 51 | `components/StoryPlayer.module.css`:948 | `.cueOut` | `background` | `rgba(255, 255, 255, 0.1)` | 2 | 播放器深底 chrome |
| 52 | `components/StoryPlayer.module.css`:966 | `.cueBtns button` | `background` | `rgba(255, 255, 255, 0.08)` | 3 | ≥3 rgba 疊層 |
| 53 | `components/StoryPlayer.module.css`:967 | `.cueBtns button` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 54 | `components/coloring/ColoringCanvas.module.css`:17 | `.backPage` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 55 | `components/coloring/ColoringCanvas.module.css`:74 | `.guide` | `color` | `color-mix(in srgb, #2a3a4a 78%, transparent)` | 1 | 既有 --coloring-ink 遺漏 |
| 56 | `components/coloring/ColoringCanvas.module.css`:87 | `.completionHint` | `color` | `#5d4a67` | 3 | ≥3 遊戲／著色本墨色 |
| 57 | `components/coloring/ColoringCanvas.module.css`:109 | `.stage` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 58 | `components/coloring/ColoringCanvas.module.css`:143 | `.preview` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 59 | `components/coloring/ColoringCover.module.css`:32 | `.doodleLeft, .doodleRight` | `color` | `color-mix(in srgb, #2a3a4a 55%, transparent)` | 1 | 既有 --coloring-ink 遺漏 |
| 60 | `components/coloring/ColoringCover.module.css`:93 | `.cta` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 61 | `components/coloring/ColoringPageShell.module.css`:22 | `.skip` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 62 | `components/coloring/ColoringPalette.module.css`:29 | `.selected` | `border-color` | `#2a3a4a` | 4 | 既有 --coloring-ink 遺漏 |
| 63 | `components/coloring/ColoringToolbar.module.css`:30 | `.btn` | `background` | `#fff` | 29 | 既有白 token 遺漏 |
| 64 | `components/coloring/ColoringToolbar.module.css`:31 | `.btn` | `color` | `#2a3a4a` | 4 | 既有 --coloring-ink 遺漏 |
| 65 | `components/coloring/ColoringToolbar.module.css`:48 | `.active` | `background` | `#2a3a4a` | 4 | 既有 --coloring-ink 遺漏 |
| 66 | `components/coloring/ColoringToolbar.module.css`:49 | `.active` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 67 | `components/coloring/ColoringToolbar.module.css`:50 | `.active` | `border-color` | `#2a3a4a` | 4 | 既有 --coloring-ink 遺漏 |
| 68 | `components/coloring/ColoringToolbar.module.css`:56 | `.primary` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 69 | `components/coloring/ColoringToolbar.module.css`:89 | `.scrollHint` | `color` | `color-mix(in srgb, #2a3a4a 70%, transparent)` | 1 | 既有 --coloring-ink 遺漏 |
| 70 | `components/for-parents/PlayMapCityWall.module.css`:130 | `.tile[aria-pressed="true"]` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 71 | `components/games/CandyMatchView.module.css`:94 | `.taskHeading` | `color` | `#5d4a67` | 3 | ≥3 遊戲／著色本墨色 |
| 72 | `components/games/CandyMatchView.module.css`:146 | `.taskGoal` | `color` | `#5d4a67` | 3 | ≥3 遊戲／著色本墨色 |
| 73 | `components/landing/LandingSegment.module.css`:100 | `.content` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 74 | `components/landing/LandingSegment.module.css`:188 | `.subscribeCta:hover` | `background` | `rgba(255, 255, 255, 0.24)` | 3 | ≥3 rgba 疊層 |
| 75 | `components/landing/LandingSegment.module.css`:201 | `.subscribeCta` | `color` | `#fff` | 29 | 既有白 token 遺漏 |
| 76 | `components/landing/LandingSegment.module.css`:215 | `.subscribeCta:active` | `background` | `rgba(255, 255, 255, 0.24)` | 3 | ≥3 rgba 疊層 |
| 77 | `components/landing/SegmentNav.module.css`:28 | `.list::before` | `background` | `rgba(255, 255, 255, 0.28)` | 3 | ≥3 rgba 疊層 |
| 78 | `components/story/FamilyActivityCard.module.css`:6 | `.wrap` | `background` | `rgba(255, 255, 255, 0.72)` | 3 | ≥3 rgba 疊層 |
| 79 | `components/story/ReflectionPrompt.module.css`:6 | `.wrap` | `background` | `rgba(255, 255, 255, 0.72)` | 3 | ≥3 rgba 疊層 |
| 80 | `components/universe/HotspotLayer.module.css`:86 | `.signIcon` | `background` | `rgba(255, 255, 255, 0.72)` | 3 | ≥3 rgba 疊層 |
| 81 | `components/universe/UniverseMap.module.css`:321 | `.tapHint` | `color` | `#7a5410` | 3 | 既有 --map-chip-ink 遺漏 |
| 82 | `components/universe/UniverseMap.module.css`:346 | `.tapHintClose` | `color` | `#7a5410` | 3 | 既有 --map-chip-ink 遺漏 |
| 83 | `components/universe/ZoneIsland.module.css`:602 | `.progressChip` | `color` | `#7a5410` | 3 | 既有 --map-chip-ink 遺漏 |
| 84 | `components/universe/ZoneSheet.module.css`:692 | `.storyCardNew` | `color` | `#7a4012` | 1 | 既有 --landing-cta-fg 遺漏 |
| 85 | `components/universe/ZoneSheet.module.css`:698 | `:global([data-theme="night"]) .storyCardNew` | `color` | `#3a2410` | 1 | 既有 --landing-brand-ink 遺漏 |

---

## 類別二：一次性插畫／裝飾色，應永久豁免（37）

只出現一次，且所在元件是宇宙地圖場景、木牌、島嶼美術或著色本紙色。未來稽核若要把「待辦」收斂，這類不應再算成未達標。

豁免理由共通：**替只用一次的插畫色命名，讀的人還要跳到 `globals.css` 才知道那是什麼顏色，沒有增加意義。** DESIGN.md 已允許「遊戲載入器、地圖木牌、播放器黑底等固定美術色」走 component-local；地圖場景層屬「固定美術色允許清單（同木牌），不吃主題 token」。

### 按值

| 全域次數 | 值 | 本類筆數 | 出現檔案 |
|--:|---|--:|---|
| 1 | `#245f5b` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#2a4468` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `#5b9f98` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#6b4808` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `#6ba9a0` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#6f655a` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#aaa092` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#bdb2a3` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#bfe0ef` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `#c18b45` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#dd913d` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#e8b85e` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `#ecd0a5` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `#fff8ea` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `linear-gradient( 180deg, rgba(255, 248, 232, 0) 0%, rgba(255, 248, 232, 0.92) 28%, rgba(255, 244, 220, 0.97) 100% )` | 1 | `components/universe/IslandPickerStrip.module.css` |
| 1 | `linear-gradient( 180deg, rgba(30, 55, 95, 0.04) 0%, rgba(25, 50, 90, 0.1) 55%, rgba(20, 45, 85, 0.14) 100% )` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `linear-gradient( 90deg, color-mix(in srgb, #2a3a4a 10%, transparent) 0, color-mix(in srgb, #2a3a4a 10%, transparent) 10px, transparent 10px ), linear-gradient(165deg, #fffdf8 0%, #fff6ea 55%, #f3f8ff 100%)` | 1 | `components/coloring/ColoringPagePicker.module.css` |
| 1 | `linear-gradient(180deg, #e6f6ef 0%, #acd9cf 100%)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `linear-gradient(180deg, #f5f1e8 0%, #d7ccbd 100%)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `linear-gradient(180deg, #fff1c9 0%, #e8b85e 100%)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `linear-gradient(90deg, #4e8c86, #a9d9cf 48%, #4e8c86)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `linear-gradient(90deg, #9f9487, #ded5c8 48%, #9f9487)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `linear-gradient(90deg, #a66f2d, #f0ca7b 48%, #a66f2d)` | 1 | `components/universe/HotspotLayer.module.css` |
| 1 | `radial-gradient( ellipse 46% 92% at 50% 0%, rgba(214, 232, 255, 0.34) 0%, rgba(196, 220, 252, 0.13) 32%, transparent 72% )` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `radial-gradient( ellipse 74% 64% at 50% 46%, transparent 46%, rgba(8, 20, 44, 0.28) 100% ), linear-gradient( 180deg, rgba(168, 196, 236, 0.08) 0%, transparent 32%, rgba(6, 18, 40, 0.16) 100% )` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `radial-gradient( ellipse 78% 68% at 50% 46%, transparent 52%, rgba(42, 68, 104, 0.1) 100% ), linear-gradient( 180deg, rgba(255, 253, 246, 0.16) 0%, transparent 34%, rgba(58, 96, 140, 0.07) 100% )` | 1 | `components/universe/UniverseMap.module.css` |
| 1 | `radial-gradient( ellipse at 50% 55%, rgba(255, 214, 140, 0.5) 0%, rgba(255, 200, 110, 0.22) 40%, transparent 68% )` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient( ellipse at 50% 55%, rgba(255, 241, 194, 0.6) 0%, rgba(255, 236, 178, 0.26) 38%, transparent 68% )` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient( ellipse at 50% 62%, rgba(255, 214, 140, 0.3) 0%, rgba(255, 214, 140, 0.12) 48%, transparent 72% )` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient(circle at 35% 30%, #e6f2fb, #bcd9ee)` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient(circle at 35% 30%, #eef0fb, #cfd6ef)` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient(circle at 35% 30%, #fbe9c8, #e9c98f)` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `radial-gradient(circle at 35% 30%, #fdf0c4, #f0d68a)` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient(circle at 38% 30%, #f7ead0, #e6cb98 72%, #dcbf86)` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `radial-gradient(circle at 40% 60%, rgba(180, 150, 90, 0.08), transparent 55%)` | 1 | `components/universe/StatusOverlay.module.css` |
| 1 | `rgba(255, 220, 120, 0.96)` | 1 | `components/universe/ZoneIsland.module.css` |
| 1 | `rgba(255, 233, 179, 0.92)` | 1 | `components/universe/ZoneIsland.module.css` |

### 逐筆

| # | 檔案 | 選擇器 | 屬性 | 值 | 全域次數 | 短註 |
|--:|---|---|---|---|--:|---|
| 1 | `components/coloring/ColoringPagePicker.module.css`:47 | `.book` | `background` | `linear-gradient( 90deg, color-mix(in srgb, #2a3a4a 10%, transparent) 0, color-mix(in srgb, #2a3a4a 10%, transparent) 10px, transparent 10px ), linear-gradient(165deg, #fffdf8 0%, #fff6ea 55%, #f3f8ff 100%)` | 1 | 一次性地圖／著色本美術 |
| 2 | `components/universe/HotspotLayer.module.css`:56 | `.signPlate` | `background` | `linear-gradient(180deg, #fff1c9 0%, #e8b85e 100%)` | 1 | 一次性地圖／著色本美術 |
| 3 | `components/universe/HotspotLayer.module.css`:74 | `.signPlate::after` | `background` | `#e8b85e` | 1 | 一次性地圖／著色本美術 |
| 4 | `components/universe/HotspotLayer.module.css`:111 | `.signStem` | `background` | `linear-gradient(90deg, #a66f2d, #f0ca7b 48%, #a66f2d)` | 1 | 一次性地圖／著色本美術 |
| 5 | `components/universe/HotspotLayer.module.css`:120 | `.signBase` | `background` | `#c18b45` | 1 | 一次性地圖／著色本美術 |
| 6 | `components/universe/HotspotLayer.module.css`:128 | `.pin[data-kind="story"] .signPlate` | `border-color` | `#dd913d` | 1 | 一次性地圖／著色本美術 |
| 7 | `components/universe/HotspotLayer.module.css`:132 | `.pin[data-kind="link"] .signPlate` | `border-color` | `#5b9f98` | 1 | 一次性地圖／著色本美術 |
| 8 | `components/universe/HotspotLayer.module.css`:133 | `.pin[data-kind="link"] .signPlate` | `background` | `linear-gradient(180deg, #e6f6ef 0%, #acd9cf 100%)` | 1 | 一次性地圖／著色本美術 |
| 9 | `components/universe/HotspotLayer.module.css`:134 | `.pin[data-kind="link"] .signPlate` | `color` | `#245f5b` | 1 | 一次性地圖／著色本美術 |
| 10 | `components/universe/HotspotLayer.module.css`:138 | `.pin[data-kind="link"] .signStem` | `background` | `linear-gradient(90deg, #4e8c86, #a9d9cf 48%, #4e8c86)` | 1 | 一次性地圖／著色本美術 |
| 11 | `components/universe/HotspotLayer.module.css`:142 | `.pin[data-kind="link"] .signBase` | `background` | `#6ba9a0` | 1 | 一次性地圖／著色本美術 |
| 12 | `components/universe/HotspotLayer.module.css`:150 | `.pinLocked .signPlate` | `border-color` | `#bdb2a3` | 1 | 一次性地圖／著色本美術 |
| 13 | `components/universe/HotspotLayer.module.css`:151 | `.pinLocked .signPlate` | `background` | `linear-gradient(180deg, #f5f1e8 0%, #d7ccbd 100%)` | 1 | 一次性地圖／著色本美術 |
| 14 | `components/universe/HotspotLayer.module.css`:152 | `.pinLocked .signPlate` | `color` | `#6f655a` | 1 | 一次性地圖／著色本美術 |
| 15 | `components/universe/HotspotLayer.module.css`:156 | `.pinLocked .signStem` | `background` | `linear-gradient(90deg, #9f9487, #ded5c8 48%, #9f9487)` | 1 | 一次性地圖／著色本美術 |
| 16 | `components/universe/HotspotLayer.module.css`:160 | `.pinLocked .signBase` | `background` | `#aaa092` | 1 | 一次性地圖／著色本美術 |
| 17 | `components/universe/IslandPickerStrip.module.css`:11 | `.strip` | `background` | `linear-gradient( 180deg, rgba(255, 248, 232, 0) 0%, rgba(255, 248, 232, 0.92) 28%, rgba(255, 244, 220, 0.97) 100% )` | 1 | 一次性地圖／著色本美術 |
| 18 | `components/universe/StatusOverlay.module.css`:18 | `.dust` | `background` | `radial-gradient(circle at 40% 60%, rgba(180, 150, 90, 0.08), transparent 55%)` | 1 | 一次性地圖／著色本美術 |
| 19 | `components/universe/UniverseMap.module.css`:15 | `.map` | `background` | `#bfe0ef` | 1 | 一次性地圖／著色本美術 |
| 20 | `components/universe/UniverseMap.module.css`:21 | `:global(html[data-theme="night"]) .map` | `background` | `#2a4468` | 1 | 一次性地圖／著色本美術 |
| 21 | `components/universe/UniverseMap.module.css`:79 | `.moonGlitter` | `background` | `radial-gradient( ellipse 46% 92% at 50% 0%, rgba(214, 232, 255, 0.34) 0%, rgba(196, 220, 252, 0.13) 32%, transparent 72% )` | 1 | 一次性地圖／著色本美術 |
| 22 | `components/universe/UniverseMap.module.css`:144 | `.bridgeSvg:hover .bridgePlank` | `stroke` | `#ecd0a5` | 1 | 一次性地圖／著色本美術 |
| 23 | `components/universe/UniverseMap.module.css`:191 | `.nightSeaOverlay` | `background` | `linear-gradient( 180deg, rgba(30, 55, 95, 0.04) 0%, rgba(25, 50, 90, 0.1) 55%, rgba(20, 45, 85, 0.14) 100% )` | 1 | 一次性地圖／著色本美術 |
| 24 | `components/universe/UniverseMap.module.css`:217 | `.atmosphere` | `background` | `radial-gradient( ellipse 78% 68% at 50% 46%, transparent 52%, rgba(42, 68, 104, 0.1) 100% ), linear-gradient( 180deg, rgba(255, 253, 246, 0.16) 0%, transparent 34%, rgba(58, 96, 140, 0.07) 100% )` | 1 | 一次性地圖／著色本美術 |
| 25 | `components/universe/UniverseMap.module.css`:233 | `:global(html[data-theme="night"]) .atmosphere` | `background` | `radial-gradient( ellipse 74% 64% at 50% 46%, transparent 46%, rgba(8, 20, 44, 0.28) 100% ), linear-gradient( 180deg, rgba(168, 196, 236, 0.08) 0%, transparent 32%, rgba(6, 18, 40, 0.16) 100% )` | 1 | 一次性地圖／著色本美術 |
| 26 | `components/universe/UniverseMap.module.css`:319 | `.tapHint` | `background` | `#fff8ea` | 1 | 一次性地圖／著色本美術 |
| 27 | `components/universe/ZoneIsland.module.css`:122 | `.islandTile[data-status="open"]::before` | `background` | `radial-gradient( ellipse at 50% 55%, rgba(255, 241, 194, 0.6) 0%, rgba(255, 236, 178, 0.26) 38%, transparent 68% )` | 1 | 一次性地圖／著色本美術 |
| 28 | `components/universe/ZoneIsland.module.css`:247 | `:global(html[data-theme="night"]) .islandTile[data-status="open"]::before` | `background` | `radial-gradient( ellipse at 50% 55%, rgba(255, 214, 140, 0.5) 0%, rgba(255, 200, 110, 0.22) 40%, transparent 68% )` | 1 | 一次性地圖／著色本美術 |
| 29 | `components/universe/ZoneIsland.module.css`:404 | `.landmark` | `background` | `radial-gradient(circle at 38% 30%, #f7ead0, #e6cb98 72%, #dcbf86)` | 1 | 一次性地圖／著色本美術 |
| 30 | `components/universe/ZoneIsland.module.css`:421 | `.island[data-status="building"] .landmark` | `background` | `radial-gradient(circle at 35% 30%, #fdf0c4, #f0d68a)` | 1 | 一次性地圖／著色本美術 |
| 31 | `components/universe/ZoneIsland.module.css`:425 | `.island[data-status="coming"] .landmark` | `background` | `radial-gradient(circle at 35% 30%, #e6f2fb, #bcd9ee)` | 1 | 一次性地圖／著色本美術 |
| 32 | `components/universe/ZoneIsland.module.css`:429 | `.island[data-status="planned"] .landmark` | `background` | `radial-gradient(circle at 35% 30%, #eef0fb, #cfd6ef)` | 1 | 一次性地圖／著色本美術 |
| 33 | `components/universe/ZoneIsland.module.css`:601 | `.progressChip` | `background` | `rgba(255, 233, 179, 0.92)` | 1 | 一次性地圖／著色本美術 |
| 34 | `components/universe/ZoneIsland.module.css`:611 | `.progressChip[data-full-stars]` | `background` | `rgba(255, 220, 120, 0.96)` | 1 | 一次性地圖／著色本美術 |
| 35 | `components/universe/ZoneIsland.module.css`:612 | `.progressChip[data-full-stars]` | `color` | `#6b4808` | 1 | 一次性地圖／著色本美術 |
| 36 | `components/universe/ZoneIsland.module.css`:652 | `.islandTile[data-progress] .tileStack::before` | `background` | `radial-gradient( ellipse at 50% 62%, rgba(255, 214, 140, 0.3) 0%, rgba(255, 214, 140, 0.12) 48%, transparent 72% )` | 1 | 一次性地圖／著色本美術 |
| 37 | `components/universe/ZoneSheet.module.css`:191 | `.landmark` | `background` | `radial-gradient(circle at 35% 30%, #fbe9c8, #e9c98f)` | 1 | 一次性地圖／著色本美術 |

---

## 類別三：無法判斷（60）

看不出屬於前兩類。**這一類的存在是預期的。** 完整清單如下，交給人判斷。

常見落在這裡的形狀：

- 開發路徑粉 `rgba(239, 71, 111, 0.55)`（3 次，但是除錯色）
- 只重複 2 次的功能色（遊戲次要字、著色本 CTA、studio 玻璃、landing 導覽疊層）
- `ZoneSheet` 功能面板上的一次性 chrome
- landing／games 功能元件上的一次性漸層與 overlay

### 按值

| 全域次數 | 值 | 本類筆數 | 出現檔案 |
|--:|---|--:|---|
| 3 | `rgba(239, 71, 111, 0.55)` | 3 | `components/universe/IslandRoamerLayer.module.css`、`components/universe/MapRoamerLayer.module.css`、`components/universe/RoamerVehicle.module.css` |
| 2 | `#704817` | 2 | `components/universe/HotspotLayer.module.css`、`components/universe/ZoneSheet.module.css` |
| 2 | `#7c6886` | 2 | `components/games/CandyMatchView.module.css` |
| 2 | `#e85d4c` | 2 | `components/coloring/ColoringToolbar.module.css` |
| 2 | `#f7f1e8` | 2 | `components/coloring/ColoringPagePicker.module.css` |
| 2 | `#fff6e6` | 2 | `components/universe/UniverseMap.module.css`、`components/universe/ZoneIsland.module.css` |
| 2 | `color-mix(in srgb, #fff 92%, transparent)` | 2 | `components/coloring/ColoringPagePicker.module.css` |
| 2 | `linear-gradient(#caa063, #a5773c)` | 2 | `components/universe/UniverseMap.module.css`、`components/universe/ZoneIsland.module.css` |
| 2 | `radial-gradient( ellipse at center, rgba(72, 58, 44, 0.42) 0%, rgba(72, 58, 44, 0.28) 45%, rgba(72, 58, 44, 0) 72% )` | 2 | `components/universe/IslandRoamerLayer.module.css`、`components/universe/RoamerVehicle.module.css` |
| 2 | `rgba(255, 255, 255, 0.8)` | 2 | `components/studio/EngagementMetricsPanel.module.css`、`components/studio/IllustrationQueuePanel.module.css` |
| 2 | `rgba(255, 255, 255, 0.85)` | 2 | `components/landing/SegmentNav.module.css`、`components/landing/SiteNavBar.module.css` |
| 2 | `rgba(255, 255, 255, 0.88)` | 2 | `components/games/GameJuiceToast.module.css`、`components/landing/SegmentNav.module.css` |
| 2 | `rgba(47, 41, 54, 0.76)` | 2 | `app/games/page.module.css`、`components/games/GameIntro.module.css` |
| 2 | `rgba(255, 255, 255, 0.45)` | 1 | `components/landing/SegmentNav.module.css` |
| 1 | `#70685f` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `#a5567a` | 1 | `components/games/CandyMatchView.module.css` |
| 1 | `#b3402f` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `#e2b565` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `color-mix(in srgb, #7bc47f 42%, transparent)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, #fff 78%, #dff0e4)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, #fff 80%, transparent)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, #fff 86%, #dff0e4)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, #fff 88%, #fff2c4)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, #fffaf2 88%, transparent)` | 1 | `components/coloring/ColoringCanvas.module.css` |
| 1 | `color-mix(in srgb, currentColor 12%, transparent)` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `linear-gradient( 180deg, color-mix(in srgb, #18203d 62%, transparent), color-mix(in srgb, #18203d 94%, transparent) )` | 1 | `components/games/GameLoadOverlay.module.css` |
| 1 | `linear-gradient( 180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.22) 100% )` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `linear-gradient( 180deg, rgba(37, 42, 104, 0.36) 0%, rgba(74, 58, 112, 0.17) 48%, rgba(255, 166, 92, 0.045) 100% )` | 1 | `components/landing/LandingBedtimeLayer.module.css` |
| 1 | `linear-gradient( to bottom, rgba(38, 20, 8, 0.2) 0%, rgba(38, 20, 8, 0) 100% )` | 1 | `components/landing/LandingSegment.module.css` |
| 1 | `linear-gradient(0deg, rgba(31, 27, 45, 0.25), transparent 60%)` | 1 | `components/games/GameIntro.module.css` |
| 1 | `linear-gradient(180deg, #ffd27a, #ffb347)` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `linear-gradient(180deg, #fff4d6, #f4dc9d)` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `radial-gradient( 120% 90% at 14% 100%, rgba(38, 20, 8, 0.52) 0%, rgba(38, 20, 8, 0.28) 42%, rgba(38, 20, 8, 0) 70% ), linear-gradient( to top, rgba(38, 20, 8, 0.48) 0%, rgba(38, 20, 8, 0.3) 28%, rgba(38, 20, 8, 0.12) 52%, rgba(38, 20, 8, 0) 78% )` | 1 | `components/landing/LandingSegment.module.css` |
| 1 | `rgba(107, 63, 30, 0.09)` | 1 | `components/landing/SiteNavBar.module.css` |
| 1 | `rgba(107, 63, 30, 0.12)` | 1 | `components/landing/SiteNavBar.module.css` |
| 1 | `rgba(120, 80, 40, 0.08)` | 1 | `components/landing/SiteNavBar.module.css` |
| 1 | `rgba(120, 80, 40, 0.14)` | 1 | `components/landing/SiteNavBar.module.css` |
| 1 | `rgba(15, 23, 42, 0.38)` | 1 | `components/universe/HotspotModal.module.css` |
| 1 | `rgba(15, 23, 42, 0.55)` | 1 | `components/games/GameChrome.module.css` |
| 1 | `rgba(180, 120, 60, 0.32)` | 1 | `components/universe/ZoneSheet.module.css` |
| 1 | `rgba(255, 255, 255, 0.16)` | 1 | `components/landing/LandingSegment.module.css` |
| 1 | `rgba(255, 255, 255, 0.32)` | 1 | `components/landing/SegmentNav.module.css` |
| 1 | `rgba(255, 255, 255, 0.35)` | 1 | `components/universe/IslandPickerStrip.module.css` |
| 1 | `rgba(255, 255, 255, 0.55)` | 1 | `components/landing/SegmentNav.module.css` |
| 1 | `rgba(255, 255, 255, 0.96)` | 1 | `components/universe/RoamerGreeting.module.css` |
| 1 | `rgba(38, 20, 8, 0.86)` | 1 | `components/landing/SegmentNav.module.css` |

### 逐筆（完整清單）

| # | 檔案 | 選擇器 | 屬性 | 值 | 全域次數 | 短註 |
|--:|---|---|---|---|--:|---|
| 1 | `app/games/page.module.css`:231 | `.ageBadge` | `background` | `rgba(47, 41, 54, 0.76)` | 2 | 猶豫 |
| 2 | `components/coloring/ColoringCanvas.module.css`:66 | `.doneOverlay` | `background` | `color-mix(in srgb, #fffaf2 88%, transparent)` | 1 | 猶豫 |
| 3 | `components/coloring/ColoringCanvas.module.css`:75 | `.guide` | `background` | `color-mix(in srgb, #fff 78%, #dff0e4)` | 1 | 猶豫 |
| 4 | `components/coloring/ColoringCanvas.module.css`:88 | `.completionHint` | `background` | `color-mix(in srgb, #fff 88%, #fff2c4)` | 1 | 猶豫 |
| 5 | `components/coloring/ColoringCanvas.module.css`:98 | `.completionHint[data-tone="rich"]` | `border-color` | `color-mix(in srgb, #7bc47f 42%, transparent)` | 1 | 猶豫 |
| 6 | `components/coloring/ColoringCanvas.module.css`:99 | `.completionHint[data-tone="rich"]` | `background` | `color-mix(in srgb, #fff 86%, #dff0e4)` | 1 | 猶豫 |
| 7 | `components/coloring/ColoringCanvas.module.css`:184 | `.saveNotice` | `color` | `#b3402f` | 1 | 猶豫 |
| 8 | `components/coloring/ColoringCanvas.module.css`:193 | `.loading` | `background` | `color-mix(in srgb, #fff 80%, transparent)` | 1 | 猶豫 |
| 9 | `components/coloring/ColoringPagePicker.module.css`:95 | `.card` | `background` | `color-mix(in srgb, #fff 92%, transparent)` | 2 | 猶豫 |
| 10 | `components/coloring/ColoringPagePicker.module.css`:118 | `.thumb` | `background` | `#f7f1e8` | 2 | 猶豫 |
| 11 | `components/coloring/ColoringPagePicker.module.css`:155 | `.galleryCard` | `background` | `color-mix(in srgb, #fff 92%, transparent)` | 2 | 猶豫 |
| 12 | `components/coloring/ColoringPagePicker.module.css`:172 | `.galleryThumb` | `background` | `#f7f1e8` | 2 | 猶豫 |
| 13 | `components/coloring/ColoringToolbar.module.css`:54 | `.primary` | `background` | `#e85d4c` | 2 | 猶豫 |
| 14 | `components/coloring/ColoringToolbar.module.css`:55 | `.primary` | `border-color` | `#e85d4c` | 2 | 猶豫 |
| 15 | `components/games/CandyMatchView.module.css`:111 | `.taskKicker, .movesLabel` | `color` | `#7c6886` | 2 | 猶豫 |
| 16 | `components/games/CandyMatchView.module.css`:115 | `.movesWarning` | `color` | `#a5567a` | 1 | 猶豫 |
| 17 | `components/games/CandyMatchView.module.css`:169 | `.starLegend` | `color` | `#7c6886` | 2 | 猶豫 |
| 18 | `components/games/GameChrome.module.css`:59 | `.overlay` | `background` | `rgba(15, 23, 42, 0.55)` | 1 | 猶豫 |
| 19 | `components/games/GameIntro.module.css`:31 | `.cover::after` | `background` | `linear-gradient(0deg, rgba(31, 27, 45, 0.25), transparent 60%)` | 1 | 猶豫 |
| 20 | `components/games/GameIntro.module.css`:47 | `.coverLabel` | `background` | `rgba(47, 41, 54, 0.76)` | 2 | 猶豫 |
| 21 | `components/games/GameJuiceToast.module.css`:2 | `.toast` | `background` | `rgba(255, 255, 255, 0.88)` | 2 | 猶豫 |
| 22 | `components/games/GameLoadOverlay.module.css`:59 | `:global([data-theme="night"]) .artShade` | `background` | `linear-gradient( 180deg, color-mix(in srgb, #18203d 62%, transparent), color-mix(in srgb, #18203d 94%, transparent) )` | 1 | 猶豫 |
| 23 | `components/landing/LandingBedtimeLayer.module.css`:28 | `.veilWarm` | `background` | `linear-gradient( 180deg, rgba(37, 42, 104, 0.36) 0%, rgba(74, 58, 112, 0.17) 48%, rgba(255, 166, 92, 0.045) 100% )` | 1 | 猶豫 |
| 24 | `components/landing/LandingSegment.module.css`:57 | `.scrim` | `background` | `radial-gradient( 120% 90% at 14% 100%, rgba(38, 20, 8, 0.52) 0%, rgba(38, 20, 8, 0.28) 42%, rgba(38, 20, 8, 0) 70% ), linear-gradient( to top, rgba(38, 20, 8, 0.48) 0%, rgba(38, 20, 8, 0.3) 28%, rgba(38, 20, 8, 0.12) 52%, rgba(38, 20, 8, 0) 78% )` | 1 | 猶豫 |
| 25 | `components/landing/LandingSegment.module.css`:81 | `.visual::after` | `background` | `linear-gradient( to bottom, rgba(38, 20, 8, 0.2) 0%, rgba(38, 20, 8, 0) 100% )` | 1 | 猶豫 |
| 26 | `components/landing/LandingSegment.module.css`:200 | `.subscribeCta` | `background` | `rgba(255, 255, 255, 0.16)` | 1 | 猶豫 |
| 27 | `components/landing/SegmentNav.module.css`:51 | `.dot::after` | `background` | `rgba(255, 255, 255, 0.55)` | 1 | 猶豫 |
| 28 | `components/landing/SegmentNav.module.css`:65 | `.active.dot::after` | `border-color` | `rgba(255, 255, 255, 0.85)` | 2 | 猶豫 |
| 29 | `components/landing/SegmentNav.module.css`:102 | `.nav` | `background` | `rgba(38, 20, 8, 0.86)` | 1 | 猶豫 |
| 30 | `components/landing/SegmentNav.module.css`:134 | `.dot::after` | `background` | `rgba(255, 255, 255, 0.32)` | 1 | 猶豫 |
| 31 | `components/landing/SegmentNav.module.css`:135 | `.dot::after` | `border-color` | `rgba(255, 255, 255, 0.45)` | 2 | 猶豫 |
| 32 | `components/landing/SegmentNav.module.css`:141 | `.active.dot::after` | `border-color` | `rgba(255, 255, 255, 0.88)` | 2 | 猶豫 |
| 33 | `components/landing/SiteNavBar.module.css`:234 | `.menuLink:hover, .menuLink[aria-current="page"]` | `background` | `rgba(120, 80, 40, 0.08)` | 1 | 猶豫 |
| 34 | `components/landing/SiteNavBar.module.css`:238 | `.menuLink:active` | `background` | `rgba(120, 80, 40, 0.14)` | 1 | 猶豫 |
| 35 | `components/landing/SiteNavBar.module.css`:345 | `.navLink:hover` | `background` | `rgba(107, 63, 30, 0.09)` | 1 | 猶豫 |
| 36 | `components/landing/SiteNavBar.module.css`:354 | `.navLinkActive` | `background` | `rgba(107, 63, 30, 0.12)` | 1 | 猶豫 |
| 37 | `components/landing/SiteNavBar.module.css`:423 | `:global(html:has([data-landing-root])) .bar[data-nav-solid="true"] .inner` | `border-color` | `rgba(255, 255, 255, 0.85)` | 2 | 猶豫 |
| 38 | `components/studio/EngagementMetricsPanel.module.css`:27 | `.card` | `background` | `rgba(255, 255, 255, 0.8)` | 2 | 猶豫 |
| 39 | `components/studio/IllustrationQueuePanel.module.css`:35 | `.item` | `background` | `rgba(255, 255, 255, 0.8)` | 2 | 猶豫 |
| 40 | `components/universe/HotspotLayer.module.css`:61 | `.signPlate` | `color` | `#704817` | 2 | 猶豫 |
| 41 | `components/universe/HotspotModal.module.css`:10 | `.overlay` | `background` | `rgba(15, 23, 42, 0.38)` | 1 | 猶豫 |
| 42 | `components/universe/IslandPickerStrip.module.css`:89 | `.thumb` | `background` | `rgba(255, 255, 255, 0.35)` | 1 | 猶豫 |
| 43 | `components/universe/IslandRoamerLayer.module.css`:31 | `.shadow` | `background` | `radial-gradient( ellipse at center, rgba(72, 58, 44, 0.42) 0%, rgba(72, 58, 44, 0.28) 45%, rgba(72, 58, 44, 0) 72% )` | 2 | 猶豫 |
| 44 | `components/universe/IslandRoamerLayer.module.css`:107 | `.devPathLine` | `stroke` | `rgba(239, 71, 111, 0.55)` | 3 | 開發路徑／placeholder |
| 45 | `components/universe/MapRoamerLayer.module.css`:21 | `.devPathLine` | `stroke` | `rgba(239, 71, 111, 0.55)` | 3 | 開發路徑／placeholder |
| 46 | `components/universe/RoamerGreeting.module.css`:9 | `.bubble` | `background` | `rgba(255, 255, 255, 0.96)` | 1 | 猶豫 |
| 47 | `components/universe/RoamerVehicle.module.css`:35 | `.shadow` | `background` | `radial-gradient( ellipse at center, rgba(72, 58, 44, 0.42) 0%, rgba(72, 58, 44, 0.28) 45%, rgba(72, 58, 44, 0) 72% )` | 2 | 猶豫 |
| 48 | `components/universe/RoamerVehicle.module.css`:94 | `.placeholder` | `background` | `rgba(239, 71, 111, 0.55)` | 3 | 開發路徑／placeholder |
| 49 | `components/universe/UniverseMap.module.css`:265 | `.titleText` | `color` | `#fff6e6` | 2 | 猶豫 |
| 50 | `components/universe/UniverseMap.module.css`:266 | `.titleText` | `background` | `linear-gradient(#caa063, #a5773c)` | 2 | 猶豫 |
| 51 | `components/universe/ZoneIsland.module.css`:442 | `.name` | `color` | `#fff6e6` | 2 | 猶豫 |
| 52 | `components/universe/ZoneIsland.module.css`:443 | `.name` | `background` | `linear-gradient(#caa063, #a5773c)` | 2 | 猶豫 |
| 53 | `components/universe/ZoneSheet.module.css`:15 | `.overlayScrim` | `background` | `linear-gradient( 180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0.22) 100% )` | 1 | 猶豫 |
| 54 | `components/universe/ZoneSheet.module.css`:302 | `.hotspotFeatured` | `color` | `#704817` | 2 | 猶豫 |
| 55 | `components/universe/ZoneSheet.module.css`:303 | `.hotspotFeatured` | `background` | `linear-gradient(180deg, #fff4d6, #f4dc9d)` | 1 | 猶豫 |
| 56 | `components/universe/ZoneSheet.module.css`:304 | `.hotspotFeatured` | `border-color` | `#e2b565` | 1 | 猶豫 |
| 57 | `components/universe/ZoneSheet.module.css`:315 | `.hotspotIcon` | `background` | `color-mix(in srgb, currentColor 12%, transparent)` | 1 | 猶豫 |
| 58 | `components/universe/ZoneSheet.module.css`:392 | `.segmentTilePrimary` | `border-color` | `rgba(180, 120, 60, 0.32)` | 1 | 猶豫 |
| 59 | `components/universe/ZoneSheet.module.css`:693 | `.storyCardNew` | `background` | `linear-gradient(180deg, #ffd27a, #ffb347)` | 1 | 猶豫 |
| 60 | `components/universe/ZoneSheet.module.css`:711 | `.storyCardTitle` | `color` | `#70685f` | 1 | 猶豫 |

---

## 不在本文件範圍

- 不改任何色彩宣告、不新增 token、不改稽核腳本
- 不把類別二算進「應該做」的分母——那是之後若改稽核政策才決定
- 不補 spacing 階梯、不動 `font-size`／`border-radius`
