import { expect, type Page } from "@playwright/test";
import { PROGRESS_STORAGE_KEY } from "../lib/progress-store";

export type VisualTheme = "light" | "night";
export type VisualViewportId = "mobile" | "desktop";

type StabilizeOptions = {
  theme?: VisualTheme;
};

/**
 * 之後每次載入都用固定主題。預設「跟隨系統」會在當地 19:00–06:00 自動轉夜間；
 * CI 是 UTC，台灣早上跑的 CI 也會被當成睡前（#187：日間抽屜測試因此紅）。
 * 只對下一次 navigation 生效，要在 goto 前呼叫。
 */
export async function pinTheme(page: Page, theme: VisualTheme): Promise<void> {
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
}

/** D2：固定主題、停動畫、等圖載入，降低截圖抖動。 */
export async function stabilizeVisualPage(
  page: Page,
  options: StabilizeOptions = {},
): Promise<void> {
  const theme = options.theme ?? "light";
  await pinTheme(page, theme);
  if (process.env.VISUAL_FIXTURE === "1") {
    // 凍結資料的基準只能拿凍結資料的 build 比；server 是一般 build（例如 start 時沒帶旗標、讀到 .next）就立刻停。
    await expect(page.locator("html"), "伺服器不是 VISUAL_FIXTURE build").toHaveAttribute("data-visual-fixture", "1");
  }

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
        /* 故事卡、單集頁段落與頁尾用 content-visibility: auto；整頁截圖時不在視窗裡的不會畫，
           截出來是一片空白（ep-3 單集頁的頁尾一直是空的）。截圖一律全部畫出來。 */
        content-visibility: visible !important;
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

  // Next/Image may first render a small lazy candidate, then replace it with
  // the final responsive URL during hydration. In a long page Chromium can
  // abort that first request while the scroll sweep is moving, leaving the
  // final candidate permanently incomplete and making a full visual run hang.
  // Run the sweep first so every image has its final candidate, then lock each
  // one to that URL and make it eager for the test capture; pixels and source
  // art remain unchanged.
  //
  // 有 srcset 的圖不信 currentSrc，照 sizes＋srcset 的標準規則自己挑：平行跑時
  // hydration 可能還沒做完，currentSrc 停在別的候選。2026-10-25 實測消消樂封面
  // 平行 8 次有 1 次鎖到 w=384（其餘 w=640），縮放結果不同，基準每次重錄都會閃。
  await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.cssText = "position:absolute;visibility:hidden;height:0";
    document.body.appendChild(probe);
    const lengthPx = (length: string): number => {
      probe.style.width = length;
      return probe.getBoundingClientRect().width;
    };
    const slotWidth = (sizes: string): number => {
      for (const raw of sizes.split(/,(?![^(]*\))/)) {
        const part = raw.trim();
        const match = /^(\(.+\))\s+(\S.*)$/.exec(part);
        if (!match) return lengthPx(part);
        if (window.matchMedia(match[1]!).matches) return lengthPx(match[2]!);
      }
      return window.innerWidth;
    };
    const pickCandidate = (image: HTMLImageElement): string | null => {
      const srcset = image.getAttribute("srcset");
      if (!srcset) return null;
      const candidates = srcset
        .split(/,\s+/)
        .map((entry) => entry.trim().split(/\s+/))
        .map(([url, descriptor = "1x"]) => ({
          url: url!,
          unit: descriptor.slice(-1),
          value: Number.parseFloat(descriptor),
        }))
        .sort((a, b) => a.value - b.value);
      const unit = candidates[0]?.unit;
      if (!unit || candidates.some((c) => c.unit !== unit)) return null;
      const dpr = window.devicePixelRatio || 1;
      const want =
        unit === "w" ? slotWidth(image.getAttribute("sizes") || "100vw") * dpr : dpr;
      const chosen =
        candidates.find((c) => c.value >= want) ?? candidates[candidates.length - 1];
      return chosen ? new URL(chosen.url, document.baseURI).href : null;
    };
    const picked = new Map(
      [...document.images].map((image) => [image, pickCandidate(image)]),
    );
    probe.remove();

    for (const source of document.querySelectorAll("picture source[srcset]")) {
      source.removeAttribute("srcset");
    }
    for (const image of document.images) {
      const source = picked.get(image) || image.currentSrc || image.src;
      image.removeAttribute("srcset");
      image.loading = "eager";
      if (source) image.src = source;
    }
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
