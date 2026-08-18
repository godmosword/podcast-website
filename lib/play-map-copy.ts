/**
 * 親子遊樂地圖結果摘要文案。
 * 手機首屏只講一次範圍＋筆數，避免「地點清單／全台資料庫／適合親子出遊」三套說法。
 */

export function playMapResultTitle(args: {
  count: number;
  city: string | null;
  nearbyActive: boolean;
  viewportSearchActive: boolean;
}): string {
  const { count, city, nearbyActive, viewportSearchActive } = args;
  if (viewportSearchActive) return `這個區域・${count} 個適合的地方`;
  if (nearbyActive) return `附近・${count} 個適合的地方`;
  if (city) return `${city}・${count} 個適合的地方`;
  return `全台・${count} 個適合的地方`;
}
