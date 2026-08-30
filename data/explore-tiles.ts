/** 首頁探索區磁貼（Approved Plan D7=B）。
 *
 * 兒童辨識靠圖像與位置，不靠文字：磁貼一律「插畫／emoji 圖徽 ＋ 可見文字標籤」雙重編碼，
 * 圖徽為裝飾（`aria-hidden`），可及名稱由文字標籤承擔，避免螢幕閱讀器雙讀。
 *
 * 圖徽刻意沿用行動抽屜（`SiteNavBar` `MOBILE_MENU_ROWS`）的同一批 emoji，
 * 讓抽屜與磁貼牆是同一套視覺語言，且不新增任何圖片位元組（首頁首載預算）。
 *
 * 標籤一律使用 DESIGN.md「語言與命名」鎖定的名稱，不得改寫。
 */

export type ExploreTileAudience = "child" | "parent";

export type ExploreTile = {
  id: string;
  label: string;
  href: string;
  /** 裝飾圖徽；與行動抽屜同一批 emoji。 */
  emoji: string;
  audience: ExploreTileAudience;
};

/** 宇宙地圖不在此列——它由探索區左側的地圖大卡承接（避免同一入口出現兩次）。 */
export const EXPLORE_TILES = [
  { id: "stories", label: "全部故事", href: "/stories", emoji: "📖", audience: "child" },
  { id: "games", label: "遊樂園", href: "/games", emoji: "🎡", audience: "child" },
  { id: "coloring", label: "繪本著色", href: "/games/coloring-book", emoji: "🎨", audience: "child" },
  { id: "characters", label: "角色圖鑑", href: "/characters", emoji: "🚗", audience: "child" },
  { id: "for-parents", label: "親子指南", href: "/for-parents", emoji: "🧭", audience: "parent" },
  { id: "play-map", label: "親子景點", href: "/for-parents/play-map", emoji: "📍", audience: "parent" },
] as const satisfies readonly ExploreTile[];

/** 左側地圖大卡：宇宙地圖入口。美術沿用既有 zone 島嶼資產，不新增生圖。 */
export const EXPLORE_MAP_CARD = {
  label: "宇宙地圖",
  href: "/adventures",
  /** 既有資產（`public/adventures/zones/`），非本次新生成。
   * 尺寸取自 `car-park.tile.json` 的 `intrinsicPx.x3`（792×780，比例 ~1.015:1）——
   * x1 只有 264×260，在 280px CSS 寬 ×2–3 DPR 下會被放大糊掉；比例也不是 1:1。 */
  image: "/adventures/zones/car-park@3x.webp",
  imageWidth: 792,
  imageHeight: 780,
} as const;

/** 區塊標題。刻意不叫「探索」——該詞在導覽抽屜已是分組語彙，同名會混淆兩個層級。 */
export const EXPLORE_HEADING = "都去哪裡玩？";
