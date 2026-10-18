import type { Page } from "@playwright/test";

/**
 * 測試用：第 1–3 天先標成通關，大開始鈕才會進第 4 天。
 * 第 4 天就是現在的壽司屋（seed 7 的廚房、結算截圖才對得上）。
 * 每次進頁都會把天數設回去，不會改獎牌或貼紙。
 */
export async function pinClassicSushiDay(page: Page) {
  await page.addInitScript(() => {
    const key = "cheche:progress";
    const apply = () => {
      let raw: { preferences?: { gameKit?: Record<string, unknown> } } = {};
      try {
        raw = JSON.parse(localStorage.getItem(key) ?? "{}") as typeof raw;
      } catch {
        raw = {};
      }
      const preferences = raw.preferences ?? {};
      const gameKit = preferences.gameKit ?? {};
      gameKit.dinoSushiDays = [1, 1, 1, 0, 0, 0, 0, 0];
      preferences.gameKit = gameKit;
      raw.preferences = preferences;
      localStorage.setItem(key, JSON.stringify(raw));
    };
    apply();
  });
}
