/**
 * 已退役遊戲路由 → `/games`（永久）。
 *
 * 這些 slug 曾進過 sitemap 與 OG 分享卡，移除頁面後若不導向，
 * 搜尋結果、已分享連結與書籤都會直接吃 404。
 */
export const RETIRED_GAME_SLUGS = [
  "car-adventure",
  "candy-kart",
  "snowboard",
] as const;

export function retiredGameRedirects(): {
  source: string;
  destination: string;
  permanent: boolean;
}[] {
  return RETIRED_GAME_SLUGS.map((slug) => ({
    source: `/games/${slug}`,
    destination: "/games",
    permanent: true,
  }));
}
