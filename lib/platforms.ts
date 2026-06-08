// ============================================================
// 車車遊樂園 — 收聽平台連結（單一資料來源）
// ============================================================
// 這裡集中管理「整個節目」的收聽平台連結。
// 頁尾、關於頁、每集故事頁的平台圖示都讀這份資料，改一次即全站同步。
//
// 要新增 / 換連結：改下方 url 即可；icon 對應 lib/connect-icons.tsx
// 內的品牌圖示。url 留空字串的項目會自動隱藏，避免失效連結。
// ============================================================

/** 圖示識別字，對應 PlatformLinks 內的 SVG。 */
export type PlatformIcon = "apple" | "spotify" | "kkbox" | "youtube";

export type Platform = {
  /** 顯示名稱（也作為 aria-label） */
  label: string;
  /** 收聽連結 */
  url: string;
  /** 品牌主色（圖示底色） */
  color: string;
  /** 品牌圖示識別字 */
  icon: PlatformIcon;
};

/** 收聽平台清單（顯示順序即陣列順序；Spotify、Apple 優先）。 */
const PLATFORMS: Platform[] = [
  {
    label: "Spotify",
    url: "https://open.spotify.com/show/2Ohik6D77MvLTyqHbM6CYt",
    color: "#1DB954",
    icon: "spotify",
  },
  {
    label: "Apple Podcasts",
    url: "https://podcasts.apple.com/tw/podcast/%E8%BB%8A%E8%BB%8A%E9%81%8A%E6%A8%82%E5%9C%92/id1896610920",
    color: "#9933CC",
    icon: "apple",
  },
  {
    label: "KKBOX",
    url: "https://podcast.kkbox.com/tw/channel/4lgSa7YAwpk6neQme3",
    color: "#0073E6",
    icon: "kkbox",
  },
  {
    label: "YouTube",
    url: "https://www.youtube.com/playlist?list=PLVbyl20K8lOeuJ2ky6dEsmpew7xAxZDhF",
    color: "#FF0000",
    icon: "youtube",
  },
];

/** 只取有填連結的平台。 */
export function visiblePlatforms(): Platform[] {
  return PLATFORMS.filter((p) => p.url.trim() !== "");
}
