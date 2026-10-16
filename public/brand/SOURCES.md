# 第三方品牌資產來源

站內平台與社群標誌由 `components/BrandMark.tsx` 讀這裡的檔案（登記在 `lib/brand-marks.tsx`），規則見 `lib/BRAND-ASSETS-HARD-RULES.md`。檔案只可等比縮放，不可改形、改色或裁切。電子郵件圖示不在這個目錄，是本站自有信封（`lib/brand-marks.tsx`）。

| 檔案 | 平台 | 怎麼用 | 來源 |
|------|------|--------|------|
| `apple-podcasts-icon.png` | Apple Podcasts | 圖示 30×30px，與其他平台並列時排第一。徽章檔不與圖示同頁使用 | [Apple Podcasts Identity Guidelines](https://marketing.services.apple/apple-podcasts-identity-guidelines) 的 Icon（`Apple_Podcasts_Icon_RGB_CI_082526.png`），等比縮成 128×128。擷取 2026-10-12 |
| `spotify-icon-black.png` | Spotify | 淺色介面（含頁尾白章），圖示 30×30px（規範最小 21px） | [Spotify Newsroom](https://newsroom.spotify.com/media-kit/logo-and-brand-assets/) 的 `Spotify_Primary_Logo_RGB_Black.png`，等比縮成 128×128。不用綠色檔。擷取 2026-10-12 |
| `spotify-icon-white.png` | Spotify | 深色介面，尺寸同上 | 同上，`Spotify_Primary_Logo_RGB_White.png` |
| `youtube-logo.svg` | YouTube | 淺色介面完整字標，高 24px（規範最小 20px） | [YouTube 品牌資源](https://www.youtube.com/howyoutubeworks/resources/brand-resources/)；[`youtubelogo.svg`](https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo.svg) |
| `youtube-logo-dark.svg` | YouTube | 深色介面白字完整字標，尺寸同上 | [`youtubelogo_dark.svg`](https://www.gstatic.com/youtube/img/branding/youtubelogo/svg/youtubelogo_dark.svg) |
| `instagram-glyph-gradient.png` | Instagram | 漸層圖示 30×30px（規範最小 29px）。官方 5000×5000 PNG 等比縮成 256×256，沒有裁切或改色 | [Instagram 品牌資源](https://www.meta.com/brand/resources/instagram/instagram-brand/) 的 Gradient Glyph |
| `facebook-logo-primary.png` | Facebook | 主標誌 30×30px（規範最小寬 16px） | [Facebook 標誌規範](https://www.meta.com/brand/resources/facebook/logo/) 的 Primary Logo |
| `threads-logo-black.svg` | Threads | 淺色介面，寬 27px，高依原比例 | [Threads 品牌資源](https://www.meta.com/brand/resources/threads/) |
| `threads-logo-white.svg` | Threads | 深色介面，尺寸同上 | 同上 |
| `kkbox-logo.svg` | KKBOX | 白章用的標準色字標（`#09CEF6`）。不是向 KKBOX 索取的正式套件 | [Wikimedia Commons — KKBOX logo.svg](https://commons.wikimedia.org/wiki/File:KKBOX_logo.svg) |
| `kkbox-logo-black.svg` | KKBOX | 其他淺色底 | 同上 path，填色換成黑色 |
| `kkbox-logo-white.svg` | KKBOX | 深色底 | 同上 path，填色換成白色 |
| `apple-podcasts-listen-badge-zh-hant.svg` | Apple Podcasts | **備存，元件不得引用**（徽章與圖示不可同時出現） | [Apple Media Services「在 Apple Podcasts 收聽」繁中徽章](https://tools.applemediaservices.com/api/badges/listen-on-apple-podcasts/badge/zh-tw) |

已下架、不得再引用：`youtube-icon.svg`（自完整字標裁出的圖示）、`spotify-icon-green.png`。

Meta 的圖檔可從上述品牌頁取得，不需建立帳號。下載網址若帶會過期的簽章，這裡記品牌頁，不記暫時連結。
