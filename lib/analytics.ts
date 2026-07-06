import { track } from "@vercel/analytics";
import type { ZoneId, ZoneStatus } from "@/data/universe-zones";
import type { WishCategory } from "@/lib/zone-wish-schema";
import type { ThemePreference } from "@/lib/theme";
import { recordPlatformClick, recordStoryCompleted } from "@/lib/engagement";

export type PlatformClickSource =
  | "story-cta"
  | "story-platforms"
  | "footer-connect"
  | "home-subscribe"
  | "subscription-cta"
  | "nav-bar"
  | "nav-dropdown"
  | "nav-menu";

function safeTrack(event: string, data: Record<string, string | boolean>): void {
  try {
    track(event, data);
  } catch {
    // 開發環境或未部署時靜默略過。
  }
}

/** 平台外連點擊：本機 engagement + Vercel Analytics 自訂事件。 */
export function trackPlatformClick(
  platform: string,
  source: PlatformClickSource,
): void {
  recordPlatformClick(platform);
  safeTrack("platform_click", { platform, source });
}

/**
 * 完播（STEM-P1 對外事件口徑，single source of truth）：
 * - 觸發：native audio `ended` 且非 repeat（StoryPlayer 播放結束 effect，與本機紀錄同一觸發點）。
 * - 計次：每次完整播放送一次事件（含 replay 後再聽完，量測重聽價值）；
 *   本機 `engagement.storiesCompleted` 維持 unique-slug 去重（地圖星章／家長儀表板不變）。
 * - Payload：只送 `{ slug }`——無時間戳、無播放進度、無孩子個資。
 */
export function trackStoryCompleted(slug: string): void {
  recordStoryCompleted(slug);
  safeTrack("story_completed", { slug });
}

/** 樂園地圖：點擊島嶼。 */
export function trackUniverseZoneTap(zoneId: ZoneId, status: ZoneStatus): void {
  safeTrack("universe_zone_tap", { zoneId, status });
}

/** 樂園地圖：ZoneSheet 內出口連結。 */
export function trackUniverseSheetLink(zoneId: ZoneId, href: string): void {
  safeTrack("universe_sheet_link", { zoneId, href });
}

/** 樂園地圖：日夜切換（只送目標主題，不含 PII）。 */
export function trackUniverseDayNightToggle(to: ThemePreference): void {
  safeTrack("universe_daynight_toggle", { to });
}

/** 樂園地圖：許願表單送出（只送 hasEmail 布林）。 */
export function trackUniverseWishSubmit(zoneId: ZoneId, hasEmail: boolean): void {
  safeTrack("universe_wish_submit", { zoneId, hasEmail });
}

/** 許願表單送出（只送 category，不含內容文字與 PII）。 */
export function trackWishSubmitted(category: WishCategory): void {
  safeTrack("wish_submitted", { category });
}
