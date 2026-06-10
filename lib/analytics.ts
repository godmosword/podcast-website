import { track } from "@vercel/analytics";
import { recordPlatformClick } from "@/lib/engagement";

export type PlatformClickSource =
  | "story-cta"
  | "story-platforms"
  | "footer-connect"
  | "home-subscribe"
  | "subscription-cta";

/** 平台外連點擊：本機 engagement + Vercel Analytics 自訂事件。 */
export function trackPlatformClick(
  platform: string,
  source: PlatformClickSource,
): void {
  recordPlatformClick(platform);
  try {
    track("platform_click", { platform, source });
  } catch {
    // 開發環境或未部署時靜默略過。
  }
}
