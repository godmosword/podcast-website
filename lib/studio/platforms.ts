import type { PlatformIcon } from "@/lib/platforms";
import { visiblePlatforms } from "@/lib/platforms";

export type StudioIcon = PlatformIcon | "soundon" | "vercel";

export type StudioPlatform = {
  id: string;
  label: string;
  hint: string;
  analyticsUrl: string;
  color: string;
  icon: StudioIcon;
  /** 對應 lib/platforms.ts 的 label，用於「聽眾頁」連結 */
  listenPlatformLabel?: string;
};

const STUDIO_PLATFORMS: StudioPlatform[] = [
  {
    id: "spotify",
    label: "Spotify for Podcasters",
    hint: "收聽數 · 完聽率 · 訂閱來源",
    analyticsUrl: "https://podcasters.spotify.com/",
    color: "#1DB954",
    icon: "spotify",
    listenPlatformLabel: "Spotify",
  },
  {
    id: "apple",
    label: "Apple Podcasts Connect",
    hint: "播放次數 · 聽眾 · 追蹤者",
    analyticsUrl: "https://podcastsconnect.apple.com/",
    color: "#9933CC",
    icon: "apple",
    listenPlatformLabel: "Apple Podcasts",
  },
  {
    id: "soundon",
    label: "SoundOn 創作者後台",
    hint: "託管來源 · 節目數據 · 上架管理",
    analyticsUrl: "https://soundon.fm/",
    color: "#ff5500",
    icon: "soundon",
  },
  {
    id: "kkbox",
    label: "KKBOX Podcast",
    hint: "頻道數據 · 收聽表現",
    analyticsUrl: "https://podcast.kkbox.com/tw/",
    color: "#0073E6",
    icon: "kkbox",
    listenPlatformLabel: "KKBOX",
  },
  {
    id: "youtube",
    label: "YouTube Studio",
    hint: "播放清單觀看 · 訂閱 · 流量來源",
    analyticsUrl: "https://studio.youtube.com/",
    color: "#FF0000",
    icon: "youtube",
    listenPlatformLabel: "YouTube",
  },
  {
    id: "vercel",
    label: "Vercel 專案分析",
    hint: "官網流量 · 頁面瀏覽 · Web Vitals",
    analyticsUrl: "https://vercel.com/",
    color: "#000000",
    icon: "vercel",
  },
];

export function studioPlatforms(): StudioPlatform[] {
  return STUDIO_PLATFORMS.filter((p) => p.analyticsUrl.trim() !== "");
}

/** 從公開收聽平台清單取得聽眾頁 URL（不重複維護）。 */
export function listenUrlForStudioPlatform(
  platform: StudioPlatform,
): string | undefined {
  if (!platform.listenPlatformLabel) return undefined;
  const hit = visiblePlatforms().find(
    (p) => p.label === platform.listenPlatformLabel,
  );
  const url = hit?.url?.trim();
  return url || undefined;
}
