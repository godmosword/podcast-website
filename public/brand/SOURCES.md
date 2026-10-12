# 第三方品牌資產來源（唯讀）

站內平台標誌一律由 `components/BrandMark.tsx` 讀這裡的官方檔（登記在 `lib/brand-marks.tsx`），規則見 `lib/BRAND-ASSETS-HARD-RULES.md`。檔案只可等比縮放，不可改形、改色或裁切；更換檔案時同步更新本表與硬規則檔的查證日。

| 檔案 | 平台 | 來源 | 擷取日期 |
|------|------|------|----------|
| `apple-podcasts-icon.png` | Apple Podcasts | [Apple Podcasts Identity Guidelines](https://marketing.services.apple/apple-podcasts-identity-guidelines) → Apple Podcasts Icon「Download」（apple.box.com，`Apple_Podcasts_Icon_RGB_CI_082526.png`，原始 2048×2048）；等比縮成 128×128 | 2026-10-12 |
| `spotify-icon-green.png` | Spotify | [Spotify Newsroom — Logo and Brand Assets](https://newsroom.spotify.com/media-kit/logo-and-brand-assets/)（`Spotify_Primary_Logo_RGB_Green.png`，原始 939×940）；等比縮成 128×128 | 2026-10-12 |
| `spotify-icon-black.png` | Spotify | 同上（`Spotify_Primary_Logo_RGB_Black.png`） | 2026-10-12 |
| `spotify-icon-white.png` | Spotify | 同上（`Spotify_Primary_Logo_RGB_White.png`） | 2026-10-12 |
| `youtube-icon.svg` | YouTube | 自 [gstatic 官方 `youtube-logo.svg`](https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg) 擷取圖示區（路徑未改） | 2026-06-10 |
| `kkbox-logo.svg` | KKBOX | [Wikimedia Commons — KKBOX logo.svg](https://commons.wikimedia.org/wiki/File:KKBOX_logo.svg)（標準色 `#09CEF6`）；KKBOX 官網無公開下載，正式檔待索取 | 2026-06-10 |
| `kkbox-logo-black.svg` | KKBOX | 同上 path，填色換成 KKBOX 規範的黑色版（淺色底用） | 2026-10-12 |
| `kkbox-logo-white.svg` | KKBOX | 同上 path，填色換成 KKBOX 規範的白色版（深色底用） | 2026-10-12 |
| `apple-podcasts-listen-badge-zh-hant.svg` | Apple Podcasts | [Apple Media Services Badges API](https://tools.applemediaservices.com/api/badges/listen-on-apple-podcasts/badge/zh-tw)；**備存，元件不得引用**（Apple 規定徽章與圖示不可同時出現） | 2026-06-10 |
| `youtube-logo.svg` | YouTube | [gstatic 官方完整標誌](https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg)（備存） | 2026-06-10 |

Instagram、Threads、Facebook 的官方檔要在 [Meta Brand Resource Center](https://www.meta.com/brand/resources/) 由本人接受條款後下載，尚未取得；過渡期圖形在 `lib/brand-marks.tsx`（`interim: true`）。
