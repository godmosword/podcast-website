import { track } from "@vercel/analytics";
import type { ZoneId, ZoneStatus } from "@/data/universe-zones";
import type { WishCategory } from "@/lib/zone-wish-schema";
import type { ThemePreference } from "@/lib/theme";
import { recordPlatformClick, recordStoryCompleted } from "@/lib/engagement";
import type { ReturnVisitBucket } from "@/lib/return-visit";
import type { GameKitGameId } from "@/lib/gamekit/types";

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

/** 播放器第一次真正收到 play 事件；同一播放器 mount 只送一次。 */
export function trackStoryPlayStart(
  slug: string,
  source: "story_page" | "landing",
): void {
  safeTrack("story_play_start", { slug, source });
}

/**
 * 回訪（STEM-P1）：只送天數區間 bucket（見 lib/return-visit.ts 口徑），
 * 無時間戳、無識別碼、無孩子個資。
 */
export function trackReturnVisit(daysSince: ReturnVisitBucket): void {
  safeTrack("return_visit", { daysSince });
}

/** 樂園地圖：點擊島嶼。 */
export function trackUniverseZoneTap(zoneId: ZoneId, status: ZoneStatus): void {
  safeTrack("universe_zone_tap", { zoneId, status });
}

/** 樂園地圖：ZoneSheet 內出口連結。 */
export function trackUniverseSheetLink(zoneId: ZoneId, href: string): void {
  safeTrack("universe_sheet_link", { zoneId, href });
}

/** 樂園地圖：點擊漫遊車車打招呼（只送角色 id，不含 PII）。 */
export function trackUniverseRoamerTap(characterId: string): void {
  safeTrack("universe_roamer_tap", { characterId });
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

/** Email 訂閱表單送出（只送 source 標記，無 PII）。 */
export function trackSubscribeSubmit(source: string): void {
  safeTrack("subscribe_submit", { source });
}

export type ShareClickChannel = "copy_link" | "line";

/** 故事分享點擊（D12）：只送 slug + 管道，無 PII。 */
export function trackShareClick(slug: string, channel: ShareClickChannel): void {
  safeTrack("share_click", { slug, channel });
}

/** 遊戲頁進入信號；完成事件由 GameKit session 結果補上。 */
export function trackGameSessionStart(gameId: GameKitGameId): void {
  safeTrack("game_session_start", { gameId });
}

/** 遊戲產生結果時送出；不含分數，避免把兒童表現變成個人化追蹤資料。 */
export function trackGameSessionComplete(
  gameId: GameKitGameId,
  cleared: boolean,
): void {
  safeTrack("game_session_complete", { gameId, cleared });
}
