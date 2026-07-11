import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";

/** D2-A smoke：固定 light 主題、停動畫、等圖載入，降低截圖抖動。 */
export async function stabilizeVisualPage(page: Page): Promise<void> {
  await page.addInitScript((storageKey) => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? (JSON.parse(raw) as { preferences?: { theme?: string } }) : {};
      parsed.preferences = { ...parsed.preferences, theme: "light" };
      localStorage.setItem(storageKey, JSON.stringify(parsed));
    } catch {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ preferences: { theme: "light" } }),
      );
    }
  }, PROGRESS_STORAGE_KEY);

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        caret-color: transparent !important;
      }
    `,
  });

  await page.evaluate(async () => {
    const step = 480;
    let y = 0;
    const max = document.body.scrollHeight;
    while (y < max) {
      window.scrollTo(0, y);
      y += step;
      await new Promise((r) => setTimeout(r, 80));
    }
    window.scrollTo(0, 0);
  });

  await page.waitForFunction(
    () =>
      [...document.images].every((img) => {
        if (!img.src || img.src.startsWith("data:")) return true;
        return img.complete;
      }),
    undefined,
    { timeout: 20_000 },
  );
  await page.locator("html").evaluate((el) => {
    el.removeAttribute("data-theme");
  });
}
