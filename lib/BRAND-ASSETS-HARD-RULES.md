# 平台／社群品牌標誌 — HARD RULES

> **查證日：2026-10-12**（每次更換官方檔或重查規範時更新）
> **效力：** `public/brand/` 的官方檔、`lib/brand-marks.tsx` 的登記與 `components/BrandMark.tsx` 是站內平台與社群標誌唯一的來源。PR 若違反下列任一條，視為合規缺陷，必須還原。
> **守門：** `lib/brand-assets.test.ts`、`lib/brand-marks.test.ts`、`components/BrandMark.test.tsx`。

## 1. 一致化只能動三件事

| 可以統一 | 不可以動 |
|----------|----------|
| 標誌放在哪顆章、什麼底上 | 標誌的形狀、比例、顏色（只能用各家提供的色版） |
| 視覺尺寸（全站 30px，`BRAND_MARK_SIZE`） | 自己畫、臨摹、裁切或重組標誌 |
| 標誌與文字的間距、格線 | 對標誌加 scale、filter、opacity、陰影、外框、動畫 |

- **禁止**以品牌色當標誌底色（`background: p.color`、`social.background` 這類寫法）。`BRAND_COLORS` 只供邊框／強調（例如 `/studio` 卡片左緣）。
- **禁止**在 `lib/brand-marks.tsx` 以外為平台／社群寫 `<svg>` path。
- 互動只能讓標誌所在的章或列位移（`translate`），放品牌標誌的可點元件不縮放。

## 2. 版面規則

| 情境 | 元件 | 做法 |
|------|------|------|
| 純圖示格線 | `ConnectHub`（頁尾） | 60px 白章（日 `--card` 純白、夜 `--card-2`），`BrandMark surface="chip"` |
| 標誌＋文字同一個可點容器 | `SubscribeMenu`、`SubscribeForm`、`PlatformStudioCard` | 不加章；38px 寬槽位、與文字間距 ≥ 12px（30px 標誌與文字實距 ≥ 16px），`BrandMark surface="row"` |

色版規則（`lib/brand-marks.tsx` 的 `art`）：

- 純白章與其他日間淺色底（`--card` 為 `#ffffff`）→ Spotify 官方綠標、KKBOX 在白章用標準青、其他淺色底的 KKBOX／Threads 用黑色版。
- 深色底（夜間章 `#312e2a`／`#272422`，不是純黑）→ 白色版（Spotify、KKBOX、Threads、YouTube 白字字標）。純黑底才可改放 Spotify 綠標。
- Apple Podcasts 彩色圖示、Instagram 漸層圖示、Facebook 主標誌，日夜不變。
- YouTube 用完整字標，不使用裁切後的 `youtube-icon.svg`。字標比 60px 章寬，頁尾章改成膠囊，窄螢幕該格跨兩欄。

淨空解讀：標誌所在的底（章、按鈕、列）邊緣不算侵入淨空；淨空範圍內不得有其他文字或圖形。

## 3. 各家要點

### Apple Podcasts（[Identity Guidelines](https://marketing.services.apple/apple-podcasts-identity-guidelines)）

- **檔案：** `apple-podcasts-icon.png`（官方 `Apple_Podcasts_Icon_RGB_CI_082526.png` 等比縮小）。
- 圖示「只能用在一排形狀、大小相近的圖示裡」。本站依據：全站標誌統一 30px，頁尾 8 個標誌放在同一顆章裡。
- 彩色版優先；其他圖示也是白色或底很暗時才可用白色版；彩色底上可用黑色版。
- Avoid Mistakes：不可改成圓形、不可只取中間符號、不可改色、不可加底框。
- 與其他平台並列時排第一（`lib/platforms.ts` 第一個）。
- 同一頁不得同時出現 Apple 徽章與 Apple 圖示：`apple-podcasts-listen-badge-zh-hant.svg` 只作備存，元件不得引用。

### Spotify（[Design & Branding Guidelines](https://developer.spotify.com/documentation/design)）

- **檔案：** `spotify-icon-green.png`（Newsroom `Spotify_Primary_Logo_RGB_Green.png`，939×940 等比縮成 128×128，不改色、不裁切）、`spotify-icon-white.png`。`spotify-icon-black.png` 備存，目前畫面未引用。
- 空間不夠放完整 logo 時可只用圖示；最小 21px；淨空為圖示高度的一半。
- 綠標只放純白或純黑底。日間白章與文字列底是純白，用綠標。夜間底不是純黑，用白標。

### KKBOX（[品牌標誌](https://www.kkbox.com/about/tw/zh-tw/logo)，官網有機器人驗證，內容依搜尋摘要）

- **檔案：** `kkbox-logo.svg`（標準色 #09CEF6）、`kkbox-logo-black.svg`、`kkbox-logo-white.svg`（同一 path，換成官方黑／白色版）。
- 只有字標，沒有圖示；不可變形、改字距、改色、加陰影；淨空為一個 K 的寬與高。
- 待確認（TODOS）：向 KKBOX 索取正式檔、數位最小尺寸、淺底用青或黑。

### YouTube（[Brand Resources](https://brand.youtube/)，部分依搜尋摘要）

- **檔案：** `youtube-logo.svg`（日間）、`youtube-logo-dark.svg`（夜間白字）。完整字標，不裁成圖示。
- 顯示高 24px（規範最小 20px），寬依 492×110 原比例。淨空不小於播放鍵高度；頁尾膠囊左右留白，不把字標塞進 60px 圓章。
- 待確認（TODOS）：規範寫只有連到頻道時才能把標誌做成連結，現在連的是播放清單。

### Instagram、Threads、Facebook（[Meta Brand Resources](https://www.meta.com/brand/resources/)）

- **檔案：** `instagram-glyph-gradient.png`、`threads-logo-black.svg`、`threads-logo-white.svg`、`facebook-logo-primary.png`。來自各品牌公開資源頁，不另註冊帳號。
- Instagram：漸層圖示，日夜同一張；最小 29px；淨空為 glyph 的一半。
- Threads：淺色底黑、深色底白；寬 27px，高依 977×1082 原比例。淨空為寬度的 1/4。
- Facebook：完整的藍底白 f 主標誌，不可只用 f、不可改色；最小寬 16px；淨空為寬度的 1/4。名稱「Facebook」以一般 UI 標籤樣式呈現（不上品牌色、不與標誌組成一體）。

### Email

- 自有圖示，不受第三方規範；顏色用 `--accent-ink`。

## 4. 指示性使用

各標誌僅用於連結至對應官方頁面，不代表代言。法律說明見 `/legal#trademarks`。
