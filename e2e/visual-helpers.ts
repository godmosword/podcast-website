import type { Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";

export type VisualTheme = "light" | "night";
export type VisualViewportId = "mobile" | "desktop";

type StabilizeOptions = {
  theme?: VisualTheme;
};

/** D2：固定主題、停動畫、等圖載入，降低截圖抖動。 */
export async function stabilizeVisualPage(
  page: Page,
  options: StabilizeOptions = {},
): Promise<void> {
  const theme = options.theme ?? "light";

  await page.addInitScript(
    ({
      storageKey,
      themeMode,
    }: {
      storageKey: string;
      themeMode: string;
    }) => {
      try {
        const raw = localStorage.getItem(storageKey);
        const parsed = raw
          ? (JSON.parse(raw) as { preferences?: { theme?: string } })
          : {};
        parsed.preferences = { ...parsed.preferences, theme: themeMode };
        localStorage.setItem(storageKey, JSON.stringify(parsed));
      } catch {
        localStorage.setItem(
          storageKey,
          JSON.stringify({ preferences: { theme: themeMode } }),
        );
      }
    },
    { storageKey: PROGRESS_STORAGE_KEY, themeMode: theme },
  );

  // addInitScript 只會在下一次 navigation 執行；呼叫端通常已先 goto，
  // reload 讓 ThemeProvider 在 mount 前讀到固定主題，避免當地 bedtime 污染截圖。
  await page.reload();

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

  await page.locator("html").evaluate((el, themeMode: string) => {
    if (themeMode === "night") {
      el.setAttribute("data-theme", "night");
      el.setAttribute("data-bedtime", "");
    } else {
      el.removeAttribute("data-theme");
      el.removeAttribute("data-bedtime");
    }
  }, theme);
}
