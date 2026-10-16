// ============================================================
// 車車遊樂園 — 收聽平台連結（單一資料來源）
// ============================================================
// 這裡集中管理「整個節目」的收聽平台連結。
// 頁尾、關於頁、每集故事頁的平台圖示都讀這份資料，改一次即全站同步。
//
// 要新增 / 換連結：改下方 url 即可；標誌由 components/BrandMark.tsx 依官方檔渲染
// （規則見 lib/BRAND-ASSETS-HARD-RULES.md）。
// url 留空字串的項目會自動隱藏。
// ============================================================

/** 標誌識別字，對應 lib/brand-marks.tsx。 */
export type PlatformIcon = "apple" | "spotify" | "kkbox" | "youtube";

export type Platform = {
  /** 顯示名稱（也作為 aria-label） */
  label: string;
  /** 收聽連結 */
  url: string;
  /** 品牌圖示識別字 */
  icon: PlatformIcon;
};

/** 收聽平台清單（顯示順序即陣列順序）。Apple 規定與其他平台並列時排第一。 */
const PLATFORMS: Platform[] = [
  {
    label: "Apple Podcasts",
    url: "https://podcasts.apple.com/tw/podcast/%E8%BB%8A%E8%BB%8A%E9%81%8A%E6%A8%82%E5%9C%92/id1896610920",
    icon: "apple",
  },
  {
    label: "Spotify",
    url: "https://open.spotify.com/show/2Ohik6D77MvLTyqHbM6CYt",
    icon: "spotify",
  },
  {
    label: "KKBOX",
    url: "https://podcast.kkbox.com/tw/channel/4lgSa7YAwpk6neQme3",
    icon: "kkbox",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
    icon: "youtube",
  },
];

/** 只取有填連結的平台。 */
export function visiblePlatforms(): Platform[] {
  return PLATFORMS.filter((p) => p.url.trim() !== "");
}

/**
 * 各平台「節目頁」canonical 網址（供 PodcastSeries JSON-LD 的 sameAs 使用）。
 * 去除追蹤查詢參數，只留 origin + pathname；不含空連結。
 */
export function platformShowUrls(): string[] {
  return visiblePlatforms().map((p) => {
    const url = new URL(p.url);
    return `${url.origin}${url.pathname}`;
  });
}
