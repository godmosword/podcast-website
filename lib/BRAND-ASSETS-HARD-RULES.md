# 收聽平台品牌資產 — HARD RULES（不可更動）

> **效力：** 本檔與 `public/brand/*`、`lib/brand-assets.ts` 為平台圖示之唯一合法來源。  
> **違反處理：** PR 若改動下列禁止項，視為合規缺陷，必須還原。

## 1. 單一來源

| 允許 | 禁止 |
|------|------|
| `public/brand/` 內官方資產檔 | 在 `lib/connect-icons.tsx` 手繪 `PLATFORM_*` SVG path |
| `lib/brand-assets.ts` 登記的尺寸／背景／來源 | 以 `BRAND_COLORS.*` 當平台圖示底色 |
| `components/PlatformBrandMark.tsx` 渲染 | 各元件自行 `<svg>` 臨摹 Spotify／Apple／KKBOX／YouTube |

## 2. 各平台合規要點（查證日：2026-06-10）

### Spotify

- **資產：** `public/brand/spotify-icon-green.png`（官方綠色圖示）。
- **背景：** 僅可置於**白或黑**底（[Design Guidelines](https://developer.spotify.com/documentation/design)）。
- **禁止：** 白線條圖示疊在 `#1DB954` 自訂圓角底（非官方圖示呈現）。
- **尺寸：** 圖示顯示高度 ≥ 21px；建議容器 ≥ 32px。
- **搭配：** 必須保留文字標籤「Spotify」。

### Apple Podcasts

- **資產：** `public/brand/apple-podcasts-listen-badge-zh-hant.svg`（Apple 官方「在 Apple Podcasts 上收聽」徽章）。
- **禁止：** 自製 podcast 圖示、紫色 `#9933CC` 假徽章、單獨 Apple 標誌。
- **禁止：** 裁切、改色、陰影、旋轉徽章（[Identity Guidelines](https://marketing.services.apple/apple-podcasts-identity-guidelines)）。
- **搭配：** 使用完整徽章；空間不足時仍用徽章，不用自訂圖示替代。

### YouTube

- **資產：** `public/brand/youtube-icon.svg`（自官方 `youtube-logo.svg` 擷取之圖示區，路徑未修改）。
- **用途：** 與其他平台並列時用**圖示**而非完整字標（[Brand Resources](https://www.youtube.com/howyoutubeworks/resources/brand-resources/)）。
- **禁止：** 改 `#FF0000`／白播放鍵比例、紅底上再疊紅色全彩字標。
- **尺寸：** 圖示高度 ≥ 24px。

### KKBOX

- **資產：** `public/brand/kkbox-logo.svg`（標準色 `#09CEF6`）。
- **禁止：** 使用舊色 `#0073E6`、手繪音符 path、陰影／外框／改色。
- **搭配：** 白或淺色底；標準色 logo 優先。

## 3. 程式硬規則

1. **禁止刪除** `lib/brand-assets.test.ts` 內合規斷言。
2. **禁止** 在 `PlatformBrandMark` 外加 `filter`、`transform`、動畫於品牌資產。
3. **禁止** 以 CSS `background-color: platform.color` 包住平台圖示（社群 ICON 除外，見 `SOCIAL_ICON_PATHS`）。
4. **禁止** 在 `PLATFORM_MARKS` 為各平台設定不同顯示高度；統一外框僅能改 `PLATFORM_MARK_TILE`（`lib/brand-assets.ts`）與 `PlatformBrandMark.module.css` 變數。
5. 更換官方檔案時：**必須**同步更新 `public/brand/SOURCES.md` 與本檔查證日期。
6. Code review 檢查：`rg "PLATFORM_ICON_PATHS|buildTruckMission|9933CC|0073E6"` 不得出現於平台 UI 路徑（測試／歷史文件除外）。

## 4. 指示性使用聲明

各圖示僅用於連結至對應官方收聽頁，不代表代言。法律說明見 `/legal#trademarks`。
