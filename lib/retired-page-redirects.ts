/**
 * 已退役的獨立頁 → 接手的頁面（永久）。
 *
 * `/for-parents`（親子指南）2026-10-18 併進 `/about`：常見問題與代表集數搬到關於頁，
 * 每集共讀內容回到各集故事頁。這頁進過 sitemap 與 llms.txt，不轉址就會吃 404。
 * 只轉這一個路徑，`/for-parents/*` 子頁（儀表板、親子景點、育兒文章…）照舊。
 */
const RETIRED_PAGES = [{ source: "/for-parents", destination: "/about" }] as const;

export function retiredPageRedirects(): {
  source: string;
  destination: string;
  permanent: boolean;
}[] {
  return RETIRED_PAGES.map(({ source, destination }) => ({
    source,
    destination,
    permanent: true,
  }));
}
